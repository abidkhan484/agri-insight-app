import { describe, expect, it } from 'vitest';
import {
  buildQuickRecord,
  getRememberedDefaults,
  QUICK_RECORD_TYPES,
  rememberQuickDefaults,
  validateQuickRecord,
} from '../utils/quick-record';

describe('quick record entry contracts', () => {
  it('remembers the last plot and date without changing the current date fallback', () => {
    const storage = {
      values: {},
      getItem(key) {
        return this.values[key] ?? null;
      },
      setItem(key, value) {
        this.values[key] = value;
      },
    };

    expect(getRememberedDefaults(storage, '2026-09-23')).toEqual({
      plotId: '',
      date: '2026-09-23',
    });

    rememberQuickDefaults(storage, { plotId: 'plot-1', date: '2026-09-22' });
    expect(getRememberedDefaults(storage, '2026-09-23')).toEqual({
      plotId: 'plot-1',
      date: '2026-09-22',
    });
  });

  it('returns Bangla validation messages for missing and invalid fields', () => {
    expect(validateQuickRecord(QUICK_RECORD_TYPES.input, {
      plotId: '', date: '', quantity: '-2', type: '', unit: '',
    })).toEqual({
      plotId: 'জমি নির্বাচন করুন',
      date: 'তারিখ নির্বাচন করুন',
      type: 'উপকরণের ধরন নির্বাচন করুন',
      quantity: 'পরিমাণ ০-এর বেশি হতে হবে',
      unit: 'একক নির্বাচন করুন',
    });

    expect(validateQuickRecord(QUICK_RECORD_TYPES.observation, {
      plotId: 'plot-1', date: '2026-09-23', title: '', description: '',
    })).toEqual({ title: 'বিষয় লিখুন' });

    expect(validateQuickRecord(QUICK_RECORD_TYPES.harvest, {
      plotId: 'plot-1', date: '2026-09-23', crop: '', quantity: '0', unit: '',
    })).toEqual({
      crop: 'ফসলের নাম লিখুন',
      quantity: 'পরিমাণ ০-এর বেশি হতে হবে',
      unit: 'একক নির্বাচন করুন',
    });
  });

  it('builds sync-compatible records with canonical Bangladesh units', () => {
    const record = buildQuickRecord(QUICK_RECORD_TYPES.harvest, {
      id: 'harvest-1', plotId: 'plot-1', date: '2026-09-23', crop: 'ধান',
      quantity: '2.5', unit: 'maund', revenue: '1200',
    }, '2026-09-23T05:00:00.000Z');

    expect(record).toEqual({
      id: 'harvest-1', plotId: 'plot-1', date: '2026-09-23', crop: 'ধান',
      quantity: 2.5, quantityUnit: 'maund', revenue: 1200,
      sync_status: 'dirty', updated_at: '2026-09-23T05:00:00.000Z',
    });
  });
});
