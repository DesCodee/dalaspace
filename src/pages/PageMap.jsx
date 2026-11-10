import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import { moistColor, ndviColor } from "../utils/styleUtils";
import Panel from "../components/atoms/Panel";
import Badge from "../components/atoms/Badge";
import LeafletMap from "../components/LeafletMap";

export default function PageMap({ data, regions, selected, onSelect, t }) {
  const { T, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const [layer, setLayer] = useState("ndvi");
  const layers = [{key:"ndvi",label:"NDVI"},{key:"moisture",label:t.humidity},{key:"temp",label:t.temp},{key:"risk",label:t.droughtRisk}];

  return (
    /* FIX: use className map-page-wrap for mobile override; sidebar hidden on mobile */
    <div className="map-page-wrap" style={{display:"grid", gridTemplateColumns:"minmax(0,1fr) 270px", gap:16, height:"calc(100dvh - 140px)", minHeight:320}}>
      <Panel style={{padding:0, overflow:"hidden", display:"flex", flexDirection:"column", borderRadius:18}}>
        <div style={{padding:"10px 14px", borderBottom:`1px solid ${T.brd}`, display:"flex", gap:6, flexWrap:"wrap"}}>
          {layers.map(l => (
            <button key={l.key} onClick={() => setLayer(l.key)} style={{padding:"5px 14px", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:600, border:layer===l.key?`1px solid ${T.brdAct}`:"1px solid transparent", background:layer===l.key?"rgba(5,150,105,0.1)":T.hover, color:layer===l.key?T.leaf:T.sub}}>{l.label}</button>
          ))}
        </div>
        <div style={{flex:1, minHeight:0}}>
          <LeafletMap data={data} selected={selected} onSelect={onSelect} layer={layer} height="100%"/>
        </div>
      </Panel>

      <Panel className="map-sidebar" style={{padding:0, overflow:"hidden", display:"flex", flexDirection:"column"}}>
        <div style={{padding:"12px 14px", borderBottom:`1px solid ${T.brd}`, fontSize:13, fontWeight:700, color:T.fg}}>{t.regions}</div>
        <div style={{flex:1, overflow:"auto", padding:8}}>
          {regions.map(r => {
            const d = data[r.id];
            const isSel = selected?.id===r.id;
            return (
              <div key={r.id} onClick={() => onSelect(r)} style={{padding:"10px 12px", borderRadius:11, marginBottom:4, cursor:"pointer", background:isSel?"rgba(5,150,105,0.06)":"rgba(0,60,40,0.02)", border:`1px solid ${isSel?T.brdAct:T.brd}`, transition:"all 0.15s"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:d?4:0}}>
                  <span style={{fontSize:12, fontWeight:700, color:isSel?T.leaf:T.fg}}>{rn(r)}</span>
                  {d && <Badge level={d.risk}/>}
                </div>
                {d?.cur && (
                  <div style={{display:"flex", gap:10, fontSize:10, color:T.dim}}>
                    <span>{d.cur.temperature_2m?.toFixed(1)}°C</span>
                    <span style={{color:moistColor(d.cur.soil_moisture_0_to_1cm, T)}}>{(d.cur.soil_moisture_0_to_1cm*100).toFixed(0)}%</span>
                    <span style={{color:ndviColor(d.ndvi, T)}}>NDVI {d.ndvi?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
