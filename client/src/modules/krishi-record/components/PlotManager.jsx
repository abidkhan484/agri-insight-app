import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import log from '../logger';

const PlotManager = () => {
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
      <h2>জমি ব্যবস্থাপনা (Plot Management)</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>জমির নাম (Plot Name):</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="উদাঃ উত্তর মাঠ"
          />
        </div>
        <div className="form-group">
          <label>পরিমাণ (Area):</label>
          <input 
            type="number" 
            step="0.01" 
            value={area} 
            onChange={(e) => setArea(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>একক (Unit):</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="Decimal">শতাংশ (Decimal)</option>
            <option value="Acre">একর (Acre)</option>
            <option value="Bigha">বিঘা (Bigha)</option>
          </select>
        </div>
        <button type="submit">যোগ করুন (Add Plot)</button>
      </form>

      <div className="list">
        <h3>জমি তালিকা (Plot List)</h3>
        {plots?.map(plot => (
          <div key={plot.id} className="list-item">
            <div>
              <strong>{plot.name}</strong> - {plot.area} {plot.areaUnit}
            </div>
            <button className="delete-btn" onClick={() => deletePlot(plot.id)}>মুছুন (Delete)</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlotManager;
