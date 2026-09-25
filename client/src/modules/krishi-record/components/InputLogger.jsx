import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import { calculateJeevamrutha } from '../utils/zbnf-formulas';
import log from '../logger';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

const InputLogger = () => {
  const { isBangla } = useLanguage();
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Jeevamrutha');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Liters');
  const [cost, setCost] = useState('0');

  const plots = useLiveQuery(() => 
    db.plots.filter(p => p.sync_status !== 'deleted').toArray()
  );
  const inputs = useLiveQuery(() => 
    db.inputs.filter(i => i.sync_status !== 'deleted').reverse().toArray()
  );

  const selectedPlot = plots?.find(p => p.id === plotId);
  
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
    if (!plotId) return alert(isBangla ? 'জমি নির্বাচন করুন' : 'Please select a plot');
    try {
      await db.inputs.add({
        id: generateId(),
        plotId: plotId,
        date,
        type,
        quantity: parseFloat(quantity),
        quantityUnit: unit,
        cost: parseFloat(cost),
        sync_status: 'dirty',
        updated_at: new Date().toISOString()
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
      await db.inputs.update(id, { 
        sync_status: 'deleted',
        updated_at: new Date().toISOString()
      });
      log.info('Input marked for deletion:', id);
    } catch (error) {
      log.error('Failed to delete input:', error);
    }
  };

  return (
    <div>
      <h2><LanguageText bn="উপকরণ প্রয়োগ" en="Input logging" /></h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><LanguageText bn="জমি নির্বাচন করুন" en="Select plot" />:</label>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
            <option value="">{isBangla ? 'জমি বেছে নিন' : 'Choose plot'}</option>
            {plots?.map(plot => (
              <option key={plot.id} value={plot.id}>{plot.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label><LanguageText bn="তারিখ" en="Date" />:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div className="form-group">
          <label><LanguageText bn="উপকরণের ধরন" en="Input type" />:</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Jeevamrutha">{isBangla ? 'জীবামৃত' : 'Jeevamrutha'}</option>
            <option value="Ghanajeevamrutha">{isBangla ? 'ঘনজীবামৃত' : 'Ghanajeevamrutha'}</option>
            <option value="Seeds">{isBangla ? 'বীজ' : 'Seeds'}</option>
            <option value="Labor">{isBangla ? 'শ্রম' : 'Labor'}</option>
            <option value="Other">{isBangla ? 'অন্যান্য' : 'Other'}</option>
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
          <label><LanguageText bn="পরিমাণ" en="Quantity" />:</label>
          <input 
            type="number" 
            step="0.01" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label><LanguageText bn="একক" en="Unit" />:</label>
          <input 
            type="text" 
            value={unit} 
            onChange={(e) => setUnit(e.target.value)} 
            placeholder="Liters, KG, etc."
          />
        </div>

        <div className="form-group">
          <label><LanguageText bn="খরচ (টাকা)" en="Cost (TK)" />:</label>
          <input 
            type="number" 
            value={cost} 
            onChange={(e) => setCost(e.target.value)} 
          />
        </div>

        <button type="submit"><LanguageText bn="সংরক্ষণ করুন" en="Save input" /></button>
      </form>

      <div className="list">
        <h3><LanguageText bn="প্রয়োগের তালিকা" en="Input history" /></h3>
        {inputs?.map(input => {
          const plot = plots?.find(p => p.id === input.plotId);
          return (
            <div key={input.id} className="list-item">
              <div>
                <strong>{input.date}</strong>: {input.type} ({input.quantity} {input.quantityUnit}) 
                <br />
                <small>{isBangla ? 'জমি' : 'Plot'}: {plot?.name || 'Unknown'}</small>
              </div>
              <button className="delete-btn" onClick={() => deleteInput(input.id)}><LanguageText bn="মুছুন" en="Delete" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InputLogger;
