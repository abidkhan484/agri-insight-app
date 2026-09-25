import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import log from '../logger';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

const HarvestRecorder = () => {
  const { isBangla } = useLanguage();
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('KG');
  const [revenue, setRevenue] = useState('0');

  const plots = useLiveQuery(() => 
    db.plots.filter(p => p.sync_status !== 'deleted').toArray()
  );
  const harvests = useLiveQuery(() => 
    db.harvests.filter(h => h.sync_status !== 'deleted').reverse().toArray()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) return alert(isBangla ? 'জমি নির্বাচন করুন' : 'Please select a plot');
    try {
      await db.harvests.add({
        id: generateId(),
        plotId: plotId,
        date,
        crop,
        quantity: parseFloat(quantity),
        quantityUnit: unit,
        revenue: parseFloat(revenue),
        sync_status: 'dirty',
        updated_at: new Date().toISOString()
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
      await db.harvests.update(id, { 
        sync_status: 'deleted',
        updated_at: new Date().toISOString()
      });
      log.info('Harvest marked for deletion:', id);
    } catch (error) {
      log.error('Failed to delete harvest:', error);
    }
  };

  return (
    <div>
      <h2><LanguageText bn="ফসল সংগ্রহ" en="Harvest recording" /></h2>
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
          <label><LanguageText bn="ফসলের নাম" en="Crop name" />:</label>
          <input 
            type="text" 
            value={crop} 
            onChange={(e) => setCrop(e.target.value)} 
            required 
            placeholder={isBangla ? 'উদাঃ আমন ধান' : 'For example: Aman rice'}
          />
        </div>

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
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="KG">{isBangla ? 'কেজি' : 'KG'}</option>
            <option value="Quintal">{isBangla ? 'কুইন্টাল' : 'Quintal'}</option>
            <option value="Mound">{isBangla ? 'মণ' : 'Mound'}</option>
            <option value="Ton">{isBangla ? 'টন' : 'Ton'}</option>
          </select>
        </div>

        <div className="form-group">
          <label><LanguageText bn="বিক্রয় মূল্য (টাকা)" en="Revenue (TK)" />:</label>
          <input 
            type="number" 
            value={revenue} 
            onChange={(e) => setRevenue(e.target.value)} 
          />
        </div>

        <button type="submit"><LanguageText bn="সংরক্ষণ করুন" en="Save harvest" /></button>
      </form>

      <div className="list">
        <h3><LanguageText bn="সংগ্রহের তালিকা" en="Harvest history" /></h3>
        {harvests?.map(h => {
          const plot = plots?.find(p => p.id === h.plotId);
          return (
            <div key={h.id} className="list-item">
              <div>
                <strong>{h.date}</strong>: {h.crop} ({h.quantity} {h.quantityUnit})
                <br />
                <small>{isBangla ? 'জমি' : 'Plot'}: {plot?.name || 'Unknown'} | {isBangla ? 'আয়' : 'Revenue'}: {h.revenue} {isBangla ? 'টাকা' : 'TK'}</small>
              </div>
              <button className="delete-btn" onClick={() => deleteHarvest(h.id)}><LanguageText bn="মুছুন" en="Delete" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestRecorder;
