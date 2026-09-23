import { describe, expect, it } from 'vitest';
import {
  filterFarmerLocations,
  getFarmerLocationId,
  normalizeFarmerLocation,
  isValidBangladeshCoordinate,
} from '../mapData';

describe('farmer map public data', () => {
  it('normalizes the canonical public fields and hides exact coordinates by default', () => {
    const farmer = normalizeFarmerLocation({
      id: 'farmer-1',
      display_name: 'রহিম',
      district: 'কুষ্টিয়া',
      upazila: 'কুমারখালী',
      crop_type: 'ধান',
      latitude: 23.901,
      longitude: 89.101,
    });

    expect(farmer).toMatchObject({
      id: 'farmer-1',
      displayName: 'রহিম',
      district: 'কুষ্টিয়া',
      upazila: 'কুমারখালী',
      crops: ['ধান'],
      latitude: 23.9,
      longitude: 89.1,
      isApproximate: true,
    });
  });

  it('rejects malformed or out-of-country coordinates', () => {
    expect(isValidBangladeshCoordinate(23.7, 90.4)).toBe(true);
    expect(isValidBangladeshCoordinate('23.7', 90.4)).toBe(false);
    expect(isValidBangladeshCoordinate(19.9, 90.4)).toBe(false);
    expect(isValidBangladeshCoordinate(23.7, 93)).toBe(false);
    expect(normalizeFarmerLocation({ id: 'bad', latitude: 0, longitude: 0 })).toBeNull();
  });

  it('filters by district, upazila, and crop without mutating the source', () => {
    const farmers = [
      normalizeFarmerLocation({ id: 'one', district: 'ঢাকা', upazila: 'সাভার', crop_type: 'ধান', latitude: 23.8, longitude: 90.3 }),
      normalizeFarmerLocation({ id: 'two', district: 'ঢাকা', upazila: 'কেরানীগঞ্জ', crop_type: 'সবজি', latitude: 23.7, longitude: 90.4 }),
    ];

    expect(filterFarmerLocations(farmers, { district: 'ঢাকা', upazila: 'সাভার', crop: 'ধান' })).toHaveLength(1);
    expect(filterFarmerLocations(farmers, { district: 'ঢাকা', upazila: '', crop: 'সবজি' })[0].id).toBe('two');
    expect(farmers).toHaveLength(2);
  });

  it('uses a stable public id when the database row does not provide one', () => {
    expect(getFarmerLocationId({ district: 'ঢাকা', upazila: 'সাভার', latitude: 23.8, longitude: 90.3 })).toBe('ঢাকা-সাভার-23.8-90.3');
  });
});
