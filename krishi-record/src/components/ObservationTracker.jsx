import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import log from '../logger';

const ObservationTracker = () => {
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const plots = useLiveQuery(() => db.plots.toArray());
  const observations = useLiveQuery(() => db.observations.reverse().toArray());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) return alert('Please select a plot');
    try {
      await db.observations.add({
        plotId: parseInt(plotId),
        date,
        title,
        description
      });
      setTitle('');
      setDescription('');
      log.info('Observation logged');
    } catch (error) {
      log.error('Failed to log observation:', error);
    }
  };

  const deleteObservation = async (id) => {
    try {
      await db.observations.delete(id);
      log.info('Observation deleted:', id);
    } catch (error) {
      log.error('Failed to delete observation:', error);
    }
  };

  return (
    <div>
      <h2>পর্যবেক্ষণ (Observation Tracker)</h2>
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
          <label>বিষয় (Title):</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder="উদাঃ গাছের বৃদ্ধি ভালো"
          />
        </div>

        <div className="form-group">
          <label>বর্ণনা (Description):</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows="3"
          />
        </div>

        <button type="submit">সংরক্ষণ করুন (Save Observation)</button>
      </form>

      <div className="list">
        <h3>পর্যবেক্ষণ তালিকা (Observations)</h3>
        {observations?.map(obs => {
          const plot = plots?.find(p => p.id === obs.plotId);
          return (
            <div key={obs.id} className="list-item">
              <div>
                <strong>{obs.date}</strong> - {obs.title}
                <br />
                <small>জমি: {plot?.name || 'Unknown'}</small>
                <p style={{margin: '5px 0 0 0'}}>{obs.description}</p>
              </div>
              <button className="delete-btn" onClick={() => deleteObservation(obs.id)}>মুছুন</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ObservationTracker;
