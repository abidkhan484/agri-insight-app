/**
 * Calculate Jeevamrutha batch quantities for a given plot area.
 * @param {number} areaDecimal - Plot area in decimals (must be > 0)
 * @returns {object} Ingredient quantities and application interval
 */
export function calculateJeevamrutha(areaDecimal) {
  if (!areaDecimal || areaDecimal <= 0) {
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

export const conversions = {
  bighaToDecimal: (bigha) => bigha * 33,
  kathaToDecimal: (katha) => katha * 1.65,
  acreToDecimal: (acre) => acre * 100,
  shotokToDecimal: (shotok) => shotok * 1,
  decimalToBigha: (dec) => parseFloat((dec / 33).toFixed(3)),
};
