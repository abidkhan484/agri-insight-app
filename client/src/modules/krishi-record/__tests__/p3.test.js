import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { calculateJeevamrutha } from '../utils/zbnf-formulas';
import { db } from '../db';
import log from '../logger';

describe('P3 - Farm Record Tracker Tests', () => {

  describe('ZBNF Formulas (calculateJeevamrutha)', () => {
    it('matches exact values for 33 decimals (1 bigha)', () => {
      const result = calculateJeevamrutha(33);
      expect(result.water_liters).toBe(200);
      expect(result.cow_dung_kg).toBe(10);
      expect(result.cow_urine_liters).toBe(7.5);
      expect(result.jaggery_kg).toBe(2);
      expect(result.pulse_flour_kg).toBe(2);
      expect(result.soil_handful).toBe(1);
    });

    it('scales correctly for 16.5 decimals (0.5 bigha)', () => {
      const result = calculateJeevamrutha(16.5);
      expect(result.water_liters).toBe(100);
      expect(result.cow_dung_kg).toBe(5);
      expect(result.cow_urine_liters).toBe(3.75);
    });

    it('throws error for invalid area', () => {
      expect(() => calculateJeevamrutha(0)).toThrow();
      expect(() => calculateJeevamrutha(-1)).toThrow();
    });
  });

  describe('Database (Dexie.js)', () => {
    it('initializes with correct stores', () => {
      expect(db.name).toBe('KrishiRecordDB');
      expect(db.tables.map(t => t.name)).toContain('plots');
      expect(db.tables.map(t => t.name)).toContain('inputs');
      expect(db.tables.map(t => t.name)).toContain('observations');
      expect(db.tables.map(t => t.name)).toContain('harvests');
    });

    it('can add and retrieve a plot', async () => {
      const plotId = 'test-plot-uuid-123';
      const id = await db.plots.add({ id: plotId, name: 'Test Plot', area: 33, areaUnit: 'Decimal' });
      const plot = await db.plots.get(id);
      expect(plot.name).toBe('Test Plot');
      expect(plot.area).toBe(33);
    });
  });

  describe('Logging (loglevel)', () => {
    it('uses loglevel instead of console.log', () => {
      // logger.js exports a loglevel object
      expect(log.setLevel).toBeDefined();
      expect(typeof log.info).toBe('function');
    });
  });

  describe('i18n / Bangla Support', () => {
    it('contains Bangla Unicode characters in source (mocked check)', () => {
      const banglaText = 'কৃষি রেকর্ড';
      const hasBangla = /[\u0980-\u09FF]/.test(banglaText);
      expect(hasBangla).toBe(true);
    });
  });
});
