---
name: zbnf-formulation
description: Canonical ZBNF formulation ratios, application schedules, land measurements, and Bangla glossary for Bangladesh farmers. Read this skill before implementing ANY formulation calculator, reminder schedule, irrigation decision, or farming advice feature. All values here are non-negotiable — never approximate or guess.
---

# ZBNF Formulation Knowledge Base

> ZBNF (Zero Budget Natural Farming / প্রাকৃতিক কৃষি) was developed by Subhash Palekar.
> All ratios below are validated reference values. Implement them exactly as specified.

---

## 1. Jeevamrutha (জীবামৃত) — Soil Microbe Activator

### Base Recipe — per 200L batch (treats 33 decimals / 1 bigha)

| Ingredient | Quantity | Bangla |
|-----------|---------|--------|
| Water | 200 L | জল |
| Desi cow dung (fresh) | 10 kg | দেশি গরুর গোবর (তাজা) |
| Desi cow urine | 7.5 L | গোমূত্র |
| Jaggery (gur) | 2 kg | গুড় |
| Pulse flour (gram/arhar) | 2 kg | ডালের আটা |
| Forest/field soil | 1 handful | মাটি (গাছের গোড়ার) |

> ⚠️ Must use **desi (native) cow** only — not Jersey or HF breed.
> Shelf life of prepared Jeevamrutha: **7 days**. Discard after.

### Scaling Formula (JavaScript — canonical implementation)
```js
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
```

### Reference Test Values (QA must verify these exactly)
| Area (decimal) | Water (L) | Cow Dung (kg) | Cow Urine (L) | Jaggery (kg) |
|---------------|-----------|--------------|--------------|-------------|
| 33 (1 bigha) | 200 | 10.0 | 7.50 | 2.0 |
| 16.5 (½ bigha) | 100 | 5.0 | 3.75 | 1.0 |
| 66 (2 bigha) | 400 | 20.0 | 15.00 | 4.0 |
| 10 (small plot) | 61 | 3.0 | 2.27 | 0.6 |

### Application Rules
- **Frequency**: Every **15 days** from planting date (never 14, never 16)
- **Method**: Drench at root zone, or dilute in irrigation water
- **Timing**: Early morning (before 9 AM) or evening (after 5 PM) — never midday
- **Do NOT apply** within 24h of Neemastra/Agniastra spray

---

## 2. Beejamrutha (বীজামৃত) — Seed Treatment

### Per 100 kg Seeds

| Ingredient | Quantity | Bangla |
|-----------|---------|--------|
| Water | 20 L | জল |
| Desi cow dung | 5 kg | গোবর |
| Desi cow urine | 5 L | গোমূত্র |
| Lime (calcium hydroxide) | 50 g | চুন |
| Soil (own farm) | 1 handful | নিজ জমির মাটি |

### Python Scaling Function
```python
from dataclasses import dataclass

@dataclass
class BeejamruthaQuantity:
    water_liters: float
    cow_dung_kg: float
    cow_urine_liters: float
    lime_grams: float

def calculate_beejamrutha(seed_kg: float) -> BeejamruthaQuantity:
    """Calculate Beejamrutha for seed treatment."""
    if seed_kg <= 0:
        raise ValueError(f"seed_kg must be > 0, got {seed_kg}")
    ratio = seed_kg / 100
    return BeejamruthaQuantity(
        water_liters=round(20 * ratio, 1),
        cow_dung_kg=round(5 * ratio, 1),
        cow_urine_liters=round(5 * ratio, 1),
        lime_grams=round(50 * ratio, 1),
    )
```

### Application Rules
- Coat seeds before sowing — let dry **in shade** (not direct sun)
- **Do NOT treat more than 24 hours before sowing**
- One-time process — not a recurring reminder

---

## 3. Neemastra (নীমাস্ত্র) — Routine Pest Repellent

### Per 20L Spray (treats 33 decimals)

| Ingredient | Quantity | Bangla |
|-----------|---------|--------|
| Water | 20 L | জল |
| Neem leaves (fresh, crushed) | 5 kg | নিমপাতা (তাজা, থেঁতো করা) |
| Desi cow urine | 5 L | গোমূত্র |
| Desi cow dung | 500 g | গোবর |

### Scaling Formula
```js
export function calculateNeemastra(areaDecimal) {
  if (areaDecimal <= 0) throw new Error('Area must be > 0');
  const ratio = areaDecimal / 33;
  return {
    water_liters: Math.round(20 * ratio),
    neem_leaves_kg: parseFloat((5 * ratio).toFixed(1)),
    cow_urine_liters: parseFloat((5 * ratio).toFixed(1)),
    cow_dung_grams: Math.round(500 * ratio),
    application_interval_days_prevention: 14,
    application_interval_days_active_pest: 7,
  };
}
```

### Application Rules
- **Prevention**: Every **14 days** (never 15, never 13)
- **Active pest**: Every **7 days**
- **CRITICAL**: Do NOT spray if rain expected within **6 hours** (washes off)
- **CRITICAL**: Do NOT spray if temperature > 38°C (burns leaves)
- Timing: Early morning or evening ONLY
- Strain through cloth before spraying; shake well

---

## 4. Agniastra (অগ্নিঅস্ত্র) — Severe Pest Control

### Per 20L Spray

| Ingredient | Quantity | Bangla |
|-----------|---------|--------|
| Desi cow urine | 20 L | গোমূত্র |
| Local tobacco | 1 kg | তামাক পাতা |
| Green chilli (crushed) | 500 g | কাঁচা মরিচ |
| Neem leaves | 5 kg | নিমপাতা |
| Garlic (crushed) | 250 g | রসুন |

### Preparation
Boil all ingredients together in cow urine for 5 minutes. Cool completely, then strain.

### Application Rules
- **When**: Severe infestation only — NOT for routine use
- **Interval**: Every **7 days** during active severe pest
- Same timing/rain restrictions as Neemastra
- Reserve Agniastra when Neemastra fails twice

---

## 5. Brahmastra — Extreme Infestation (Last Resort)

### Per 100L Spray

| Ingredient | Quantity | Bangla |
|-----------|---------|--------|
| Cow urine | 10 L | গোমূত্র |
| Neem leaves | 3 kg | নিমপাতা |
| Custard apple leaves | 2 kg | আতা পাতা |
| Papaya leaves | 2 kg | পেঁপে পাতা |
| Pomegranate leaves | 2 kg | ডালিম পাতা |
| Guava leaves | 2 kg | পেয়ারা পাতা |

### Application Rules
- **Only** when Agniastra used twice with no improvement
- Boil all leaves together; cool; strain; dilute with water to 100L
- Interval: Every **3 days** during extreme infestation
- Log usage to farmer record — escalation indicator for agronomist consult

---

## 6. Mulch (মালচ) — Soil Cover

### Optimal Thickness
- Minimum: **4 inches** (10 cm)
- Material: Dry grass, straw, dry leaves, crop residue

### Reminder Schedule
- Check mulch layer every **7 days**
- Top up if below 4 inches
- Reminder message: `"মালচ পরীক্ষা করুন — ৪ ইঞ্চির নিচে হলে যোগ করুন\nCheck mulch: top up if below 4 inches"`

---

## 7. Whapasa — Soil Moisture Principle

ZBNF replaces irrigation volume targets with the Whapasa equilibrium state.

### Moisture Threshold Table

| % Moisture | State (EN) | State (BN) | Action |
|-----------|-----------|-----------|--------|
| < 30% | Dry — critical | শুষ্ক — জরুরি | Irrigate immediately |
| 30–40% | Getting dry | শুকিয়ে আসছে | Irrigate soon |
| 40–70% | **Ideal (Whapasa)** | **আদর্শ অবস্থা** | No action |
| 70–80% | Wet | আর্দ্র | Skip irrigation |
| > 80% | Waterlogged | জলাবদ্ধ — জরুরি | Open drainage channels |

### Weather-Based Irrigation Rules
```js
/**
 * Determine irrigation/spray advice from weather forecast.
 * @param {{precipNext48h: number, rainIn6h: boolean, tempMax: number}} forecast
 * @param {number} soilMoisture - Percentage (0–100)
 */
export function getIrrigationAdvice(forecast, soilMoisture) {
  const { precipNext48h, rainIn6h, tempMax } = forecast;
  const alerts = [];

  if (precipNext48h > 5) {
    alerts.push({ type: 'skip_irrigation', severity: 'info',
      message_bn: '🌧️ সেচ দেবেন না — আগামী ৪৮ ঘণ্টায় বৃষ্টির পূর্বাভাস আছে',
      message_en: 'Skip irrigation — rain expected in next 48h' });
  } else if (soilMoisture < 40) {
    alerts.push({ type: 'irrigate', severity: 'warning',
      message_bn: '☀️ কোনো বৃষ্টি নেই। মাটি শুকনো মনে হলে সেচ দিন।',
      message_en: 'No rain forecast. Irrigate if soil feels dry.' });
  }

  if (rainIn6h) {
    alerts.push({ type: 'skip_spray', severity: 'warning',
      message_bn: '🚫 আজ নীমাস্ত্র/অগ্নিঅস্ত্র স্প্রে করবেন না — বৃষ্টি আসছে',
      message_en: "Don't spray today — rain will wash it off" });
  }

  if (tempMax > 38) {
    alerts.push({ type: 'heat_alert', severity: 'critical',
      message_bn: '🔥 তীব্র গরম — ভোরে সেচ দিন, মালচ বাড়ান',
      message_en: 'Extreme heat: Water early morning only. Add extra mulch.' });
  }

  return alerts;
}
```

---

## 8. ZBNF Reminder Schedule

| Reminder Type | Interval | DB value | Bangla |
|--------------|---------|---------|--------|
| Jeevamrutha | 15 days | `jeevamrutha` | জীবামৃত প্রয়োগ |
| Neemastra (prevention) | 14 days | `neemastra` | নীমাস্ত্র স্প্রে |
| Mulch check | 7 days | `mulch` | মালচ পরীক্ষা |
| Irrigation check | Weather-based | `irrigation` | সেচ পরীক্ষা |
| Earthworm count | 30 days | `earthworm` | কেঁচো গণনা |
| Beejamrutha | One-time at sowing | `beejamrutha` | বীজামৃত |

---

## 9. Land Measurement Conversions (Bangladesh)

| Unit | Decimals | Sq Feet |
|------|---------|---------|
| 1 Bigha (BD) | **33 decimal** | 14,400 sq ft |
| 1 Katha | **1.65 decimal** | 720 sq ft |
| 1 Acre | **100 decimal** | 43,560 sq ft |
| 1 Shotok | **1 decimal** | 435.6 sq ft |

```js
export const conversions = {
  bighaToDecimal: (bigha) => bigha * 33,
  kathaToDecimal: (katha) => katha * 1.65,
  acreToDecimal: (acre) => acre * 100,
  shotokToDecimal: (shotok) => shotok * 1,       // 1 shotok = 1 decimal
  decimalToBigha: (dec) => parseFloat((dec / 33).toFixed(3)),
};
```

---

## 10. Bangla ↔ English Glossary

| English | Bangla | Pronunciation Guide |
|---------|--------|-------------------|
| Jeevamrutha | জীবামৃত | Jib-am-rit |
| Beejamrutha | বীজামৃত | Beej-am-rit |
| Neemastra | নীমাস্ত্র | Neem-as-tra |
| Agniastra | অগ্নিঅস্ত্র | Ag-ni-as-tra |
| Brahmastra | ব্রহ্মাস্ত্র | Brah-mas-tra |
| Whapasa | ওয়াপাসা | Wha-pa-sa |
| ZBNF | প্রাকৃতিক কৃষি | Natural farming |
| Mulch | মালচ | Mulch |
| Earthworm | কেঁচো | Ken-cho |
| Soil moisture | মাটির আর্দ্রতা | Matir ardrata |
| Plot | জমি | Jomi |
| Decimal | শতাংশ / ডেসিমেল | Shotangsha |
| Bigha | বিঘা | Bigha |
| Farmer | কৃষক | Krishok |
| Irrigation | সেচ | Sech |
| Crop | ফসল | Phosol |
| Harvest | ফসল কাটা | Phosol kata |
| Pest | পোকামাকড় | Pokamakod |
| Spray | স্প্রে করা | Spray kora |
| Cow dung | গোবর | Gobor |
| Cow urine | গোমূত্র | Gomutro |
| Jaggery | গুড় | Gur |
