const FIRST_LAYER_COMPANIONS = ['Cholai', 'Spinach', 'Coriander', 'Rajgir Bhaji', 'Red Spinach', 'Norpa Bhaji'];
const FIRST_LAYER_VINES = ['Bitter gourd', 'Little gourd', 'Pebble gourd', 'Pointed gourd', 'Round gourd'];
const EXTENDED_COMPANIONS = ['Bottle gourd', 'Sponge gourd', 'Cucumber', 'Sponge gourd'];
const EXTENDED_VINES = ['Bitter gourd', 'Little gourd', 'Pointed gourd', 'Round gourd'];

function makeCombination(number, crops, group) {
  return {
    id: `multi-layer-${number}`,
    number,
    crops,
    base: crops[0],
    companion: crops[1],
    vine: crops[2],
    tree: crops[3],
    group,
    season: 'February–March',
    source: 'Four Layer Farming Crop Guide (Scribd, document 520471366)',
  };
}

const firstSet = ['Ginger', 'Turmeric'].flatMap((base) => FIRST_LAYER_VINES.flatMap((vine) => FIRST_LAYER_COMPANIONS.map((companion) => ({ base, companion, vine }))));
const repeatedSet = [
  ...['Little gourd', 'Pebble gourd', 'Pointed gourd'].flatMap((vine) => FIRST_LAYER_COMPANIONS.map((companion) => ({ base: 'Turmeric', companion, vine }))),
];

const firstCombinations = [
  ...firstSet.filter(({ base }) => base === 'Ginger'),
  ...firstSet.filter(({ base }) => base === 'Turmeric').slice(0, 24),
  ...repeatedSet,
  { base: 'Turmeric', companion: 'Red Spinach', vine: 'Round gourd' },
  ...FIRST_LAYER_COMPANIONS.map((companion) => ({ base: 'Turmeric', companion, vine: 'Round gourd' })).slice(0, 6),
].slice(0, 78);

const extendedCombinations = ['Ginger', 'Turmeric'].flatMap((base) => EXTENDED_COMPANIONS.flatMap((companion) => EXTENDED_VINES.map((vine) => ({ base, companion, vine }))));

export const MULTI_LAYER_COMBINATIONS = [...firstCombinations, ...extendedCombinations].map(({ base, companion, vine }, index) => makeCombination(index + 1, [base, companion, vine, 'Papaya'], index < 78 ? 'reference-four-layer' : 'extended-four-layer'));

export const MULTI_LAYER_CROP_LABELS = {
  Ginger: { bn: 'আদা', en: 'Ginger' },
  Turmeric: { bn: 'হলুদ', en: 'Turmeric' },
  Spinach: { bn: 'পালং শাক', en: 'Spinach' },
  Coriander: { bn: 'ধনিয়া', en: 'Coriander' },
  'Red Spinach': { bn: 'লাল শাক', en: 'Red spinach' },
  'Bitter gourd': { bn: 'করলা', en: 'Bitter gourd' },
  'Little gourd': { bn: 'কুন্দরি', en: 'Little gourd' },
  'Pointed gourd': { bn: 'পটল', en: 'Pointed gourd' },
  'Round gourd': { bn: 'গোল লাউ', en: 'Round gourd' },
  'Bottle gourd': { bn: 'লাউ', en: 'Bottle gourd' },
  'Sponge gourd': { bn: 'ঝিঙে', en: 'Sponge gourd' },
  Cucumber: { bn: 'শসা', en: 'Cucumber' },
  Papaya: { bn: 'পেঁপে', en: 'Papaya' },
};

export function filterMultiLayerCombinations(filters = {}) {
  const query = (filters.query || '').trim().toLocaleLowerCase();
  return MULTI_LAYER_COMBINATIONS.filter((item) => {
    const text = item.crops.flatMap((crop) => [crop, MULTI_LAYER_CROP_LABELS[crop]?.bn || crop]).join(' ').toLocaleLowerCase();
    return (!query || text.includes(query))
      && (!filters.base || item.base === filters.base)
      && (!filters.companion || item.companion === filters.companion)
      && (!filters.vine || item.vine === filters.vine);
  });
}

export function uniqueMultiLayerCrops(field) {
  return [...new Set(MULTI_LAYER_COMBINATIONS.map((item) => item[field]))].sort((a, b) => a.localeCompare(b));
}
