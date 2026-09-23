import treatments from '../data/disease-treatments.json';

/**
 * Lookup treatment information based on scientific name or label.
 * @param {string} scientificName 
 * @returns {Object} Treatment information
 */
export function lookupTreatment(scientificName = '') {
  if (!scientificName) return { ...treatments.unknown, key: 'unknown', known: false };

  // Match by genus (first word of scientific name) or full match
  const genus = scientificName.split(' ')[0];
  const match = Object.entries(treatments).find(([key]) => key !== 'unknown' && (
    scientificName.toLowerCase().includes(key.toLowerCase())
    || genus.toLowerCase() === key.toLowerCase()
  ));
  
  return match
    ? { ...match[1], key: match[0], known: true }
    : { ...treatments.unknown, key: 'unknown', known: false };
}
