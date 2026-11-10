import { matchFeatureToRegion } from "../constants/regions";

const LEAFLET_CSS  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS   = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
const LEAFLET_HEAT = "https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js";


export const BASE_LAYERS = {
  satellite: { url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",         label:"🛰️", name:"Satellite" },
  dark:      { url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",                                        label:"🌙", name:"Dark" },
  terrain:   { url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",                                                     label:"⛰️", name:"Terrain" },
  streets:   { url:"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",                              label:"🗺️", name:"Streets" },
};


export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}


export function loadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}


export const _leafletReady = (() => {
  loadCSS(LEAFLET_CSS);
  return loadScript(LEAFLET_JS).then(() => loadScript(LEAFLET_HEAT).catch(() => {}));
})();


export const getMapCSS = (T) => `
  .leaflet-container { background:${T.mapBg} !important; }
  .leaflet-control-zoom a { background:${T.zoomBg}!important; color:${T.zoomFg}!important; border-color:${T.zoomBrd}!important; }
  .leaflet-control-attribution { display:none !important; }
  .agro-popup .leaflet-popup-content-wrapper { background:${T.popupBg}; color:${T.fg}; border:1px solid ${T.popupBrd}; border-radius:14px; box-shadow:${T.popupSh}; }
  .agro-popup .leaflet-popup-content { margin:12px 14px !important; }
  .agro-popup .leaflet-popup-tip { background:${T.popupBg}; }
  .agro-popup .leaflet-popup-close-button { color:${T.sub}!important; font-size:20px!important; top:6px!important; right:8px!important; }
  .agro-pulse { animation:agro-ring 2.5s ease-out infinite; }
  @keyframes agro-ring { 0%{box-shadow:0 0 0 0 currentColor;opacity:.7} 70%{box-shadow:0 0 0 18px transparent;opacity:0} 100%{box-shadow:0 0 0 0 transparent;opacity:0} }
  .leaflet-tooltip { background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important; }
  .leaflet-tooltip::before { display:none!important; }
`;


export function calcHectares(sw, ne) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371000;
  const dLat = Math.abs(ne.lat - sw.lat);
  const dLng = Math.abs(ne.lng - sw.lng);
  const midLat = (sw.lat + ne.lat) / 2;
  const h = dLat * (Math.PI / 180) * R;
  const w = dLng * (Math.PI / 180) * R * Math.cos(toRad(midLat));
  return (h * w) / 10000;
}


export function formatHa(ha) {
  if (ha >= 10000) return `${(ha/1000).toFixed(1)} тыс. га`;
  if (ha >= 100)   return `${Math.round(ha).toLocaleString()} га`;
  if (ha >= 1)     return `${ha.toFixed(1)} га`;
  return `${(ha*10000).toFixed(0)} м²`;
}


export const GEOJSON_URLS = [
  "https://raw.githubusercontent.com/open-data-kazakhstan/geo-boundaries-kz/master/data/geo-boundaries-kz.geojson",
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/KAZ/ADM1/geoBoundaries-KAZ-ADM1.geojson",
];


let _geoCache = null;
export async function loadBoundaries() {
  if (_geoCache) return _geoCache;
  for (const url of GEOJSON_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const geojson = await res.json();
      if (geojson?.features?.length) {
        const map = {};
        for (const f of geojson.features) {
          const id = matchFeatureToRegion(f);
          if (id) map[id] = f.geometry;
        }
        if (Object.keys(map).length >= 10) { _geoCache = map; return map; }
      }
    } catch(e) { /* try next url */ }
  }
  return null;
}
