/** The anchor point every place on this map is "near". */
export const IMPULSE_SF = {
  name: "Impulse SF",
  address: "101 15th St, San Francisco, CA 94103",
  lng: -122.40217,
  lat: 37.76724,
} as const;

export const DEFAULT_ZOOM = 14.5;

/** OpenFreeMap vector style. See https://openfreemap.org/quick_start/ */
export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
