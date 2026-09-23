import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicFarmerLocations } from '../App';

describe('public farmer map API fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('loads and normalizes locations without browser Supabase credentials', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ locations: [{ id: 'one', display_name: 'রহিম', district: 'ঢাকা', upazila: 'সাভার', crop_type: 'ধান', latitude: 23.8, longitude: 90.3 }] }),
    });

    await expect(fetchPublicFarmerLocations()).resolves.toMatchObject([
      { id: 'one', displayName: 'রহিম', crops: ['ধান'], latitude: 23.8, longitude: 90.3 },
    ]);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/map/locations'));
  });
});
