import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME, REGIONS } from "../constants/regions";
import { ndviColor, moistColor } from "../utils/styleUtils";
import {
  _leafletReady, BASE_LAYERS, loadBoundaries, getMapCSS,
  calcHectares, formatHa,
} from "../utils/mapUtils";

export default function LeafletMap({ data, selected, onSelect, layer = "ndvi", height = "100%", drawMode = false, onAreaCapture }) {
  const { T, RISK_STYLE, lang } = useTheme();
  const rn = useCallback((r) => RNAME[r.id]?.[lang] || r.name, [lang]);
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const geoRef       = useRef(null);
  const drawRef      = useRef({ active:false, rect:null, start:null });
  const baseRef      = useRef(null);
  const labelsRef    = useRef(null);
  const hillRef      = useRef(null);
  const heatRef      = useRef(null);

  const [ready,     setReady]     = useState(false);
  const [drawing,   setDrawing]   = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [areaHa,    setAreaHa]    = useState(null);
  const [baseLayer, setBaseLayer] = useState("satellite");
  const [showHeat,  setShowHeat]  = useState(false);
  const [showRelief,setShowRelief]= useState(true);

  const getColor = useCallback((r) => {
    const d = data[r.id];
    if (!d) return T.isDark ? "#1e2428" : "#c8e0d4";
    if (layer === "moisture") return moistColor(d.cur?.soil_moisture_0_to_1cm || 0, T);
    if (layer === "temp") { const t = d.cur?.temperature_2m||15; return t>35?T.err:t>28?T.warn:t>15?T.ok:T.sky; }
    if (layer === "risk") return RISK_STYLE[d.risk||"medium"].color;
    return ndviColor(d.ndvi || 0.2, T);
  }, [data, layer]);

  // Init map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await _leafletReady;
      if (cancelled || !containerRef.current || mapRef.current) return;
      if (!document.getElementById("agro-leaflet-css")) {
        const st = document.createElement("style");
        st.id = "agro-leaflet-css"; st.textContent = getMapCSS(T);
        document.head.appendChild(st);
      }
      const L = window.L;
      const map = L.map(containerRef.current, {
        center:[48.5,67.0], zoom:5, zoomControl:true, attributionControl:false,
        minZoom:5, maxZoom:17,
        maxBounds:L.latLngBounds([39.5,45],[56.5,89]), maxBoundsViscosity:1.0,
      });
      baseRef.current = L.tileLayer(BASE_LAYERS.satellite.url, { maxZoom:18 }).addTo(map);
      labelsRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom:18, opacity:0.45 }
      ).addTo(map);
      hillRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
        { maxZoom:18, opacity:0.18 }
      ).addTo(map);
      mapRef.current = map;
      loadBoundaries().then(geo => { if (!cancelled && geo) geoRef.current = geo; setReady(true); }).catch(() => setReady(true));
    })();
    return () => { cancelled = true; };
  }, []);

  // Switch base layer
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const map = mapRef.current;
    if (baseRef.current) map.removeLayer(baseRef.current);
    baseRef.current = window.L.tileLayer(BASE_LAYERS[baseLayer].url, { maxZoom:18 }).addTo(map);
    baseRef.current.bringToBack();
    if (labelsRef.current) labelsRef.current.setOpacity(baseLayer==="satellite" ? 0.45 : 0);
  }, [ready, baseLayer]);

  // Toggle relief
  useEffect(() => { if (hillRef.current) hillRef.current.setOpacity(showRelief ? 0.18 : 0); }, [ready, showRelief]);

  // Heatmap
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L?.heatLayer) return;
    const map = mapRef.current;
    if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    if (!showHeat) return;
    const points = [];
    REGIONS.forEach(r => {
      const d = data[r.id];
      if (!d?.cur) return;
      const val = layer==="temp" ? Math.max(0,d.cur.temperature_2m||0)/45
        : layer==="moisture" ? (d.cur.soil_moisture_0_to_1cm||0)*2
        : layer==="risk" ? ({critical:1,high:.75,medium:.5,low:.25}[d.risk]||.3)
        : (d.ndvi||0.2);
      for (let i=0;i<8;i++) points.push([r.lat+(Math.random()-.5)*1.5, r.lng+(Math.random()-.5)*2, val]);
    });
    heatRef.current = window.L.heatLayer(points, { radius:45, blur:35, maxZoom:8 }).addTo(map);
  }, [ready, showHeat, data, layer]);

  // Region markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = mapRef.current;
    const geo = geoRef.current;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    REGIONS.forEach(r => {
      const d = data[r.id];
      const color = getColor(r);
      const isSel = selected?.id === r.id;
      const boundary = geo?.[r.id];

      const metricVal = d ? (
        layer==="temp" ? `${d.cur?.temperature_2m?.toFixed(0)}°`
        : layer==="moisture" ? `${(d.cur?.soil_moisture_0_to_1cm*100).toFixed(0)}%`
        : layer==="risk" ? (RISK_STYLE[d.risk]?.icon||"")
        : `${d.ndvi?.toFixed(2)}`
      ) : "";
      const metricColor = d ? (
        layer==="temp" ? (d.cur?.temperature_2m>30?T.err:d.cur?.temperature_2m>20?T.warn:T.sky)
        : layer==="moisture" ? moistColor(d.cur?.soil_moisture_0_to_1cm||0, T)
        : layer==="risk" ? (RISK_STYLE[d.risk]?.color||T.dim)
        : ndviColor(d.ndvi||0.2, T)
      ) : T.dim;

      const popupHTML = d?.cur ? (() => {
        const riskS = RISK_STYLE[d.risk]||RISK_STYLE.medium;
        return `<div style="font-family:Inter,system-ui;min-width:190px;padding:4px 2px;">
          <div style="font-size:14px;font-weight:800;margin-bottom:10px;color:${T.fg};">${rn(r)}</div>
          <div style="display:grid;gap:5px;font-size:11px;">
            <div style="display:flex;justify-content:space-between;"><span style="color:${T.sub};">Temp</span><span style="color:${T.fg};font-weight:700;">${d.cur.temperature_2m?.toFixed(1)}°C</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:${T.sub};">Moisture</span><span style="color:${T.sky};font-weight:700;">${(d.cur.soil_moisture_0_to_1cm*100).toFixed(1)}%</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:${T.sub};">NDVI</span><span style="color:${T.ok};font-weight:700;">${d.ndvi?.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:${T.sub};">Rain 7d</span><span style="color:${T.ok};font-weight:700;">${d.p7} мм</span></div>
          </div>
          <div style="margin-top:10px;display:inline-flex;align-items:center;gap:4px;background:${riskS.bg};color:${riskS.color};border:1px solid ${riskS.brd};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">
            <span style="font-size:8px;">${riskS.icon}</span> ${riskS.label}
          </div>
        </div>`;
      })() : null;

      if (boundary) {
        const poly = L.geoJSON(boundary, {
          style: { color:isSel?"#059669":"rgba(0,80,60,0.4)", weight:isSel?3:1.5, fillColor:color, fillOpacity:isSel?.45:.28, dashArray:isSel?null:"4 2" },
        }).addTo(map);
        const center = poly.getBounds().getCenter();
        poly.bindTooltip(L.tooltip({ permanent:true, direction:"center", className:"" }).setContent(
          `<div style="background:${T.labelBg};color:${T.labelFg};padding:4px 10px;border-radius:8px;font-size:${isSel?12:10}px;font-weight:700;border:1px solid ${isSel?"rgba(5,150,105,0.4)":"rgba(0,80,60,0.15)"};font-family:Inter,system-ui;white-space:nowrap;display:flex;align-items:center;gap:5px;backdrop-filter:blur(6px);">
            <span>${r.code}</span><span style="font-size:${isSel?11:9}px;color:${metricColor};font-weight:800;">${metricVal}</span>
          </div>`
        ));
        if (popupHTML) poly.bindPopup(popupHTML, { className:"agro-popup", maxWidth:260 });
        poly.on("click", () => onSelect(r));
        if (isSel) {
          const hl = L.geoJSON(boundary, { style:{ color:"#059669",weight:4,fillColor:"transparent",fillOpacity:0,opacity:0.6,className:"agro-pulse" } }).addTo(map);
          markersRef.current.push(hl);
        }
        markersRef.current.push(poly);
      } else {
        const radius = Math.max(10, Math.sqrt(r.crop/200)*2.5+6);
        const glow = L.circleMarker([r.lat,r.lng], { radius:radius+(isSel?16:8), color:"transparent", fillColor:color, fillOpacity:isSel?.22:.10 }).addTo(map);
        const marker = L.circleMarker([r.lat,r.lng], { radius:isSel?radius+3:radius, color:isSel?"#059669":"rgba(0,60,40,0.3)", weight:isSel?3:2, fillColor:color, fillOpacity:isSel?.95:.8, className:isSel?"agro-pulse":"" }).addTo(map);
        marker.bindTooltip(L.tooltip({ permanent:true, direction:"top", offset:[0,-radius-4], className:"" }).setContent(
          `<div style="background:${T.labelBg};color:${T.labelFg};padding:4px 10px;border-radius:7px;font-size:11px;font-weight:700;border:1px solid rgba(0,80,60,0.15);font-family:Inter,system-ui;white-space:nowrap;display:flex;align-items:center;gap:4px;backdrop-filter:blur(6px);">${r.code} <span style="font-size:9px;opacity:0.7;">${metricVal}</span></div>`
        ));
        if (popupHTML) marker.bindPopup(popupHTML, { className:"agro-popup", maxWidth:260 });
        marker.on("click", () => onSelect(r));
        markersRef.current.push(marker, glow);
      }
    });
  }, [ready, data, layer, selected, getColor, onSelect]);

  // Fly to selected
  useEffect(() => {
    if (!ready || !mapRef.current || !selected || !window.L) return;
    const geo = geoRef.current;
    try {
      if (geo?.[selected.id]) {
        const l = window.L.geoJSON(geo[selected.id]);
        mapRef.current.flyToBounds(l.getBounds().pad(0.15), { duration:0.8 });
      } else {
        mapRef.current.flyTo([selected.lat, selected.lng], 7, { duration:0.8 });
      }
    } catch(e) { mapRef.current.flyTo([selected.lat, selected.lng], 7); }
  }, [ready, selected]);

  // Draw mode
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = mapRef.current;
    const dr = drawRef.current;

    if (!drawMode) {
      if (dr.rect) { map.removeLayer(dr.rect); dr.rect = null; }
      dr.active = false;
      map.dragging.enable();
      map.scrollWheelZoom?.enable();
      map.getContainer().style.cursor = "";
      setDrawing(false); setAreaHa(null);
      return;
    }

    map.dragging.disable();
    map.scrollWheelZoom?.disable();
    map.getContainer().style.cursor = "crosshair";
    setDrawing(true); setAreaHa(null);

    const drawStart = (ll) => { dr.start = ll; dr.active = true; setAreaHa(null); if (dr.rect) { map.removeLayer(dr.rect); dr.rect = null; } };
    const drawMove  = (ll) => {
      if (!dr.active || !dr.start) return;
      const bounds = L.latLngBounds(dr.start, ll);
      if (dr.rect) dr.rect.setBounds(bounds);
      else dr.rect = L.rectangle(bounds, { color:T.violet, weight:2, fillColor:T.violet, fillOpacity:0.15, dashArray:"6 3" }).addTo(map);
      setAreaHa(calcHectares(bounds.getSouthWest(), bounds.getNorthEast()));
    };
    const drawEnd = async (ll) => {
      if (!dr.active || !dr.start) return;
      dr.active = false;
      const bounds = L.latLngBounds(dr.start, ll);
      const sw = bounds.getSouthWest(); const ne = bounds.getNorthEast();
      if (Math.abs(ne.lat-sw.lat)<0.002 || Math.abs(ne.lng-sw.lng)<0.002) return;
      const ha = calcHectares(sw, ne);
      setAreaHa(ha);
      if (onAreaCapture) {
        setCapturing(true);
        try {
          let dataUrl = null;
          try {
            const container = map.getContainer();
            const mapRect = container.getBoundingClientRect();
            const swPx = map.latLngToContainerPoint(sw);
            const nePx = map.latLngToContainerPoint(ne);
            const x = Math.min(swPx.x, nePx.x); const y = Math.min(swPx.y, nePx.y);
            const w = Math.abs(nePx.x-swPx.x); const h = Math.abs(nePx.y-swPx.y);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(w,100); canvas.height = Math.max(h,100);
            const ctx2d = canvas.getContext("2d");
            let drawn = 0;
            container.querySelectorAll(".leaflet-tile-pane img").forEach(tile => {
              try {
                const tr = tile.getBoundingClientRect();
                ctx2d.drawImage(tile, tr.left-mapRect.left-x, tr.top-mapRect.top-y, tr.width, tr.height);
                drawn++;
              } catch(e) {}
            });
            if (drawn > 0) dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          } catch(e) {}

          if (!dataUrl || dataUrl.length < 500) {
            try {
              const bbox = `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`;
              const res = await fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=900,600&imageSR=4326&format=jpg&f=image`);
              if (res.ok) {
                const blob = await res.blob();
                if (blob.size >= 1000) dataUrl = await new Promise((resolve,reject) => { const r2 = new FileReader(); r2.onloadend=()=>resolve(r2.result); r2.onerror=reject; r2.readAsDataURL(blob); });
              }
            } catch(e) {}
          }

          if (!dataUrl || dataUrl.length < 500) {
            const pc = document.createElement("canvas"); pc.width=900; pc.height=600;
            const pCtx = pc.getContext("2d");
            pCtx.fillStyle="#1a3a2a"; pCtx.fillRect(0,0,900,600);
            pCtx.strokeStyle="rgba(74,222,128,0.15)"; pCtx.lineWidth=1;
            for (let i=0;i<900;i+=60){pCtx.beginPath();pCtx.moveTo(i,0);pCtx.lineTo(i,600);pCtx.stroke();}
            for (let i=0;i<600;i+=60){pCtx.beginPath();pCtx.moveTo(0,i);pCtx.lineTo(900,i);pCtx.stroke();}
            pCtx.fillStyle="#4ade80"; pCtx.font="bold 18px Inter,system-ui"; pCtx.textAlign="center";
            pCtx.fillText("DalaSpace — Satellite Area Capture",450,260);
            pCtx.fillStyle="rgba(255,255,255,0.5)"; pCtx.font="14px Inter,system-ui";
            pCtx.fillText(`${sw.lat.toFixed(4)}°N, ${sw.lng.toFixed(4)}°E → ${ne.lat.toFixed(4)}°N, ${ne.lng.toFixed(4)}°E`,450,300);
            pCtx.fillText(formatHa(ha),450,325);
            dataUrl = pc.toDataURL("image/jpeg",0.9);
          }

          if (dataUrl && dataUrl.length > 100) {
            onAreaCapture({ preview:dataUrl, bounds:{ sw:{lat:sw.lat,lng:sw.lng}, ne:{lat:ne.lat,lng:ne.lng} }, name:`Sat_${sw.lat.toFixed(2)}_${sw.lng.toFixed(2)}.jpg`, hectares:ha });
          }
        } catch(e) { console.error(e); }
        setCapturing(false); setAreaHa(null);
      }
    };

    const onMouseDown = e => drawStart(e.latlng);
    const onMouseMove = e => drawMove(e.latlng);
    const onMouseUp   = e => drawEnd(e.latlng);
    const el = map.getContainer();
    const tll = touch => { const rect=el.getBoundingClientRect(); return map.containerPointToLatLng(L.point(touch.clientX-rect.left, touch.clientY-rect.top)); };
    const onTouchStart = e => { if (e.touches.length!==1) return; e.preventDefault(); drawStart(tll(e.touches[0])); };
    const onTouchMove  = e => { if (e.touches.length!==1) return; e.preventDefault(); drawMove(tll(e.touches[0])); };
    const onTouchEnd   = e => { const t=e.changedTouches[0]; if (!t) return; e.preventDefault(); drawEnd(tll(t)); };

    map.on("mousedown",onMouseDown); map.on("mousemove",onMouseMove); map.on("mouseup",onMouseUp);
    el.addEventListener("touchstart",onTouchStart,{passive:false});
    el.addEventListener("touchmove",onTouchMove,{passive:false});
    el.addEventListener("touchend",onTouchEnd,{passive:false});

    return () => {
      map.off("mousedown",onMouseDown); map.off("mousemove",onMouseMove); map.off("mouseup",onMouseUp);
      el.removeEventListener("touchstart",onTouchStart);
      el.removeEventListener("touchmove",onTouchMove);
      el.removeEventListener("touchend",onTouchEnd);
      map.dragging.enable(); map.scrollWheelZoom?.enable();
      map.getContainer().style.cursor="";
    };
  }, [ready, drawMode, onAreaCapture]);

  // Resize invalidate
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    const doResize = () => map.invalidateSize();
    doResize();
    const t1=setTimeout(doResize,200); const t2=setTimeout(doResize,600);
    window.addEventListener("resize",doResize);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize",doResize); };
  }, [ready, height]);

  const containerHeight = typeof height==="number" ? `${height}px` : height;

  return (
    <div style={{position:"relative", width:"100%", height:containerHeight}}>
      <div ref={containerRef} style={{width:"100%", height:"100%", borderRadius:"inherit", zIndex:1}}/>

      {/* Live indicator */}
      <div style={{position:"absolute", bottom:14, left:14, zIndex:1000, display:"flex", alignItems:"center", gap:6, background:T.labelBg, padding:"5px 12px", borderRadius:20, backdropFilter:"blur(8px)", border:`1px solid ${T.brd}`}}>
        <span style={{width:6, height:6, borderRadius:"50%", background:drawing?T.violet:T.leaf, display:"inline-block", animation:"blink 2s infinite"}}/>
        <span style={{fontSize:10, color:drawing?T.violet:T.dim}}>{drawing?"Проведите для выделения":"Open-Meteo · Esri · live"}</span>
      </div>

      {/* Draw banner */}
      {drawing && (
        <div style={{position:"absolute", top:14, left:"50%", transform:"translateX(-50%)", zIndex:1000, background:"rgba(124,58,237,0.08)", padding:"8px 20px", borderRadius:12, backdropFilter:"blur(10px)", border:`1px solid rgba(124,58,237,0.3)`, display:"flex", alignItems:"center", gap:10}}>
          <span style={{fontSize:14}}>✦</span>
          <span style={{fontSize:12, fontWeight:700, color:T.violet}}>
            {areaHa!=null && areaHa>0 ? `Выделено: ${formatHa(areaHa)}` : "Выделите область"}
          </span>
        </div>
      )}

      {/* Capturing overlay */}
      {capturing && (
        <div style={{position:"absolute", inset:0, zIndex:1001, background:T.labelBg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, borderRadius:"inherit"}}>
          <div style={{width:44, height:44, borderRadius:"50%", border:`3px solid ${T.brd}`, borderTopColor:T.violet, animation:"revolve 1s linear infinite"}}/>
          <span style={{fontSize:13, fontWeight:700, color:T.violet}}>Загрузка снимка…</span>
        </div>
      )}

      {/* Legend */}
      <div style={{position:"absolute", top:14, right:14, zIndex:1000, background:T.labelBg, padding:"10px 14px 8px", borderRadius:12, backdropFilter:"blur(10px)", border:`1px solid ${T.brd}`, width:180}}>
        <div style={{fontSize:10, fontWeight:700, color:T.fg, marginBottom:6}}>
          {layer==="ndvi"?"NDVI":layer==="moisture"?"Влажность":layer==="temp"?"Температура":"Риск"}
        </div>
        <div style={{height:8, borderRadius:4, background:
          layer==="ndvi"     ? "linear-gradient(90deg,#ef4444,#f97316,#facc15,#22c55e,#059669)"
          :layer==="moisture"? "linear-gradient(90deg,#ef4444,#facc15,#22c55e,#3b82f6,#6366f1)"
          :layer==="temp"    ? "linear-gradient(90deg,#3b82f6,#22c55e,#facc15,#f97316,#ef4444)"
          :                    "linear-gradient(90deg,#059669,#22c55e,#facc15,#f97316,#ef4444)"
        }}/>
      </div>

      {/* Base layer switcher */}
      {!drawing && (
        <div style={{position:"absolute", top:14, left:14, zIndex:1000, display:"flex", flexDirection:"column", gap:4}}>
          <div style={{background:T.labelBg, borderRadius:10, backdropFilter:"blur(10px)", border:`1px solid ${T.brd}`, padding:3, display:"flex", gap:2}}>
            {Object.entries(BASE_LAYERS).map(([key,cfg]) => (
              <button key={key} onClick={() => setBaseLayer(key)} title={cfg.name} style={{width:32, height:28, borderRadius:7, border:"none", cursor:"pointer", background:baseLayer===key?`${T.leaf}20`:"transparent", color:baseLayer===key?T.leaf:T.dim, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", outline:baseLayer===key?`1px solid ${T.leaf}40`:"none"}}>{cfg.label}</button>
            ))}
          </div>
          <div style={{background:T.labelBg, borderRadius:10, backdropFilter:"blur(10px)", border:`1px solid ${T.brd}`, padding:3, display:"flex", gap:2}}>
            <button onClick={() => setShowHeat(h=>!h)} style={{height:28, padding:"0 10px", borderRadius:7, border:"none", cursor:"pointer", background:showHeat?`${T.warn}20`:"transparent", color:showHeat?T.warn:T.dim, fontSize:10, fontWeight:700}}>🔥 Heat</button>
            <button onClick={() => setShowRelief(r=>!r)} style={{height:28, padding:"0 10px", borderRadius:7, border:"none", cursor:"pointer", background:showRelief?`${T.sky}20`:"transparent", color:showRelief?T.sky:T.dim, fontSize:10, fontWeight:700}}>⛰️ 3D</button>
          </div>
        </div>
      )}
    </div>
  );
}
