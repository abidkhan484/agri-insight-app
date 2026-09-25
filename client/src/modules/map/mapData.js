const BANGLADESH_BOUNDS = { minLatitude: 20.5, maxLatitude: 26.7, minLongitude: 88, maxLongitude: 92.7 };

export function isValidBangladeshCoordinate(latitude, longitude) {
  return typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= BANGLADESH_BOUNDS.minLatitude && latitude <= BANGLADESH_BOUNDS.maxLatitude
    && longitude >= BANGLADESH_BOUNDS.minLongitude && longitude <= BANGLADESH_BOUNDS.maxLongitude;
}

function asCrops(record) {
  if (Array.isArray(record.crops)) return record.crops.filter(Boolean);
  if (typeof record.crop_type === 'string' && record.crop_type.trim()) return [record.crop_type.trim()];
  return [];
}

export function getFarmerLocationId(record) {
  return record.id || [record.district, record.upazila, record.latitude, record.longitude]
    .filter((value) => value !== undefined && value !== null).join('-');
}

export function normalizeFarmerLocation(record) {
  if (!record || !isValidBangladeshCoordinate(record.latitude, record.longitude)) return null;
  return {
    id: getFarmerLocationId(record),
    displayName: record.display_name || '',
    district: record.district || '',
    upazila: record.upazila || '',
    crops: asCrops(record),
    method: record.method || 'ZBNF',
    latitude: Number(record.latitude.toFixed(2)),
    longitude: Number(record.longitude.toFixed(2)),
    isApproximate: true,
    joinedAt: record.joined_at || record.created_at || null,
  };
}

export function filterFarmerLocations(farmers, filters) {
  return farmers.filter((farmer) => (!filters.district || farmer.district === filters.district)
    && (!filters.upazila || farmer.upazila === filters.upazila)
    && (!filters.crop || farmer.crops.includes(filters.crop)));
}

export function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bn'));
}
