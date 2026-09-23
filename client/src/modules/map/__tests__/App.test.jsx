import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FarmerMap from '../App';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
const client = { from };

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from }),
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tiles" />,
  CircleMarker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
}));

function queryResult({ data = [], error = null } = {}) {
  const result = { data, error };
  const query = {
    select: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

describe('FarmerMap', () => {
  beforeEach(() => {
    from.mockReset();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('shows a Bangla loading state while public locations are loading', () => {
    from.mockReturnValue(queryResult({ data: [], error: null }));
    render(<FarmerMap client={client} />);
    expect(screen.getByText(/মানচিত্র লোড হচ্ছে/i)).toBeTruthy();
  });

  it('shows a recoverable Bangla error and join guidance when the public query fails', async () => {
    from.mockReturnValue(queryResult({ error: new Error('network') }));
    render(<FarmerMap client={client} />);

    expect(await screen.findByText(/মানচিত্রের তথ্য আনা যায়নি/i)).toBeTruthy();
    expect(screen.getByText(/মানচিত্রে যোগ দিতে/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /আবার চেষ্টা করুন/i })).toBeTruthy();
  });

  it('shows an offline state and does not query Supabase while offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    render(<FarmerMap client={client} />);

    expect(await screen.findByText(/ইন্টারনেট সংযোগ নেই/i)).toBeTruthy();
    expect(from).not.toHaveBeenCalled();
  });

  it('shows an empty state and filters valid public markers', async () => {
    from.mockReturnValue(queryResult({
      data: [
        { id: 'valid', display_name: 'করিম', district: 'ঢাকা', upazila: 'সাভার', crop_type: 'ধান', latitude: 23.8, longitude: 90.3 },
        { id: 'invalid', display_name: 'অবৈধ', district: 'ঢাকা', upazila: 'সাভার', crop_type: 'ধান', latitude: 0, longitude: 0 },
      ],
    }));
    render(<FarmerMap client={client} />);

    expect(await screen.findByTestId('map')).toBeTruthy();
    expect(screen.getAllByTestId('marker')).toHaveLength(1);
    expect(screen.getByRole('combobox', { name: 'জেলা' })).toBeTruthy();
  });

  it('renders a no-results message when filters exclude all locations', async () => {
    from.mockReturnValue(queryResult({ data: [
      { id: 'one', district: 'ঢাকা', upazila: 'সাভার', crop_type: 'ধান', latitude: 23.8, longitude: 90.3 },
      { id: 'two', district: 'চট্টগ্রাম', upazila: 'সীতাকুণ্ড', crop_type: 'সবজি', latitude: 22.4, longitude: 91.7 },
    ] }));
    render(<FarmerMap client={client} />);

    await waitFor(() => expect(screen.getByTestId('map')).toBeTruthy());
    const district = screen.getByRole('combobox', { name: 'জেলা' });
    fireEvent.change(district, { target: { value: 'ঢাকা' } });
    const crop = screen.getByRole('combobox', { name: 'ফসল' });
    fireEvent.change(crop, { target: { value: 'সবজি' } });
    expect(await screen.findByText(/এই ফিল্টারে কোনো কৃষক পাওয়া যায়নি/i)).toBeTruthy();
  });
});
