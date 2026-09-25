import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import log from '../logger';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

const ObservationTracker = () => {
  const { isBangla } = useLanguage();
  const [plotId, setPlotId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const plots = useLiveQuery(() => 
    db.plots.filter(p => p.sync_status !== 'deleted').toArray()
  );
  const observations = useLiveQuery(() => 
    db.observations.filter(o => o.sync_status !== 'deleted').reverse().toArray()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!plotId) return alert(isBangla ? 'জমি নির্বাচন করুন' : 'Please select a plot');
    try {
      await db.observations.add({
        id: generateId(),
        plotId: plotId,
        date,
        title,
        description,
        sync_status: 'dirty',
        updated_at: new Date().toISOString()
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
      await db.observations.update(id, { 
        sync_status: 'deleted',
        updated_at: new Date().toISOString()
      });
      log.info('Observation marked for deletion:', id);
    } catch (error) {
      log.error('Failed to delete observation:', error);
    }
  };

  return (
    <div>
      <h2><LanguageText bn="পর্যবেক্ষণ" en="Observation tracker" /></h2>
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
          <label><LanguageText bn="বিষয়" en="Title" />:</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
            placeholder={isBangla ? 'উদাঃ গাছের বৃদ্ধি ভালো' : 'For example: Plant growth is good'}
          />
        </div>

        <div className="form-group">
          <label><LanguageText bn="বর্ণনা" en="Description" />:</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            rows="3"
          />
        </div>

        <button type="submit"><LanguageText bn="সংরক্ষণ করুন" en="Save observation" /></button>
      </form>

      <div className="list">
        <h3><LanguageText bn="পর্যবেক্ষণ তালিকা" en="Observations" /></h3>
        {observations?.map(obs => {
          const plot = plots?.find(p => p.id === obs.plotId);
          return (
            <div key={obs.id} className="list-item">
              <div>
                <strong>{obs.date}</strong> - {obs.title}
                <br />
                <small>{isBangla ? 'জমি' : 'Plot'}: {plot?.name || 'Unknown'}</small>
                <p style={{margin: '5px 0 0 0'}}>{obs.description}</p>
              </div>
              <button className="delete-btn" onClick={() => deleteObservation(obs.id)}><LanguageText bn="মুছুন" en="Delete" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ObservationTracker;
