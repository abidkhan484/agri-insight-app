import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { calculateJeevamrutha } from '../utils/zbnf-formulas';
import log from '../logger';

const InputLogger = () => {
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Jeevamrutha');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Liters');
  const [cost, setCost] = useState('0');

  const plots = useLiveQuery(() => db.plots.toArray());
  const inputs = useLiveQuery(() => db.inputs.reverse().toArray());

  const selectedPlot = plots?.find(p => p.id === parseInt(plotId));

  // Calculate area in decimals for Jeevamrutha tool
  let areaDecimal = 0;
  if (selectedPlot) {
    if (selectedPlot.areaUnit === 'Acre') areaDecimal = selectedPlot.area * 100;
    else if (selectedPlot.areaUnit === 'Decimal') areaDecimal = selectedPlot.area;
    else if (selectedPlot.areaUnit === 'Bigha') areaDecimal = selectedPlot.area * 33;
  }

  const jeevamruthaNeeds = areaDecimal > 0 ? calculateJeevamrutha(areaDecimal) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) return alert('Please select a plot');
    try {
      await db.inputs.add({
        plotId: parseInt(plotId),
        date,
        type,
        quantity: parseFloat(quantity),
        quantityUnit: unit,
        cost: parseFloat(cost)
      });
      setQuantity('');
      setCost('0');
      log.info('Input logged successfully');
    } catch (error) {
      log.error('Failed to log input:', error);
    }
  };

  const deleteInput = async (id) => {
    try {
      await db.inputs.delete(id);
      log.info('Input deleted:', id);
    } catch (error) {
      log.error('Failed to delete input:', error);
    }
  };

  return (
    <div>
      <h2>উপকরণ প্রয়োগ (Input Logging)</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>জমি নির্বাচন করুন (Select Plot):</label>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
            <option value="">জমি বেছে নিন (Choose Plot)</option>
            {plots?.map(plot => (
              <option key={plot.id} value={plot.id}>{plot.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>তারিখ (Date):</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>উপকরণের ধরন (Input Type):</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Jeevamrutha">জীওয়ামৃত (Jeevamrutha)</option>
            <option value="Ghanajeevamrutha">ঘনজীওয়ামৃত (Ghanajeevamrutha)</option>
            <option value="Seeds">বীজ (Seeds)</option>
            <option value="Labor">শ্রম (Labor)</option>
            <option value="Other">অন্যান্য (Other)</option>
          </select>
        </div>

        {type === 'Jeevamrutha' && areaDecimal > 0 && jeevamruthaNeeds && (
          <div className="calculator-box">
            <h4>জীওয়ামৃত ক্যালকুলেটর ({areaDecimal.toFixed(2)} শতাংশের জন্য হিসাব)</h4>
            <p>গোবর: {jeevamruthaNeeds.cow_dung_kg} কেজি</p>
            <p>গোমূত্র: {jeevamruthaNeeds.cow_urine_liters} লিটার</p>
            <p>গুড়: {jeevamruthaNeeds.jaggery_kg} কেজি</p>
            <p>বেসন: {jeevamruthaNeeds.pulse_flour_kg} কেজি</p>
            <p>মাটি: {jeevamruthaNeeds.soil_handful} মুঠো</p>
            <p>জল: {jeevamruthaNeeds.water_liters} লিটার</p>
          </div>
        )}

        <div className="form-group">
          <label>পরিমাণ (Quantity):</label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>একক (Unit):</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Liters, KG, etc."
          />
        </div>

        <div className="form-group">
          <label>খরচ (Cost - TK):</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>

        <button type="submit">সংরক্ষণ করুন (Save Input)</button>
      </form>

      <div className="list">
        <h3>প্রয়োগের তালিকা (Input History)</h3>
        {inputs?.map(input => {
          const plot = plots?.find(p => p.id === input.plotId);
          return (
            <div key={input.id} className="list-item">
              <div>
                <strong>{input.date}</strong>: {input.type} ({input.quantity} {input.quantityUnit})
                <br />
                <small>জমি: {plot?.name || 'Unknown'}</small>
              </div>
              <button className="delete-btn" onClick={() => deleteInput(input.id)}>মুছুন</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InputLogger;
