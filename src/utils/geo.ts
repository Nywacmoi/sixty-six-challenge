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

export const TILE_SIZE = 256;
const MAX_ZOOM = 17;
const MIN_ZOOM = 2;

// Standard slippy-map (Web Mercator) projection: the whole world is
// 2^zoom tiles wide, each TILE_SIZE px. Returns *fractional* tile
// coordinates so a position can be placed precisely inside a tile.
export function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

export function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom);
}

export type TileLayout = {
  zoom: number;
  tiles: { x: number; y: number; left: number; top: number }[];
  points: { x: number; y: number }[];
};

// Picks the tightest zoom at which the whole route still fits in the
// view, then lays out the covering tiles and projects the route into the
// same pixel space so the trace lines up with the streets underneath.
export function buildTileLayout(route: RunPoint[], width: number, height: number, padding = 16): TileLayout | null {
  if (route.length === 0 || width <= 0 || height <= 0) return null;

  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  let zoom = MAX_ZOOM;
  for (let z = MAX_ZOOM; z >= MIN_ZOOM; z--) {
    const spanX = (lngToTileX(maxLng, z) - lngToTileX(minLng, z)) * TILE_SIZE;
    // Tile Y grows southward, so max latitude gives the smaller Y.
    const spanY = (latToTileY(minLat, z) - latToTileY(maxLat, z)) * TILE_SIZE;
    if (spanX <= width - padding * 2 && spanY <= height - padding * 2) {
      zoom = z;
      break;
    }
    zoom = z;
  }

  const centerTileX = (lngToTileX(minLng, zoom) + lngToTileX(maxLng, zoom)) / 2;
  const centerTileY = (latToTileY(minLat, zoom) + latToTileY(maxLat, zoom)) / 2;

  // Pixel coordinates of the view's top-left corner in world-tile space.
  const originX = centerTileX * TILE_SIZE - width / 2;
  const originY = centerTileY * TILE_SIZE - height / 2;

  const firstTileX = Math.floor(originX / TILE_SIZE);
  const lastTileX = Math.floor((originX + width) / TILE_SIZE);
  const firstTileY = Math.floor(originY / TILE_SIZE);
  const lastTileY = Math.floor((originY + height) / TILE_SIZE);
  const maxTileIndex = Math.pow(2, zoom) - 1;

  const tiles: TileLayout['tiles'] = [];
  for (let tx = firstTileX; tx <= lastTileX; tx++) {
    for (let ty = firstTileY; ty <= lastTileY; ty++) {
      if (tx < 0 || ty < 0 || tx > maxTileIndex || ty > maxTileIndex) continue;
      tiles.push({ x: tx, y: ty, left: tx * TILE_SIZE - originX, top: ty * TILE_SIZE - originY });
    }
  }

  const points = route.map((p) => ({
    x: lngToTileX(p.lng, zoom) * TILE_SIZE - originX,
    y: latToTileY(p.lat, zoom) * TILE_SIZE - originY,
  }));

  return { zoom, tiles, points };
}

// Projects lat/lng onto a flat local X/Y so the route can be drawn as a
// plain SVG polyline — no basemap tiles, but the traced shape is the real
// recorded path, just not overlaid on real streets/terrain. Equirectangular
// approximation (scale longitude by cos(latitude)) is accurate enough at
// the scale of a single run. Used as the fallback when tiles are off.
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
