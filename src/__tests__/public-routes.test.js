import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/supabase.js', () => ({
  getFarmerLocations: vi.fn(),
}));

vi.mock('../config/index.js', () => ({
  config: { plantnetApiKey: undefined },
}));

import { getFarmerLocations } from '../services/supabase.js';
import { publicDiseaseIdentify, publicMapLocations } from '../api/routes/public.js';

function response() {
  return { json: vi.fn() };
}

describe('public feature routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns public farmer locations for the guest map', async () => {
    getFarmerLocations.mockResolvedValue([{ id: 'one', latitude: 23.8, longitude: 90.3 }]);
    const res = response();

    await publicMapLocations({}, res);

    expect(res.json).toHaveBeenCalledWith(200, {
      locations: [{ id: 'one', latitude: 23.8, longitude: 90.3 }],
    });
  });

  it('reports missing PlantNet configuration without accepting an image', async () => {
    const res = response();

    await publicDiseaseIdentify({ body: {} }, res);

    expect(res.json).toHaveBeenCalledWith(503, { error: 'DISEASE_SERVICE_NOT_CONFIGURED' });
  });
});
