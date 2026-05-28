// Open-Meteo — free, no API key required, 16-day forecast
const BASE = 'https://api.open-meteo.com/v1/forecast';

const EMOJI = {
  0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
  45:'🌫️', 48:'🌫️',
  51:'🌦️', 53:'🌦️', 55:'🌧️',
  61:'🌦️', 63:'🌧️', 65:'🌧️',
  71:'🌨️', 73:'❄️', 75:'❄️', 77:'🌨️',
  80:'🌦️', 81:'🌧️', 82:'⛈️',
  85:'🌨️', 86:'❄️',
  95:'⛈️', 96:'⛈️', 99:'⛈️',
};
const LABEL = {
  0:'Clear', 1:'Mostly Clear', 2:'Partly Cloudy', 3:'Overcast',
  45:'Foggy', 48:'Foggy',
  51:'Light Drizzle', 53:'Drizzle', 55:'Heavy Drizzle',
  61:'Light Rain', 63:'Rain', 65:'Heavy Rain',
  71:'Light Snow', 73:'Snow', 75:'Heavy Snow', 77:'Sleet',
  80:'Showers', 81:'Showers', 82:'Heavy Showers',
  85:'Snow', 86:'Heavy Snow',
  95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm',
};

let _data = {}, _key = '', _exp = 0;

export async function fetchWeather(lat = 42.28, lon = -71.06) {
  const k = `${lat},${lon}`;
  if (k === _key && Date.now() < _exp && Object.keys(_data).length) return _data;
  try {
    const res = await fetch(
      `${BASE}?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=16`
    );
    if (!res.ok) throw new Error(res.status);
    const { daily } = await res.json();
    const out = {};
    for (let i = 0; i < daily.time.length; i++) {
      const c = daily.weathercode[i] ?? 0;
      out[daily.time[i]] = {
        emoji:  EMOJI[c] ?? '🌡️',
        label:  LABEL[c] ?? '',
        high:   Math.round(daily.temperature_2m_max[i] ?? 70),
        low:    Math.round(daily.temperature_2m_min[i] ?? 55),
        precip: Math.round(daily.precipitation_probability_max[i] ?? 0),
      };
    }
    _data = out; _key = k; _exp = Date.now() + 3_600_000; // 1h cache
    return out;
  } catch (e) {
    console.warn('[weather]', e);
    return {};
  }
}
