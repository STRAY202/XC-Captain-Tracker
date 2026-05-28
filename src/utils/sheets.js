let _cache = null, _exp = 0, _url = '';

function normalizeDate(s) {
  if (!s) return null;
  s = s.replace(/"/g, '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [m, d, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export async function fetchWorkouts(sheetUrl) {
  if (!sheetUrl) return {};
  if (sheetUrl === _url && _cache && Date.now() < _exp) return _cache;
  try {
    const m = sheetUrl.match(/\/d\/([\w-]+)/);
    if (!m) return {};
    const res = await fetch(
      `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=tsv`
    );
    if (!res.ok) return {};
    const text = await res.text();
    const out = {};
    for (const line of text.split('\n').slice(1)) {
      const [rawDate, ...rest] = line.split('\t');
      const date = normalizeDate(rawDate);
      const workout = rest.join(' ').trim().replace(/^"|"$/g, '');
      if (date && workout) out[date] = workout;
    }
    _cache = out; _exp = Date.now() + 5 * 60_000; _url = sheetUrl;
    return out;
  } catch {
    return {};
  }
}
