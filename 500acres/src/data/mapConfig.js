export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/light-v11";

export const FLOWS_URL = "/data/genz_flows_geo_topN.json";
export const STATES_GEOJSON_URL = "/data/cb_2023_us_state_20m.geojson";

export const DEFAULT_CENTER = [-98, 38.5];
export const DEFAULT_ZOOM = 3.5;

export const INITIAL_MAP_POSITIONS = [
  { center: [-71.06, 42.36], zoom: 10, duration: 0 },
  { center: [-98, 38.5], zoom: 3.5, duration: 3000 },
];

export const WATER_COLOR = "#e5dccf";
