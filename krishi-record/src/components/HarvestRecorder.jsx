import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import log from '../logger';

const HarvestRecorder = () => {
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [revenue, setRevenue] = useState('0');

  const plots = useLiveQuery(() => db.plots.toArray());
  const harvests = useLiveQuery(() => db.harvests.reverse().toArray());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) return alert('Please select a plot');
    try {
      await db.harvests.add({
        plotId: parseInt(plotId),
        date,
        crop,
        quantity: parseFloat(quantity),
        quantityUnit: unit,
        revenue: parseFloat(revenue)
      });
      setCrop('');
      setQuantity('');
      setRevenue('0');
      log.info('Harvest recorded');
    } catch (error) {
      log.error('Failed to record harvest:', error);
    }
  };

  const deleteHarvest = async (id) => {
    try {
      await db.harvests.delete(id);
      log.info('Harvest deleted:', id);
    } catch (error) {
      log.error('Failed to delete harvest:', error);
    }
  };

  return (
    <div>
      <h2>ফসল সংগ্রহ (Harvest Recording)</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>জমি নির্বাচন করুন (Select Plot):</label>
          <select value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
            <option value="">জমি বেছে নিন</option>
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
          <label>ফসলের নাম (Crop Name):</label>
          <input
            type="text"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            required
            placeholder="উদাঃ আমন ধান"
          />
        </div>

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
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="KG">কেজি (KG)</option>
            <option value="Quintal">কুইন্টাল (Quintal)</option>
            <option value="Mound">মণ (Mound)</option>
            <option value="Ton">টন (Ton)</option>
          </select>
        </div>

        <div className="form-group">
          <label>বিক্রয় মূল্য (Revenue - TK):</label>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
          />
        </div>

        <button type="submit">সংরক্ষণ করুন (Save Harvest)</button>
      </form>

      <div className="list">
        <h3>সংগ্রহের তালিকা (Harvest History)</h3>
        {harvests?.map(h => {
          const plot = plots?.find(p => p.id === h.plotId);
          return (
            <div key={h.id} className="list-item">
              <div>
                <strong>{h.date}</strong>: {h.crop} ({h.quantity} {h.quantityUnit})
                <br />
                <small>জমি: {plot?.name || 'Unknown'} | আয়: {h.revenue} টাকা</small>
              </div>
              <button className="delete-btn" onClick={() => deleteHarvest(h.id)}>মুছুন</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestRecorder;
