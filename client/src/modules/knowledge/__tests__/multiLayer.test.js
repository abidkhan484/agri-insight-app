import { describe, expect, it } from 'vitest';
import {
  MULTI_LAYER_COMBINATIONS,
  filterMultiLayerCombinations,
} from '../utils/multiLayer';

describe('multi-layer crop compatibility catalogue', () => {
  it('contains all 110 combinations from the reference list', () => {
    expect(MULTI_LAYER_COMBINATIONS).toHaveLength(110);
    expect(MULTI_LAYER_COMBINATIONS[0].crops).toEqual(['Ginger', 'Cholai', 'Bitter gourd', 'Papaya']);
  });

  it('filters by a crop search term across the combination', () => {
    const results = filterMultiLayerCombinations({ query: 'turmeric' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.crops.includes('Turmeric'))).toBe(true);
  });

  it('supports Bengali crop names in search', () => {
    const results = filterMultiLayerCombinations({ query: 'আদা' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.base === 'Ginger')).toBe(true);
  });

  it('combines filters and returns no results for an unknown crop', () => {
    expect(filterMultiLayerCombinations({ base: 'Ginger', companion: 'Cucumber' })).toHaveLength(4);
    expect(filterMultiLayerCombinations({ query: 'dragon fruit' })).toHaveLength(0);
  });

  it('treats empty or missing filters as the complete catalogue', () => {
    expect(filterMultiLayerCombinations()).toHaveLength(110);
    expect(filterMultiLayerCombinations({ query: '  ' })).toHaveLength(110);
  });
});
