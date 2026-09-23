import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import QuickRecordEntry from '../components/QuickRecordEntry';
import { db } from '../db';

describe('QuickRecordEntry', () => {
  beforeEach(async () => {
    await Promise.all([
      db.plots.clear(),
      db.inputs.clear(),
      db.observations.clear(),
      db.harvests.clear(),
    ]);
    window.localStorage.clear();
    await db.plots.add({ id: 'plot-1', name: 'পূর্বের জমি', sync_status: 'synced' });
  });

  it('uses the available plot and saves an input without a browser alert', async () => {
    render(<QuickRecordEntry />);

    await waitFor(() => expect(screen.getByLabelText('জমি *').value).toBe('plot-1'));
    fireEvent.change(screen.getByLabelText('পরিমাণ *'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'সংরক্ষণ করুন' }));

    await waitFor(async () => {
      expect(await db.inputs.count()).toBe(1);
    });
    expect(screen.getByText('রেকর্ড সংরক্ষণ হয়েছে')).toBeTruthy();
  });

  it('shows Bangla validation and supports observation entry without alerting', async () => {
    render(<QuickRecordEntry />);
    await waitFor(() => expect(screen.getByLabelText('জমি *').value).toBe('plot-1'));

    fireEvent.click(screen.getByRole('tab', { name: 'জমিতে কিছু দেখেছি' }));
    fireEvent.click(screen.getByRole('button', { name: 'সংরক্ষণ করুন' }));
    expect(screen.getByText('বিষয় লিখুন')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('কী দেখেছেন? *'), { target: { value: 'পাতায় দাগ' } });
    fireEvent.click(screen.getByRole('button', { name: 'সংরক্ষণ করুন' }));
    await waitFor(async () => expect(await db.observations.count()).toBe(1));
    expect(screen.getByText('রেকর্ড সংরক্ষণ হয়েছে')).toBeTruthy();
  });
});
