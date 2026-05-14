import treatments from '../data/disease-treatments.json';

/**
 * Lookup treatment information based on scientific name or label.
 * @param {string} scientificName
 * @returns {Object} Treatment information
 */
export function lookupTreatment(scientificName = '') {
  if (!scientificName) return treatments.unknown;

  // Match by genus (first word of scientific name) or full match
  const genus = scientificName.split(' ')[0];
  const match = Object.entries(treatments).find(([key]) =>
    scientificName.toLowerCase().includes(key.toLowerCase())
    || genus.toLowerCase() === key.toLowerCase()
  );

  return match ? match[1] : treatments.unknown;
}
