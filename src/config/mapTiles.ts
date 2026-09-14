// Basemap tiles for the run map (see components/RouteMap.tsx).
//
// Raster tiles from the OSM Foundation's own servers. Worth knowing: their
// tile policy (operations.osmfoundation.org/policies/tiles) asks apps not
// to pull from these servers at scale — fine for a personal project, but
// if this app ever gets real traffic, switch to a keyed provider. Only the
// two constants below change; the rest of the map code is
// provider-agnostic. MapTiler's free tier, for example:
//   https://api.maptiler.com/maps/dark-matter/{z}/{x}/{y}@2x.png?key=YOUR_KEY
//
// Attribution is required by the ODbL licence whichever provider is used,
// and is rendered over the map itself — don't remove it.
export const TILE_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION = '© OpenStreetMap';

// OSM's standard style is bright, and this app is dark — a scrim over the
// tiles keeps the map readable without fighting the rest of the UI. 0 = no
// dimming, 1 = black.
export const TILE_DIM_OPACITY = 0.55;

export function tileUrl(z: number, x: number, y: number): string {
  return TILE_URL_TEMPLATE.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
}
