import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateId } from '../db';
import log from '../logger';
import {
  HARVEST_UNITS,
  INPUT_TYPES,
  INPUT_UNITS,
  QUICK_RECORD_OPTIONS,
  QUICK_RECORD_TYPES,
  buildQuickRecord,
  getRememberedDefaults,
  rememberQuickDefaults,
  validateQuickRecord,
} from '../utils/quick-record';

function getToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const blankFields = (defaults) => ({
  plotId: defaults.plotId,
  date: defaults.date,
  type: 'Jeevamrutha',
  quantity: '',
  unit: 'liter',
  cost: '0',
  title: '',
  description: '',
  crop: '',
  revenue: '0',
});

const tableFor = (type) => QUICK_RECORD_OPTIONS[type].table;

function ErrorMessage({ message }) {
  return message ? <span className="field-error" role="alert">{message}</span> : null;
}

const QuickRecordEntry = () => {
  const initialDefaults = useMemo(
    () => getRememberedDefaults(window.localStorage, getToday()),
    [],
  );
  const [recordType, setRecordType] = useState(QUICK_RECORD_TYPES.input);
  const [fields, setFields] = useState(() => blankFields(initialDefaults));
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const [feedback, setFeedback] = useState('');

  const plots = useLiveQuery(
    () => db.plots.filter((plot) => plot.sync_status !== 'deleted').toArray(),
    [],
  );
  const records = useLiveQuery(
    () => db[tableFor(recordType)]
      .filter((record) => record.sync_status !== 'deleted')
      .reverse()
      .toArray(),
    [recordType],
  );

  useEffect(() => {
    if (fields.plotId && plots?.some((plot) => plot.id === fields.plotId)) return;
    if (!fields.plotId && plots?.length === 1) {
      setFields((current) => ({ ...current, plotId: plots[0].id }));
    }
  }, [fields.plotId, plots]);

  const setField = (name, value) => {
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const changeType = (nextType) => {
    setRecordType(nextType);
    setEditingId(null);
    setErrors({});
    setFeedback('');
    setFields((current) => ({ ...blankFields({ plotId: current.plotId, date: current.date }),
      ...(nextType === QUICK_RECORD_TYPES.input ? { unit: 'liter' } : {}),
      ...(nextType === QUICK_RECORD_TYPES.harvest ? { unit: 'kg' } : {}),
    }));
  };

  const resetForm = () => {
    setFields(blankFields(getRememberedDefaults(window.localStorage, getToday())));
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateQuickRecord(recordType, fields);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFeedback('');
      return;
    }

    try {
      const record = buildQuickRecord(
        recordType,
        { ...fields, id: editingId },
        new Date().toISOString(),
        generateId,
      );
      await db[tableFor(recordType)].put(record);
      rememberQuickDefaults(window.localStorage, fields);
      setFeedback(editingId ? 'রেকর্ডটি সংশোধন করা হয়েছে' : 'রেকর্ড সংরক্ষণ হয়েছে');
      resetForm();
    } catch (error) {
      log.error('Failed to save quick record:', error);
      setFeedback('রেকর্ড সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
    }
  };

  const startEditing = (record) => {
    setEditingId(record.id);
    setFields({
      ...blankFields({ plotId: record.plotId, date: record.date }),
      ...record,
      unit: record.quantityUnit || 'liter',
      cost: String(record.cost ?? 0),
      revenue: String(record.revenue ?? 0),
      quantity: String(record.quantity ?? ''),
    });
    setErrors({});
    setFeedback('');
    window.scrollTo?.({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = async (record) => {
    try {
      await db[tableFor(recordType)].update(record.id, {
        sync_status: 'deleted',
        updated_at: new Date().toISOString(),
      });
      setUndoItem({ type: recordType, record });
      setFeedback('রেকর্ড মুছে ফেলা হয়েছে');
    } catch (error) {
      log.error('Failed to delete quick record:', error);
      setFeedback('রেকর্ড মুছতে সমস্যা হয়েছে।');
    }
  };

  const undoDelete = async () => {
    if (!undoItem) return;
    await db[tableFor(undoItem.type)].put({
      ...undoItem.record,
      sync_status: 'dirty',
      updated_at: new Date().toISOString(),
    });
    setUndoItem(null);
    setFeedback('রেকর্ড ফিরিয়ে আনা হয়েছে');
  };

  const plotName = (plotId) => plots?.find((plot) => plot.id === plotId)?.name || 'জমি পাওয়া যায়নি';
  const unitOptions = recordType === QUICK_RECORD_TYPES.input ? INPUT_UNITS : HARVEST_UNITS;

  return (
    <section className="quick-record" aria-labelledby="quick-record-title">
      <div className="quick-record-intro">
        <p className="eyebrow">দ্রুত রেকর্ড</p>
        <h2 id="quick-record-title">আজকের জমির কাজ লিখুন</h2>
        <p>কয়েকটি তথ্য দিয়ে রেকর্ড করুন। পরে ইন্টারনেট এলে সিঙ্ক হবে।</p>
      </div>

      <div className="quick-record-types" role="tablist" aria-label="রেকর্ডের ধরন">
        {Object.entries(QUICK_RECORD_OPTIONS).map(([type, option]) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={recordType === type}
            className={recordType === type ? 'quick-type active' : 'quick-type'}
            onClick={() => changeType(type)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form className="quick-record-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="quick-plot">জমি *</label>
          <select id="quick-plot" value={fields.plotId} onChange={(event) => setField('plotId', event.target.value)}>
            <option value="">জমি বেছে নিন</option>
            {plots?.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
          </select>
          <ErrorMessage message={errors.plotId} />
        </div>

        <div className="form-group">
          <label htmlFor="quick-date">তারিখ *</label>
          <input id="quick-date" type="date" value={fields.date} onChange={(event) => setField('date', event.target.value)} />
          <ErrorMessage message={errors.date} />
        </div>

        {recordType === QUICK_RECORD_TYPES.input && (
          <>
            <div className="form-group">
              <label htmlFor="quick-input-type">উপকরণের ধরন *</label>
              <select id="quick-input-type" value={fields.type} onChange={(event) => setField('type', event.target.value)}>
                {INPUT_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ErrorMessage message={errors.type} />
            </div>
            <QuantityFields fields={fields} errors={errors} unitOptions={unitOptions} setField={setField} />
            <div className="form-group">
              <label htmlFor="quick-cost">খরচ (টাকা)</label>
              <input id="quick-cost" type="number" min="0" step="0.01" inputMode="decimal" value={fields.cost} onChange={(event) => setField('cost', event.target.value)} />
            </div>
          </>
        )}

        {recordType === QUICK_RECORD_TYPES.observation && (
          <>
            <div className="form-group">
              <label htmlFor="quick-title">কী দেখেছেন? *</label>
              <input id="quick-title" type="text" value={fields.title} onChange={(event) => setField('title', event.target.value)} placeholder="যেমন: পাতায় পোকা দেখা গেছে" />
              <ErrorMessage message={errors.title} />
            </div>
            <div className="form-group">
              <label htmlFor="quick-description">বিস্তারিত (ঐচ্ছিক)</label>
              <textarea id="quick-description" rows="3" value={fields.description} onChange={(event) => setField('description', event.target.value)} placeholder="আরও কিছু লিখুন" />
            </div>
          </>
        )}

        {recordType === QUICK_RECORD_TYPES.harvest && (
          <>
            <div className="form-group">
              <label htmlFor="quick-crop">ফসলের নাম *</label>
              <input id="quick-crop" type="text" value={fields.crop} onChange={(event) => setField('crop', event.target.value)} placeholder="যেমন: আমন ধান" />
              <ErrorMessage message={errors.crop} />
            </div>
            <QuantityFields fields={fields} errors={errors} unitOptions={unitOptions} setField={setField} />
            <div className="form-group">
              <label htmlFor="quick-revenue">বিক্রয় মূল্য (টাকা)</label>
              <input id="quick-revenue" type="number" min="0" step="0.01" inputMode="decimal" value={fields.revenue} onChange={(event) => setField('revenue', event.target.value)} />
            </div>
          </>
        )}

        <div className="quick-form-actions">
          <button type="submit">{editingId ? 'সংশোধন সংরক্ষণ করুন' : 'সংরক্ষণ করুন'}</button>
          {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>বাতিল</button>}
        </div>
      </form>

      <div className="quick-feedback" aria-live="polite">
        {feedback}
        {undoItem && <button type="button" className="text-btn" onClick={undoDelete}>ফিরিয়ে আনুন</button>}
      </div>

      <div className="quick-history">
        <h3>সাম্প্রতিক রেকর্ড</h3>
        {!records?.length && <p className="empty-state">এখনও কোনো রেকর্ড নেই। উপরের ফর্ম দিয়ে শুরু করুন।</p>}
        {records?.map((record) => (
          <article className="quick-history-item" key={record.id}>
            <div>
              <strong>{record.date}</strong>
              <span>{recordType === QUICK_RECORD_TYPES.input && `${record.type} · ${record.quantity} ${record.quantityUnit}`}</span>
              <span>{recordType === QUICK_RECORD_TYPES.observation && record.title}</span>
              <span>{recordType === QUICK_RECORD_TYPES.harvest && `${record.crop} · ${record.quantity} ${record.quantityUnit}`}</span>
              <small>{plotName(record.plotId)}</small>
            </div>
            <div className="record-actions">
              <button type="button" className="text-btn" onClick={() => startEditing(record)}>সংশোধন</button>
              <button type="button" className="delete-btn" onClick={() => deleteRecord(record)}>মুছুন</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

function QuantityFields({ fields, errors, unitOptions, setField }) {
  return (
    <div className="quantity-row">
      <div className="form-group">
        <label htmlFor="quick-quantity">পরিমাণ *</label>
        <input id="quick-quantity" type="number" min="0.01" step="0.01" inputMode="decimal" value={fields.quantity} onChange={(event) => setField('quantity', event.target.value)} />
        <ErrorMessage message={errors.quantity} />
      </div>
      <div className="form-group">
        <label htmlFor="quick-unit">একক *</label>
        <select id="quick-unit" value={fields.unit} onChange={(event) => setField('unit', event.target.value)}>
          {unitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ErrorMessage message={errors.unit} />
      </div>
    </div>
  );
}

export default QuickRecordEntry;
