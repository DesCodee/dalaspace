import { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import { ndviColor } from "../utils/styleUtils";
import { wxKey, LANG } from "../constants/lang";
import Panel from "../components/atoms/Panel";
import Badge from "../components/atoms/Badge";
import MoistureBar from "../components/atoms/MoistureBar";

export default function PageRegions({ data, regions, onSelect, navigate, t }) {
  const { T, RISK_STYLE, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const [sort,   setSort]   = useState("name");
  const [filter, setFilter] = useState("all");
  const [query,  setQuery]  = useState("");

  const rows = useMemo(() => {
    let list = regions.map(r => ({...r, d:data[r.id]})).filter(r => r.d?.cur);
    if (filter!=="all") list = list.filter(r => r.d.risk===filter);
    if (query) list = list.filter(r => rn(r).toLowerCase().includes(query.toLowerCase()) || r.name.toLowerCase().includes(query.toLowerCase()));
    const ord = {critical:0,high:1,medium:2,low:3};
    return list.sort((a,b) => {
      if (sort==="name")  return a.name.localeCompare(b.name);
      if (sort==="temp")  return (b.d.cur.temperature_2m||0)-(a.d.cur.temperature_2m||0);
      if (sort==="moist") return (b.d.cur.soil_moisture_0_to_1cm||0)-(a.d.cur.soil_moisture_0_to_1cm||0);
      if (sort==="ndvi")  return (b.d.ndvi||0)-(a.d.ndvi||0);
      if (sort==="yield") return (b.d.yieldScore||0)-(a.d.yieldScore||0);
      if (sort==="risk")  return (ord[a.d.risk]||2)-(ord[b.d.risk]||2);
      return 0;
    });
  }, [regions, data, sort, filter, query]);

  return (
    <div style={{display:"grid", gap:20}}>
      <div style={{display:"flex", gap:10, flexWrap:"wrap", alignItems:"center"}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} style={{padding:"8px 14px", borderRadius:10, border:`1px solid ${T.brd}`, background:T.innerBg, color:T.fg, fontSize:13, outline:"none", width:170}}/>
        <div style={{display:"flex", gap:2, background:"rgba(0,60,40,0.025)", borderRadius:10, padding:3}}>
          {["all","critical","high","medium","low"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{padding:"4px 11px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontWeight:600, background:filter===f?(T.isDark?"rgba(255,255,255,0.06)":"rgba(0,60,40,0.06)"):"transparent", color:f==="all"?(filter===f?T.fg:T.dim):(filter===f?RISK_STYLE[f]?.color:T.dim)}}>
              {f==="all"?"Все":RISK_STYLE[f]?.label}
            </button>
          ))}
        </div>
        <span style={{fontSize:12, color:T.dim, marginLeft:"auto"}}>{rows.length}/{regions.length}</span>
      </div>

      <Panel style={{padding:0, overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.brd}`}}>
                {[["name",t.regionCol],["temp",t.tempCol],["moist",t.humidity],[null,"Возд."],[null,"Ветер"],[null,"Осадки 7д"],[null,"ET₀"],["ndvi","NDVI"],["yield",t.yieldLabel],[null,"Вод.стресс"],["risk","Риск"],[null,"Погода"]].map(([key,label]) => (
                  <th key={label} onClick={() => key&&setSort(key)} style={{padding:"12px 13px", textAlign:"left", whiteSpace:"nowrap", color:key&&sort===key?T.sky:T.dim, fontWeight:700, fontSize:11, cursor:key?"pointer":"default", background:"rgba(0,60,40,0.02)"}}>
                    {label}{key&&sort===key?" ↓":""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const d = r.d;
                return (
                  <tr key={r.id} onClick={() => {onSelect(r);navigate("overview");}} style={{cursor:"pointer", borderBottom:`1px solid ${T.innerBg}`, transition:"background 0.12s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"11px 13px"}}><div style={{fontWeight:700,color:T.fg}}>{rn(r)}</div><div style={{fontSize:10,color:T.dim}}>{r.city}</div></td>
                    <td style={{padding:"11px 13px",fontWeight:700,color:d.cur.temperature_2m>35?T.err:d.cur.temperature_2m<0?T.sky:T.fg}}>{d.cur.temperature_2m?.toFixed(1)}°C</td>
                    <td style={{padding:"11px 13px",minWidth:130}}><MoistureBar value={d.cur.soil_moisture_0_to_1cm}/></td>
                    <td style={{padding:"11px 13px",color:T.sub}}>{d.cur.relative_humidity_2m}%</td>
                    <td style={{padding:"11px 13px",color:T.sub}}>{d.cur.wind_speed_10m?.toFixed(1)} км/ч</td>
                    <td style={{padding:"11px 13px",color:T.leaf,fontWeight:600}}>{d.p7} мм</td>
                    <td style={{padding:"11px 13px",color:T.gold}}>{d.et} мм/д</td>
                    <td style={{padding:"11px 13px"}}><span style={{fontWeight:800,color:ndviColor(d.ndvi, T),fontSize:14}}>{d.ndvi?.toFixed(2)}</span></td>
                    <td style={{padding:"11px 13px"}}><span style={{fontWeight:700,fontSize:12,color:d.yieldScore>70?T.ok:d.yieldScore>45?T.warn:T.err}}>{d.yieldScore||"—"}</span></td>
                    <td style={{padding:"11px 13px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:40,height:5,borderRadius:3,background:T.brd,overflow:"hidden"}}><div style={{width:`${(d.waterStress||0)*100}%`,height:"100%",borderRadius:3,background:d.waterStress>0.7?T.ok:d.waterStress>0.4?T.warn:T.err}}/></div>
                        <span style={{fontSize:10,color:T.sub}}>{((d.waterStress||0)*100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{padding:"11px 13px"}}><Badge level={d.risk}/></td>
                    <td style={{padding:"11px 13px",color:T.sub,fontSize:11}}>{wxKey(d.wx,LANG[lang] || LANG.ru)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
