import { DATE_LOCALE } from "../constants/theme";

export async function fetchWeather(r, retries = 2) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${r.lat}&longitude=${r.lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,soil_temperature_0cm,soil_moisture_0_to_1cm` +
    `&hourly=soil_moisture_0_to_1cm,soil_temperature_0cm` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration,weather_code` +
    `&timezone=Asia/Almaty&past_days=7&forecast_days=7`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (attempt >= retries) {
        console.warn(`Weather fallback used for ${r.name}:`, e.message);
        return generateFallbackWeather(r);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

function generateFallbackWeather(r) {
  const baseT = Math.round((55 - r.lat) * 1.8 + 12);
  const dates = [];
  const now = new Date();
  for (let i = -7; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return {
    current: {
      temperature_2m: baseT,
      relative_humidity_2m: Math.round(40 + Math.random() * 25),
      precipitation: +(Math.random() * 1.5).toFixed(1),
      wind_speed_10m: +(10 + Math.random() * 10).toFixed(1),
      weather_code: 1,
      soil_temperature_0cm: +(baseT - 1.2).toFixed(1),
      soil_moisture_0_to_1cm: +(0.18 + Math.random() * 0.08).toFixed(3),
    },
    daily: {
      time: dates,
      temperature_2m_max: dates.map(() => +(baseT + 4 + Math.random() * 3).toFixed(1)),
      temperature_2m_min: dates.map(() => +(baseT - 5 + Math.random() * 3).toFixed(1)),
      precipitation_sum: dates.map(() => +(Math.random() > 0.6 ? Math.random() * 3 : 0).toFixed(1)),
      et0_fao_evapotranspiration: dates.map(() => +(2.8 + Math.random() * 2).toFixed(2)),
      weather_code: dates.map(() => 1),
    },
  };
}

export function calcNDVI(moisture, temp, precip) {
  if (moisture == null) return 0.2;
  const m = Math.min(moisture * 2.5, 1);
  const t = temp > 5 && temp < 35 ? Math.min((temp - 5) / 25, 1) * 0.8 + 0.2 : 0.15;
  const p = Math.min(precip / 5, 1) * 0.3;
  return +Math.min(0.85, Math.max(0.05, m * 0.5 + t * 0.3 + p * 0.2)).toFixed(3);
}

export function calcRisk(moisture, temp, precip, et0) {
  let s = 0;
  if (moisture < 0.1) s += 3; else if (moisture < 0.2) s += 2; else if (moisture < 0.3) s += 1;
  if (temp > 35) s += 2; else if (temp > 30) s += 1;
  if (precip < 1) s += 2; else if (precip < 5) s += 1;
  if (et0 > 6) s += 2; else if (et0 > 4) s += 1;
  return s >= 7 ? "critical" : s >= 5 ? "high" : s >= 3 ? "medium" : "low";
}

export function processWeather(raw, lang = "ru") {
  const cur = raw.current || {};
  const d   = raw.daily || {};
  const precip7 = (d.precipitation_sum || []).slice(0, 7).reduce((a, b) => a + (b || 0), 0);
  const et7     = (d.et0_fao_evapotranspiration || []).slice(0, 7).reduce((a, b) => a + (b || 0), 0);
  const avgET   = et7 / 7;
  const ndvi    = calcNDVI(cur.soil_moisture_0_to_1cm, cur.temperature_2m, precip7 / 7);
  const waterStress = avgET > 0 ? Math.min(1, Math.max(0, (precip7 / 7) / avgET)) : 1;

  const chart = (d.time || []).map((dt, i) => {
    const rain  = d.precipitation_sum?.[i] || 0;
    const et0   = d.et0_fao_evapotranspiration?.[i] || 0;
    const tMax  = d.temperature_2m_max?.[i];
    const tMin  = d.temperature_2m_min?.[i];
    const avgT  = (tMax + tMin) / 2;
    const dailyMoist = cur.soil_moisture_0_to_1cm || 0.15;
    const dayNDVI = calcNDVI(dailyMoist, avgT, rain);
    return {
      date: dt,
      label: new Date(dt).toLocaleDateString(DATE_LOCALE[lang] || DATE_LOCALE.ru, { day:"numeric", month:"short" }),
      tMax, tMin, rain, et0,
      balance: rain - et0,
      ndvi: dayNDVI,
      waterStress: et0 > 0 ? Math.min(1, rain / et0) : 1,
    };
  });

  const yieldScore = Math.round(Math.min(100, Math.max(10,
    ndvi * 40 + waterStress * 30 + (cur.temperature_2m > 10 && cur.temperature_2m < 32 ? 30 : 10)
  )));

  const crops = suggestCrops(cur.temperature_2m, cur.soil_moisture_0_to_1cm, precip7 / 7, ndvi);

  return {
    cur, ndvi, chart, crops,
    risk: calcRisk(cur.soil_moisture_0_to_1cm, cur.temperature_2m, precip7 / 7, avgET),
    p7:   +precip7.toFixed(1),
    et:   +avgET.toFixed(2),
    wx:   cur.weather_code,
    waterStress: +waterStress.toFixed(2),
    yieldScore,
  };
}

export function suggestCrops(temp, moisture, precip, ndvi) {
  const crops = [];
  if (temp > 15 && temp < 35 && moisture > 0.15) crops.push({ key:"wheat",     score:85, icon:"🌾" });
  if (temp > 18 && moisture > 0.2)                crops.push({ key:"corn",      score:78, icon:"🌽" });
  if (temp > 12 && temp < 28 && moisture > 0.12)  crops.push({ key:"barley",    score:82, icon:"🌿" });
  if (temp > 20 && moisture > 0.25 && precip > 2) crops.push({ key:"rice",      score:65, icon:"🍚" });
  if (temp > 10 && temp < 30)                     crops.push({ key:"sunflower", score:72, icon:"🌻" });
  if (temp > 8  && moisture > 0.1)                crops.push({ key:"rapeseed",  score:68, icon:"🥬" });
  if (temp > 5  && temp < 25 && moisture > 0.15)  crops.push({ key:"potato",    score:75, icon:"🥔" });
  if (temp > 15 && moisture > 0.18)               crops.push({ key:"cotton",    score:60, icon:"☁️" });
  return crops.sort((a, b) => b.score - a.score).slice(0, 5);
}
