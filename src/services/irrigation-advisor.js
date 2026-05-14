/**
 * ZBNF Whapasa Decision Logic for Irrigation and Spraying.
 * Reference: skills/zbnf-formulation/SKILL.md
 */

export const PRECIP_SKIP_THRESHOLD_MM = 5; // > 5mm in 48h → skip irrigation
export const HEAT_ALERT_TEMP_C = 38; // > 38°C → heat alert

/**
 * Determine irrigation/spray advice from weather forecast.
 * @param {object} forecast - Parsed forecast object from weather service
 * @param {number|null} soilMoisture - Optional soil moisture percentage
 * @returns {Array<object>} List of alerts with type, severity, and messages
 */
export function getIrrigationAdvice(forecast, soilMoisture = null) {
  const alerts = [];

  // 1. Irrigation Rule
  if (forecast.next48h_precip_total > PRECIP_SKIP_THRESHOLD_MM) {
    alerts.push({
      type: 'skip_irrigation',
      severity: 'info',
      message_bn: '🌧️ সেচ দেবেন না — আগামী ৪৮ ঘণ্টায় বৃষ্টির পূর্বাভাস আছে',
      message_en: 'Skip irrigation — rain expected in next 48h',
    });
  } else if (soilMoisture !== null) {
    if (soilMoisture < 40) {
      alerts.push({
        type: 'irrigate',
        severity: 'warning',
        message_bn: '☀️ কোনো বৃষ্টি নেই। মাটি শুকনো মনে হলে সেচ দিন।',
        message_en: 'No rain forecast. Irrigate if soil feels dry.',
      });
    }
  } else {
    // If no soil moisture data, we still give general advice if no rain is expected
    alerts.push({
      type: 'irrigate_check',
      severity: 'info',
      message_bn: '☀️ কোনো বৃষ্টি নেই। মাটি শুকনো মনে হলে সেচ দিন।',
      message_en: 'No rain forecast. Irrigate if soil feels dry.',
    });
  }

  // 2. Spray Rule (Neemastra/Agniastra)
  if (forecast.rain_in_next_6h) {
    alerts.push({
      type: 'skip_spray',
      severity: 'warning',
      message_bn: '🚫 আজ নীমাস্ত্র/অগ্নিঅস্ত্র স্প্রে করবেন না — বৃষ্টি আসছে',
      message_en: "Don't spray today — rain will wash it off",
    });
  }

  // 3. Heat Alert Rule
  if (forecast.today.temp_max > HEAT_ALERT_TEMP_C) {
    alerts.push({
      type: 'heat_alert',
      severity: 'critical',
      message_bn: '🔥 তীব্র গরম — ভোরে সেচ দিন, মালচ বাড়ান',
      message_en: 'Extreme heat: Water early morning only. Add extra mulch.',
    });
  }

  return alerts;
}
