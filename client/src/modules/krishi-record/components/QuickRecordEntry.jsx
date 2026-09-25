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
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

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
  const { isBangla } = useLanguage();
  const englishMessages = {
    'জমি নির্বাচন করুন': 'Select a plot',
    'তারিখ নির্বাচন করুন': 'Select a date',
    'উপকরণের ধরন নির্বাচন করুন': 'Select an input type',
    'পরিমাণ ০-এর বেশি হতে হবে': 'Quantity must be greater than 0',
    'একক নির্বাচন করুন': 'Select a unit',
    'বিষয় লিখুন': 'Enter a title',
    'ফসলের নাম লিখুন': 'Enter a crop name',
  };
  return message ? <span className="field-error" role="alert">{isBangla ? message : englishMessages[message] || message}</span> : null;
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
  const { isBangla } = useLanguage();

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
      setFeedback(editingId ? (isBangla ? 'রেকর্ডটি সংশোধন করা হয়েছে' : 'Record updated') : (isBangla ? 'রেকর্ড সংরক্ষণ হয়েছে' : 'Record saved'));
      resetForm();
    } catch (error) {
      log.error('Failed to save quick record:', error);
      setFeedback(isBangla ? 'রেকর্ড সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' : 'Could not save record. Please try again.');
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
      setFeedback(isBangla ? 'রেকর্ড মুছে ফেলা হয়েছে' : 'Record deleted');
    } catch (error) {
      log.error('Failed to delete quick record:', error);
      setFeedback(isBangla ? 'রেকর্ড মুছতে সমস্যা হয়েছে।' : 'Could not delete record.');
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
    setFeedback(isBangla ? 'রেকর্ড ফিরিয়ে আনা হয়েছে' : 'Record restored');
  };

  const plotName = (plotId) => plots?.find((plot) => plot.id === plotId)?.name || (isBangla ? 'জমি পাওয়া যায়নি' : 'Plot not found');
  const unitOptions = recordType === QUICK_RECORD_TYPES.input ? INPUT_UNITS : HARVEST_UNITS;

  return (
    <section className="quick-record" aria-labelledby="quick-record-title">
      <div className="quick-record-intro">
        <p className="eyebrow"><LanguageText bn="দ্রুত রেকর্ড" en="Quick records" /></p>
        <h2 id="quick-record-title"><LanguageText bn="আজকের জমির কাজ লিখুন" en="Record today’s farm work" /></h2>
        <p><LanguageText bn="কয়েকটি তথ্য দিয়ে রেকর্ড করুন। পরে ইন্টারনেট এলে সিঙ্ক হবে।" en="Add a few details now. Your record will sync when you are online." /></p>
      </div>

      <div className="quick-record-types" role="tablist" aria-label={isBangla ? 'রেকর্ডের ধরন' : 'Record type'}>
        {Object.entries(QUICK_RECORD_OPTIONS).map(([type, option]) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={recordType === type}
            className={recordType === type ? 'quick-type active' : 'quick-type'}
            onClick={() => changeType(type)}
          >
            {isBangla ? option.label : option.en}
          </button>
        ))}
      </div>

      <form className="quick-record-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="quick-plot"><LanguageText bn="জমি *" en="Plot *" /></label>
          <select id="quick-plot" value={fields.plotId} onChange={(event) => setField('plotId', event.target.value)}>
            <option value="">{isBangla ? 'জমি বেছে নিন' : 'Choose plot'}</option>
            {plots?.map((plot) => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
          </select>
          <ErrorMessage message={errors.plotId} />
        </div>

        <div className="form-group">
          <label htmlFor="quick-date"><LanguageText bn="তারিখ *" en="Date *" /></label>
          <input id="quick-date" type="date" value={fields.date} onChange={(event) => setField('date', event.target.value)} />
          <ErrorMessage message={errors.date} />
        </div>

        {recordType === QUICK_RECORD_TYPES.input && (
          <>
            <div className="form-group">
              <label htmlFor="quick-input-type"><LanguageText bn="উপকরণের ধরন *" en="Input type *" /></label>
              <select id="quick-input-type" value={fields.type} onChange={(event) => setField('type', event.target.value)}>
                {INPUT_TYPES.map((option) => <option key={option.value} value={option.value}>{isBangla ? option.label : option.en}</option>)}
              </select>
              <ErrorMessage message={errors.type} />
            </div>
            <QuantityFields fields={fields} errors={errors} unitOptions={unitOptions} setField={setField} />
            <div className="form-group">
              <label htmlFor="quick-cost"><LanguageText bn="খরচ (টাকা)" en="Cost (TK)" /></label>
              <input id="quick-cost" type="number" min="0" step="0.01" inputMode="decimal" value={fields.cost} onChange={(event) => setField('cost', event.target.value)} />
            </div>
          </>
        )}

        {recordType === QUICK_RECORD_TYPES.observation && (
          <>
            <div className="form-group">
              <label htmlFor="quick-title"><LanguageText bn="কী দেখেছেন? *" en="What did you observe? *" /></label>
              <input id="quick-title" type="text" value={fields.title} onChange={(event) => setField('title', event.target.value)} placeholder={isBangla ? 'যেমন: পাতায় পোকা দেখা গেছে' : 'For example: Insects on leaves'} />
              <ErrorMessage message={errors.title} />
            </div>
            <div className="form-group">
              <label htmlFor="quick-description"><LanguageText bn="বিস্তারিত (ঐচ্ছিক)" en="Details (optional)" /></label>
              <textarea id="quick-description" rows="3" value={fields.description} onChange={(event) => setField('description', event.target.value)} placeholder={isBangla ? 'আরও কিছু লিখুন' : 'Add more details'} />
            </div>
          </>
        )}

        {recordType === QUICK_RECORD_TYPES.harvest && (
          <>
            <div className="form-group">
              <label htmlFor="quick-crop"><LanguageText bn="ফসলের নাম *" en="Crop name *" /></label>
              <input id="quick-crop" type="text" value={fields.crop} onChange={(event) => setField('crop', event.target.value)} placeholder={isBangla ? 'যেমন: আমন ধান' : 'For example: Aman rice'} />
              <ErrorMessage message={errors.crop} />
            </div>
            <QuantityFields fields={fields} errors={errors} unitOptions={unitOptions} setField={setField} />
            <div className="form-group">
              <label htmlFor="quick-revenue"><LanguageText bn="বিক্রয় মূল্য (টাকা)" en="Revenue (TK)" /></label>
              <input id="quick-revenue" type="number" min="0" step="0.01" inputMode="decimal" value={fields.revenue} onChange={(event) => setField('revenue', event.target.value)} />
            </div>
          </>
        )}

        <div className="quick-form-actions">
          <button type="submit">{editingId ? (isBangla ? 'সংশোধন সংরক্ষণ করুন' : 'Save changes') : (isBangla ? 'সংরক্ষণ করুন' : 'Save')}</button>
          {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>{isBangla ? 'বাতিল' : 'Cancel'}</button>}
        </div>
      </form>

      <div className="quick-feedback" aria-live="polite">
        {feedback}
        {undoItem && <button type="button" className="text-btn" onClick={undoDelete}>{isBangla ? 'ফিরিয়ে আনুন' : 'Undo'}</button>}
      </div>

      <div className="quick-history">
        <h3><LanguageText bn="সাম্প্রতিক রেকর্ড" en="Recent records" /></h3>
        {!records?.length && <p className="empty-state"><LanguageText bn="এখনও কোনো রেকর্ড নেই। উপরের ফর্ম দিয়ে শুরু করুন।" en="No records yet. Start with the form above." /></p>}
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
              <button type="button" className="text-btn" onClick={() => startEditing(record)}>{isBangla ? 'সংশোধন' : 'Edit'}</button>
              <button type="button" className="delete-btn" onClick={() => deleteRecord(record)}>{isBangla ? 'মুছুন' : 'Delete'}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

function QuantityFields({ fields, errors, unitOptions, setField }) {
  const { isBangla } = useLanguage();
  return (
    <div className="quantity-row">
      <div className="form-group">
        <label htmlFor="quick-quantity"><LanguageText bn="পরিমাণ *" en="Quantity *" /></label>
        <input id="quick-quantity" type="number" min="0.01" step="0.01" inputMode="decimal" value={fields.quantity} onChange={(event) => setField('quantity', event.target.value)} />
        <ErrorMessage message={errors.quantity} />
      </div>
      <div className="form-group">
        <label htmlFor="quick-unit"><LanguageText bn="একক *" en="Unit *" /></label>
        <select id="quick-unit" value={fields.unit} onChange={(event) => setField('unit', event.target.value)}>
          {unitOptions.map((option) => <option key={option.value} value={option.value}>{isBangla ? option.label : option.en}</option>)}
        </select>
        <ErrorMessage message={errors.unit} />
      </div>
    </div>
  );
}

export default QuickRecordEntry;
