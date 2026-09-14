import { RunPoint } from '../types';

const EARTH_RADIUS_M = 6371000;

// Haversine — accurate enough for a run's distance (a few km at most),
// the difference from a proper geodesic calculation is negligible at
// this scale.
function haversineMeters(a: RunPoint, b: RunPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// GPS jitter while stationary can register as a few meters of "movement"
// per sample — below this threshold a hop is treated as noise rather than
// real distance, so standing still doesn't slowly inflate the total.
const MIN_SEGMENT_METERS = 3;

export function routeDistanceKm(route: RunPoint[]): number {
  let meters = 0;
  for (let i = 1; i < route.length; i++) {
    const d = haversineMeters(route[i - 1], route[i]);
    if (d >= MIN_SEGMENT_METERS) meters += d;
  }
  return meters / 1000;
}

export function formatPace(distanceKm: number, durationSec: number): string {
  if (distanceKm <= 0) return '—';
  const secPerKm = durationSec / distanceKm;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}'${String(sec).padStart(2, '0')}"/km`;
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Projects lat/lng onto a flat local X/Y so the route can be drawn as a
// plain SVG polyline — no basemap tiles, but the traced shape is the real
// recorded path, just not overlaid on real streets/terrain. Equirectangular
// approximation (scale longitude by cos(latitude)) is accurate enough at
// the scale of a single run.
export function projectRoute(route: RunPoint[], width: number, height: number, padding = 8): { x: number; y: number }[] {
  if (route.length === 0) return [];
  const latRad = (route[0].lat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  const xs = route.map((p) => p.lng * cosLat);
  const ys = route.map((p) => p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-6;
  const spanY = maxY - minY || 1e-6;
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  return xs.map((x, i) => ({
    x: (x - minX) * scale + offsetX,
    // Screen Y grows downward while latitude grows northward — flip it.
    y: height - ((ys[i] - minY) * scale + offsetY),
  }));
}
