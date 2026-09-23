export const QUICK_RECORD_TYPES = {
  input: 'input',
  observation: 'observation',
  harvest: 'harvest',
};

export const QUICK_RECORD_OPTIONS = {
  [QUICK_RECORD_TYPES.input]: {
    label: 'উপকরণ দিয়েছি',
    table: 'inputs',
  },
  [QUICK_RECORD_TYPES.observation]: {
    label: 'জমিতে কিছু দেখেছি',
    table: 'observations',
  },
  [QUICK_RECORD_TYPES.harvest]: {
    label: 'ফসল তুলেছি',
    table: 'harvests',
  },
};

export const INPUT_UNITS = [
  { value: 'liter', label: 'লিটার (L)' },
  { value: 'kg', label: 'কেজি (kg)' },
  { value: 'gram', label: 'গ্রাম (g)' },
  { value: 'bag', label: 'বস্তা' },
];

export const HARVEST_UNITS = [
  { value: 'kg', label: 'কেজি (kg)' },
  { value: 'quintal', label: 'কুইন্টাল' },
  { value: 'maund', label: 'মণ' },
  { value: 'ton', label: 'টন' },
];

export const INPUT_TYPES = [
  { value: 'Jeevamrutha', label: 'জীবামৃত' },
  { value: 'Neemastra', label: 'নিমাস্ত্র' },
  { value: 'Beejamrutha', label: 'বীজামৃত' },
  { value: 'Ghanajeevamrutha', label: 'ঘনজীবামৃত' },
  { value: 'Labor', label: 'শ্রম' },
  { value: 'Other', label: 'অন্যান্য' },
];

export const QUICK_DEFAULTS_KEY = 'krishi-record-quick-defaults';

export function getRememberedDefaults(storage, today) {
  try {
    const saved = JSON.parse(storage.getItem(QUICK_DEFAULTS_KEY) || '{}');
    return {
      plotId: typeof saved.plotId === 'string' ? saved.plotId : '',
      date: typeof saved.date === 'string' && saved.date ? saved.date : today,
    };
  } catch {
    return { plotId: '', date: today };
  }
}

export function rememberQuickDefaults(storage, defaults) {
  storage.setItem(QUICK_DEFAULTS_KEY, JSON.stringify({
    plotId: defaults.plotId || '',
    date: defaults.date,
  }));
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export function validateQuickRecord(type, fields) {
  const errors = {};
  if (!fields.plotId) errors.plotId = 'জমি নির্বাচন করুন';
  if (!fields.date) errors.date = 'তারিখ নির্বাচন করুন';

  if (type === QUICK_RECORD_TYPES.input) {
    if (!fields.type) errors.type = 'উপকরণের ধরন নির্বাচন করুন';
    if (!isPositiveNumber(fields.quantity)) errors.quantity = 'পরিমাণ ০-এর বেশি হতে হবে';
    if (!fields.unit) errors.unit = 'একক নির্বাচন করুন';
  }

  if (type === QUICK_RECORD_TYPES.observation && !fields.title?.trim()) {
    errors.title = 'বিষয় লিখুন';
  }

  if (type === QUICK_RECORD_TYPES.harvest) {
    if (!fields.crop?.trim()) errors.crop = 'ফসলের নাম লিখুন';
    if (!isPositiveNumber(fields.quantity)) errors.quantity = 'পরিমাণ ০-এর বেশি হতে হবে';
    if (!fields.unit) errors.unit = 'একক নির্বাচন করুন';
  }

  return errors;
}

export function buildQuickRecord(type, fields, updatedAt, generateId = () => crypto.randomUUID()) {
  const common = {
    id: fields.id || generateId(),
    plotId: fields.plotId,
    date: fields.date,
    sync_status: 'dirty',
    updated_at: updatedAt,
  };

  if (type === QUICK_RECORD_TYPES.input) {
    return {
      ...common,
      type: fields.type,
      quantity: Number(fields.quantity),
      quantityUnit: fields.unit,
      cost: Number(fields.cost || 0),
    };
  }

  if (type === QUICK_RECORD_TYPES.observation) {
    return {
      ...common,
      title: fields.title.trim(),
      description: fields.description?.trim() || '',
    };
  }

  return {
    ...common,
    crop: fields.crop.trim(),
    quantity: Number(fields.quantity),
    quantityUnit: fields.unit,
    revenue: Number(fields.revenue || 0),
  };
}
