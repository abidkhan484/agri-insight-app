import logger from '../config/logger.js';

/**
 * Calculate Jeevamrutha batch quantities for a given plot area.
 * @param {number} areaDecimal - Plot area in decimals (must be > 0)
 * @returns {object} Ingredient quantities and application interval
 */
export function calculateJeevamrutha(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    logger.error('Invalid plot area for Jeevamrutha calculation', { areaDecimal });
    throw new Error(`Invalid plot area: ${areaDecimal}. Must be > 0.`);
  }
  const ratio = areaDecimal / 33;
  return {
    water_liters: Math.round(200 * ratio),
    cow_dung_kg: parseFloat((10 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((7.5 * ratio).toFixed(2)),
    jaggery_kg: parseFloat((2 * ratio).toFixed(1)),
    pulse_flour_kg: parseFloat((2 * ratio).toFixed(1)),
    soil_handful: Math.max(1, Math.round(ratio)),
    application_interval_days: 15,
    unit_description: `${Math.round(200 * ratio)}L batch`,
  };
}

/**
 * Format Jeevamrutha reminder message in Bangla and English.
 * @param {string} plotName
 * @param {object} batch
 * @returns {string}
 */
export function formatJeevamruthaMessage(plotName, batch) {
  return `🌱 জীবামৃত প্রয়োগের সময় হয়েছে — ${plotName}
Jeevamrutha application due — ${plotName}

📦 ব্যাচের পরিমাণ (${batch.unit_description}):
• জল: ${batch.water_liters} লিটার
• গোবর: ${batch.cow_dung_kg} কেজি
• গোমূত্র: ${batch.cow_urine_liters} লিটার
• গুড়: ${batch.jaggery_kg} কেজি
• ডালের আটা: ${batch.pulse_flour_kg} কেজি
• মাটি: ${batch.soil_handful} মুঠো

⏰ পরবর্তী প্রয়োগ ১৫ দিন পরে
Next application in 15 days`;
}

/**
 * Calculate Neemastra batch quantities for a given plot area.
 * @param {number} areaDecimal
 * @returns {object}
 */
export function calculateNeemastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  const ratio = areaDecimal / 33;
  return {
    water_liters: Math.round(20 * ratio),
    neem_leaves_kg: parseFloat((5 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(1)),
    cow_dung_grams: Math.round(500 * ratio),
    application_interval_days_prevention: 14,
  };
}

/**
 * Format Neemastra reminder message.
 * @param {string} plotName
 * @param {object} batch
 * @returns {string}
 */
export function formatNeemastraMessage(plotName, batch) {
  return `🛡️ নীমাস্ত্র প্রয়োগের সময় হয়েছে — ${plotName}
Neemastra application due — ${plotName}

📦 ব্যাচের পরিমাণ (${batch.water_liters} লিটার):
• নিমপাতা: ${batch.neem_leaves_kg} কেজি
• গোমূত্র: ${batch.cow_urine_liters} লিটার
• গোবর: ${batch.cow_dung_grams} গ্রাম

⏰ পরবর্তী প্রয়োগ ১৪ দিন পরে
Next application in 14 days`;
}

/**
 * Format Mulch check message.
 * @param {string} plotName
 * @returns {string}
 */
export function formatMulchMessage(plotName) {
  return `🍂 মালচ পরীক্ষা করুন — ${plotName}
Check mulch layer — ${plotName}

📏 মালচ ৪ ইঞ্চির নিচে হলে যোগ করুন। খড়, শুকনো পাতা বা ঘাস ব্যবহার করতে পারেন।
If mulch is below 4 inches, top up with straw, dry leaves, or grass.

⏰ পরবর্তী পরীক্ষা ৭ দিন পরে
Next check in 7 days`;
}
