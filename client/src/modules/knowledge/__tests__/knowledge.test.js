import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_CATEGORIES, searchKnowledge } from '../utils/knowledge';

describe('Knowledge Base local catalogue', () => {
  it('searches Bangla content across the documented guidance', () => {
    const results = searchKnowledge('জীবামৃত');

    expect(results.map((item) => item.id)).toContain('jeevamrutha');
    expect(results.find((item) => item.id === 'jeevamrutha').body_bn).toContain('প্রতি ১৫ দিনে');
  });

  it('filters guidance by farmer task category', () => {
    const results = searchKnowledge('', 'pest');

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((item) => item.category === 'pest')).toBe(true);
  });

  it('keeps the category filter Bangla-first and includes all topics', () => {
    expect(KNOWLEDGE_CATEGORIES[0]).toMatchObject({ id: 'all', label_bn: 'সব বিষয়' });
    expect(KNOWLEDGE_CATEGORIES.map((item) => item.id)).toContain('formulation');
  });

  it('contains canonical schedule values in local content', () => {
    const schedule = searchKnowledge('ZBNF task schedule', 'schedule')[0];

    expect(schedule.body_en).toContain('every 15 days');
    expect(schedule.body_en).toContain('every 14 days');
    expect(schedule.body_en).toContain('every 7 days');
  });
});
