import { useState } from 'react';
import crops from '../data/crops.json';

const DIVISIONS = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];
const MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

export default function Calendar() {
  const [selectedDivision, setSelectedDivision] = useState('Dhaka');
  const currentMonth = new Date().getMonth() + 1; // 1-based

  return (
    <div className="page calendar">
      <h2>
        <span className="bn">ফসল পঞ্জিকা</span>
        <span className="en">Crop Calendar</span>
      </h2>

      <div className="input-row card">
        <label>
          <span className="bn">বিভাগ নির্বাচন করুন</span>
          <span className="en">Select Division</span>
          <select value={selectedDivision} onChange={(e) => setSelectedDivision(e.target.value)}>
            {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      <div className="current-info card">
        <h3>
          <span className="bn">বর্তমান মাস: {MONTHS_BN[currentMonth - 1]}</span>
          <span className="en">Current Month: {new Date().toLocaleString('default', { month: 'long' })}</span>
        </h3>
      </div>

      <div className="crop-list">
        {crops.map(crop => {
          const matchingSeasons = crop.seasons.filter(s =>
            s.divisions.includes(selectedDivision)
          );

          if (matchingSeasons.length === 0) return null;

          return (
            <div key={crop.id} className="card crop-card">
              <h3>
                <span className="bn">{crop.name_bn}</span>
                <span className="en">{crop.name_en}</span>
              </h3>
              {matchingSeasons.map((s, idx) => (
                <div key={idx} className="season-info">
                  <p>
                    <span className="bn">মৌসুম: {s.name_bn}</span>
                    <span className="en">Season: {s.name_en}</span>
                  </p>
                  <p>
                    <span className="bn">বপনের মাস: {s.planting_months.map(m => MONTHS_BN[m-1]).join(', ')}</span>
                    <span className="en">Planting: {s.planting_months.join(', ')}</span>
                  </p>
                  {s.planting_months.includes(currentMonth) && (
                    <div className="tag active-tag bn">বপনের উপযুক্ত সময়!</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
