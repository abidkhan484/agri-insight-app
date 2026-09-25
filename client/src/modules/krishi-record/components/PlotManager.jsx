import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import log from '../logger';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

const PlotManager = () => {
  const { isBangla } = useLanguage();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState('Decimal');

  const plots = useLiveQuery(() => 
    db.plots.filter(p => p.sync_status !== 'deleted').toArray()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.plots.add({
        id: generateId(),
        name,
        area: parseFloat(area),
        areaUnit: unit,
        sync_status: 'dirty',
        updated_at: new Date().toISOString()
      });
      setName('');
      setArea('');
      log.info('Plot added successfully');
    } catch (error) {
      log.error('Failed to add plot:', error);
    }
  };

  const deletePlot = async (id) => {
    try {
      // Mark for deletion to allow SyncManager to propagate to Supabase
      await db.plots.update(id, { 
        sync_status: 'deleted',
        updated_at: new Date().toISOString()
      });
      log.info('Plot marked for deletion:', id);
    } catch (error) {
      log.error('Failed to delete plot:', error);
    }
  };

  return (
    <div>
      <h2><LanguageText bn="জমি ব্যবস্থাপনা" en="Plot management" /></h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><LanguageText bn="জমির নাম" en="Plot name" />:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder={isBangla ? 'উদাঃ উত্তর মাঠ' : 'For example: North field'}
          />
        </div>
        <div className="form-group">
          <label><LanguageText bn="পরিমাণ" en="Area" />:</label>
          <input 
            type="number" 
            step="0.01" 
            value={area} 
            onChange={(e) => setArea(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label><LanguageText bn="একক" en="Unit" />:</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="Decimal">{isBangla ? 'শতাংশ' : 'Decimal'}</option>
            <option value="Acre">{isBangla ? 'একর' : 'Acre'}</option>
            <option value="Bigha">{isBangla ? 'বিঘা' : 'Bigha'}</option>
          </select>
        </div>
        <button type="submit"><LanguageText bn="যোগ করুন" en="Add plot" /></button>
      </form>

      <div className="list">
        <h3><LanguageText bn="জমি তালিকা" en="Plot list" /></h3>
        {plots?.map(plot => (
          <div key={plot.id} className="list-item">
            <div>
              <strong>{plot.name}</strong> - {plot.area} {plot.areaUnit}
            </div>
            <button className="delete-btn" onClick={() => deletePlot(plot.id)}><LanguageText bn="মুছুন" en="Delete" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlotManager;
