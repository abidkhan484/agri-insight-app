import { describe, it, expect } from 'vitest';
import {
  calculateJeevamrutha,
  calculateBeejamrutha,
  calculateNeemastra,
  calculateAgniastra,
  calculateBrahmastra,
  calculateMulch,
} from '../utils/zbnf-formulas';

describe('P6 — ZBNF Formulation Calculators', () => {
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
      expect(result.water_liters).toBe(200);
      expect(result.neem_leaves_kg).toBe(5);
    });
  });

  describe('Agniastra', () => {
    it('calculates for 33 decimals', () => {
      const result = calculateAgniastra(33);
      // Based on SKILL.md: Per 20L spray treats 33 decimals
      expect(result.water_liters).toBeDefined();
      expect(result.cow_urine_liters).toBeDefined();
    });
  });

  describe('Brahmastra', () => {
    it('calculates for 33 decimals', () => {
      const result = calculateBrahmastra(33);
      expect(result.water_liters).toBeDefined();
    });
  });

  describe('Mulch', () => {
    it('matches specifications for 33 decimals', () => {
      const result = calculateMulch(33);
      expect(result.straw_kg).toBe(1500);
    });
  });
});
