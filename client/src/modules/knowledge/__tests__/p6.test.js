import { describe, it, expect } from 'vitest';
import {
  calculateJeevamrutha,
  calculateBeejamrutha,
  calculateNeemastra,
  calculateAgniastra,
  calculateBrahmastra,
  calculateMulch,
} from '../utils/zbnf-formulas';
import { getTutorialVideos, TUTORIAL_VIDEOS } from '../data/tutorial-videos';

describe('P6 — ZBNF Formulation Calculators', () => {
  describe('Tutorial videos', () => {
    it('keeps only relevant middle playlist videos mapped to calculators', () => {
      expect(Object.values(TUTORIAL_VIDEOS).flat()).toHaveLength(5);
      expect(getTutorialVideos('jeevamrutha').map((video) => video.id)).toEqual([
        'tXG2ztBX1DA',
        'f5NTD-Qx1Q8',
      ]);
      expect(getTutorialVideos('mulch')).toEqual([]);
      expect(getTutorialVideos('unknown')).toEqual([]);
    });
  });

  describe('Jeevamrutha', () => {
    it('matches specifications for 33 decimals', () => {
      const result = calculateJeevamrutha(33);
      expect(result.water_liters).toBe(200);
      expect(result.cow_dung_kg).toBe(10);
      expect(result.cow_urine_liters).toBe(7.5);
    });

    it('calculates correctly for 16.5 decimals (half bigha)', () => {
      const result = calculateJeevamrutha(16.5);
      expect(result.water_liters).toBe(100);
      expect(result.cow_dung_kg).toBe(5);
      expect(result.cow_urine_liters).toBe(3.75);
    });
  });

  describe('Beejamrutha', () => {
    it('matches specifications for 100 kg seeds', () => {
      const result = calculateBeejamrutha(100);
      expect(result.water_liters).toBe(20);
      expect(result.cow_dung_kg).toBe(5);
      expect(result.cow_urine_liters).toBe(5);
      // Optional check for lime_grams if mentioned in specs
      if (result.lime_grams !== undefined) {
        expect(result.lime_grams).toBe(50);
      }
    });
  });

  describe('Neemastra', () => {
    it('matches specifications for 33 decimals', () => {
      const result = calculateNeemastra(33);
      expect(result.water_liters).toBe(20);
      expect(result.neem_leaves_kg).toBe(5);
    });
  });

  describe('Agniastra', () => {
    it('calculates for 33 decimals', () => {
      const result = calculateAgniastra(33);
      // Based on SKILL.md: Per 20L spray treats 33 decimals
      expect(result.cow_urine_liters).toBeDefined();
    });
  });

  describe('Brahmastra', () => {
    it('calculates for 33 decimals', () => {
      const result = calculateBrahmastra(33);
      expect(result.target_spray_volume_liters).toBeDefined();
    });
  });

  describe('Mulch', () => {
    it('matches specifications for 33 decimals', () => {
      const result = calculateMulch(33);
      expect(result.depth_inches).toBe(4);
      expect(result.depth_centimeters).toBe(10);
      expect(result.check_interval_days).toBe(7);
    });
  });
});
