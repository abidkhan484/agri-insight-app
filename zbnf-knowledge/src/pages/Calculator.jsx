import { useState } from 'react';
import log from 'loglevel';
import {
  calculateJeevamrutha,
  calculateBeejamrutha,
  calculateNeemastra,
  calculateAgniastra,
  calculateBrahmastra,
  calculateMulch,
} from '../utils/zbnf-formulas.js';

const FORMULAS = {
  jeevamrutha: {
    label_bn: 'জীবামৃত',
    label_en: 'Jeevamrutha',
    fn: calculateJeevamrutha,
    inputLabel_bn: 'জমির পরিমাণ (শতাংশ/ডেসিমেল)',
    inputLabel_en: 'Plot area (decimals)'
  },
  beejamrutha: {
    label_bn: 'বীজামৃত',
    label_en: 'Beejamrutha',
    fn: calculateBeejamrutha,
    inputLabel_bn: 'বীজের পরিমাণ (কেজি)',
    inputLabel_en: 'Seed weight (kg)'
  },
  neemastra: {
    label_bn: 'নীমাস্ত্র',
    label_en: 'Neemastra',
    fn: calculateNeemastra,
    inputLabel_bn: 'জমির পরিমাণ (শতাংশ/ডেসিমেল)',
    inputLabel_en: 'Plot area (decimals)'
  },
  agniastra: {
    label_bn: 'অগ্নিঅস্ত্র',
    label_en: 'Agniastra',
    fn: calculateAgniastra,
    inputLabel_bn: 'জমির পরিমাণ (শতাংশ/ডেসিমেল)',
    inputLabel_en: 'Plot area (decimals)'
  },
  brahmastra: {
    label_bn: 'ব্রহ্মাস্ত্র',
    label_en: 'Brahmastra',
    fn: calculateBrahmastra,
    inputLabel_bn: 'জমির পরিমাণ (শতাংশ/ডেসিমেল)',
    inputLabel_en: 'Plot area (decimals)'
  },
  mulch: {
    label_bn: 'মালচ',
    label_en: 'Mulch',
    fn: calculateMulch,
    inputLabel_bn: 'জমির পরিমাণ (শতাংশ/ডেসিমেল)',
    inputLabel_en: 'Plot area (decimals)'
  },
};

export default function Calculator() {
  const [selected, setSelected] = useState('jeevamrutha');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleCalculate() {
    const value = parseFloat(input);
    setError(null);
    if (isNaN(value) || value <= 0) {
      setError('সঠিক পরিমাণ লিখুন / Please enter a valid value');
      return;
    }
    try {
      const r = FORMULAS[selected].fn(value);
      setResult(r);
      log.info('formula_calculated', { formula: selected, input: value });
    } catch (err) {
      log.error('formula_error', { formula: selected, error: err.message });
      setError(err.message);
    }
  }

  const formula = FORMULAS[selected];

  return (
    <div className="page calculator">
      <h2>
        <span className="bn">হিসাব করুন</span>
        <span className="en">Calculators</span>
      </h2>

      <div className="formula-tabs">
        {Object.entries(FORMULAS).map(([key, f]) => (
          <button
            key={key}
            className={selected === key ? 'tab active' : 'tab'}
            onClick={() => { setSelected(key); setResult(null); setInput(''); setError(null); }}
          >
            <span className="bn">{f.label_bn}</span>
          </button>
        ))}
      </div>

      <div className="input-row card">
        <label>
          <span className="bn">{formula.inputLabel_bn}</span>
          <span className="en">{formula.inputLabel_en}</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0.0"
          />
        </label>
        <button onClick={handleCalculate} className="btn-calculate">
          <span className="bn">হিসাব করুন</span>
          <span className="en">Calculate</span>
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-card page">
          <h3>
            <span className="bn">প্রয়োজনীয় উপকরণ ({formula.label_bn})</span>
            <span className="en">Ingredients ({formula.label_en})</span>
          </h3>
          <table className="ingredients">
            <tbody>
              {Object.entries(result)
                .filter(([k]) => !['notes_bn', 'notes_en'].includes(k))
                .map(([key, val]) => (
                  <tr key={key}>
                    <td className="key">{key.replace(/_/g, ' ')}</td>
                    <td className="val">{val}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="card note-card">
            <p className="bn"><strong>নোট:</strong> {result.notes_bn}</p>
            <p className="en"><strong>Note:</strong> {result.notes_en}</p>
          </div>
        </div>
      )}
    </div>
  );
}
