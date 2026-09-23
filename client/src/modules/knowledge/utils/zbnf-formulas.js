import log from 'loglevel';

// Set log level based on environment
if (import.meta.env.PROD) {
  log.setLevel('warn');
} else {
  log.setLevel('debug');
}

/** 
 * 1. Jeevamrutha (জীবামৃত) — Soil Microbe Activator
 * Base Recipe — per 200L batch (treats 33 decimals / 1 bigha)
 * Source: skills/zbnf-formulation/SKILL.md Section 1
 */
export function calculateJeevamrutha(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  const ratio = areaDecimal / 33;
  log.debug('jeevamrutha_calculated', { areaDecimal, ratio });
  return {
    water_liters: Math.round(200 * ratio),
    cow_dung_kg: parseFloat((10 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((7.5 * ratio).toFixed(2)),
    jaggery_kg: parseFloat((2 * ratio).toFixed(1)),
    pulse_flour_kg: parseFloat((2 * ratio).toFixed(1)),
    soil_handful: Math.max(1, Math.round(ratio)),
    application_interval_days: 15,
    shelf_life_days: 7,
    notes_bn: 'দেশি গরুর গোবর ও গোমূত্র ব্যবহার করুন। তৈরি জীবামৃত ৭ দিনের মধ্যে ব্যবহার করুন। প্রতি ১৫ দিনে প্রয়োগ করুন।',
    notes_en: 'Use desi cow dung and urine. Use within 7 days of preparation and apply every 15 days.'
  };
}

/** 
 * 2. Beejamrutha (বীজামৃত) — Seed Treatment
 * Per 100 kg Seeds
 * Source: skills/zbnf-formulation/SKILL.md Section 2
 */
export function calculateBeejamrutha(seedKg) {
  if (!seedKg || seedKg <= 0) {
    throw new Error('Seed weight must be > 0');
  }
  const ratio = seedKg / 100;
  log.debug('beejamrutha_calculated', { seedKg, ratio });
  return {
    water_liters: parseFloat((20 * ratio).toFixed(1)),
    cow_dung_kg: parseFloat((5 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(1)),
    lime_grams: parseFloat((50 * ratio).toFixed(1)),
    soil_handful: Math.max(1, Math.round(ratio)),
    notes_bn: 'বপনের আগে প্রলেপ দিন, সরাসরি রোদে নয়—ছায়ায় শুকিয়ে ২৪ ঘণ্টার মধ্যে বপন করুন। এটি একবারের প্রক্রিয়া।',
    notes_en: 'Coat before sowing, dry in shade rather than direct sun, and sow within 24 hours. One-time treatment.'
  };
}

/** 
 * 3. Neemastra (নীমাস্ত্র) — Routine Pest Repellent
 * Per 20L Spray (treats 33 decimals)
 * Source: skills/zbnf-formulation/SKILL.md Section 3
 */
export function calculateNeemastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  const ratio = areaDecimal / 33;
  log.debug('neemastra_calculated', { areaDecimal, ratio });
  return {
    water_liters: Math.round(20 * ratio),
    neem_leaves_kg: parseFloat((5 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(1)),
    cow_dung_grams: Math.round(500 * ratio),
    application_interval_days_prevention: 14,
    application_interval_days_active_pest: 7,
    notes_bn: 'কাপড়ে ছেঁকে ভোরে বা সন্ধ্যায় স্প্রে করুন। আগামী ৬ ঘণ্টায় বৃষ্টি বা ৩৮°সে.-র বেশি তাপমাত্রায় স্প্রে করবেন না।',
    notes_en: 'Strain through cloth and spray morning or evening. Do not spray if rain is expected within 6 hours or temperature exceeds 38°C.'
  };
}

/** 
 * 4. Agniastra (অগ্নিঅস্ত্র) — Severe Pest Control
 * Per 20L Spray (treats 33 decimals)
 * Source: skills/zbnf-formulation/SKILL.md Section 4
 */
export function calculateAgniastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  const ratio = areaDecimal / 33;
  log.debug('agniastra_calculated', { areaDecimal, ratio });
  return {
    cow_urine_liters: Math.round(20 * ratio),
    tobacco_leaves_kg: parseFloat((1 * ratio).toFixed(2)),
    green_chilli_kg: parseFloat((0.5 * ratio).toFixed(2)),
    neem_leaves_kg: parseFloat((5 * ratio).toFixed(1)),
    garlic_kg: parseFloat((0.25 * ratio).toFixed(2)),
    boil_minutes: 5,
    application_interval_days: 7,
    notes_bn: '৫ মিনিট ফুটিয়ে নিন। ঠান্ডা করে ছেঁকে নিন।',
    notes_en: 'Boil for 5 minutes. Cool and strain.'
  };
}

/** 
 * 5. Brahmastra — Extreme Infestation (Last Resort)
 * Per 100L Spray (treats 33 decimals)
 * Source: skills/zbnf-formulation/SKILL.md Section 5
 */
export function calculateBrahmastra(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  const ratio = areaDecimal / 33;
  log.debug('brahmastra_calculated', { areaDecimal, ratio });
  return {
    cow_urine_liters: parseFloat((10 * ratio).toFixed(1)),
    neem_leaves_kg: parseFloat((3 * ratio).toFixed(1)),
    custard_apple_leaves_kg: parseFloat((2 * ratio).toFixed(1)),
    papaya_leaves_kg: parseFloat((2 * ratio).toFixed(1)),
    pomegranate_leaves_kg: parseFloat((2 * ratio).toFixed(1)),
    guava_leaves_kg: parseFloat((2 * ratio).toFixed(1)),
    target_spray_volume_liters: Math.round(100 * ratio),
    application_interval_days: 3,
    notes_bn: 'সব পাতা গোমূত্রে ফুটিয়ে ১০০ লিটার জল দিয়ে পাতলা করুন।',
    notes_en: 'Boil all leaves in cow urine, then dilute to 100L with water.'
  };
}

/** 
 * 6. Mulch (মালচ) — Soil Cover
 * Source: skills/zbnf-formulation/SKILL.md Section 6 & 9
 */
export function calculateMulch(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
    throw new Error('Area must be > 0');
  }
  log.debug('mulch_calculated', { areaDecimal });
  return {
    depth_inches: 4,
    depth_centimeters: 10,
    check_interval_days: 7,
    notes_bn: 'শুকনো ঘাস, খড় বা ফসলের অবশিষ্টাংশ দিয়ে অন্তত ৪ ইঞ্চি (১০ সেমি) স্তর রাখুন। প্রতি ৭ দিনে পরীক্ষা করুন।',
    notes_en: 'Maintain at least a 4-inch (10 cm) layer of dry organic matter and check every 7 days.'
  };
}
