import { useEffect, useState } from 'react';

export interface WeatherSnapshot {
  tempF: number;
  condition: string;
  icon: string;
  precipitationIn: number;
  windMph: number;
  fetchedAt: number;
}

const CACHE_KEY = 'condenser_weather_cache_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;

function readCache(key: string): WeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, snap: WeatherSnapshot) {
  try {
    localStorage.setItem(`${CACHE_KEY}_${key}`, JSON.stringify(snap));
  } catch {}
}

function wmoToCondition(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code <= 2) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Cloudy', icon: '☁️' };
  if (code <= 48) return { label: 'Fog', icon: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '❄️' };
  if (code <= 82) return { label: 'Showers', icon: '🌦️' };
  if (code <= 86) return { label: 'Snow Showers', icon: '🌨️' };
  if (code <= 99) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: '—', icon: '•' };
}

export function useWeather(lat: number, lon: number) {
  const key = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const [snap, setSnap] = useState<WeatherSnapshot | null>(() => readCache(key));
  const [loading, setLoading] = useState(!snap);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache(key);
    if (cached) {
      setSnap(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const c = data?.current;
        if (!c) throw new Error('No data');
        const cond = wmoToCondition(c.weather_code);
        const next: WeatherSnapshot = {
          tempF: Math.round(c.temperature_2m),
          condition: cond.label,
          icon: cond.icon,
          precipitationIn: c.precipitation ?? 0,
          windMph: Math.round(c.wind_speed_10m ?? 0),
          fetchedAt: Date.now(),
        };
        writeCache(key, next);
        setSnap(next);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, lat, lon]);

  return { snap, loading, error };
}
