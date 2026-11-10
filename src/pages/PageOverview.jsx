import { useState, useMemo, useCallback } from "react";
import {
  Area, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ComposedChart
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { tipStyle } from "../utils/styleUtils";
import { wxKey } from "../constants/lang";
import Stat from "../components/atoms/Stat";
import Panel from "../components/atoms/Panel";
import Title from "../components/atoms/Title";
import Badge from "../components/atoms/Badge";
import LeafletMap from "../components/LeafletMap";

export default function PageOverview({ data, regions, selected, onSelect, onAreaCapture, t }) {
  const { T, RISK_STYLE } = useTheme();
  const valid = regions.filter(r => data[r.id]?.cur);
  const n = valid.length || 1;
  const sel = data[selected?.id];
  const [drawMode, setDrawMode] = useState(false);

  const handleCapture = useCallback((areaData) => { setDrawMode(false); onAreaCapture?.(areaData); }, [onAreaCapture]);

  const stats = useMemo(() => ({
    temp:  (valid.reduce((s,r) => s+(data[r.id].cur.temperature_2m||0),0)/n).toFixed(1),
    moist: ((valid.reduce((s,r) => s+(data[r.id].cur.soil_moisture_0_to_1cm||0),0)/n)*100).toFixed(1),
    ndvi:  (valid.reduce((s,r) => s+(data[r.id].ndvi||0),0)/n).toFixed(2),
    risk:  valid.filter(r => ["critical","high"].includes(data[r.id].risk)).length,
    yield: Math.round(valid.reduce((s,r) => s+(data[r.id].yieldScore||0),0)/n),
    water: Math.round(valid.reduce((s,r) => s+(data[r.id].waterStress||0),0)/n*100),
  }), [valid, data, n]);

  const pie = useMemo(() => {
    const c = { low:0, medium:0, high:0, critical:0 };
    valid.forEach(r => { if (data[r.id].risk) c[data[r.id].risk]++; });
    return Object.entries(c).filter(([,v])=>v>0).map(([k,v]) => ({ name:RISK_STYLE[k].label, value:v, color:RISK_STYLE[k].color }));
  }, [valid, data, RISK_STYLE]);

  return (
    <div style={{display:"grid", gap:22}}>
      <div className="g-auto">
        <Stat icon="◎" title={t.avgTemp}     value={stats.temp}  unit="°C"    accent={T.err}    note={t.allRegions}/>
        <Stat icon="◇" title={t.soilMoisture} value={stats.moist} unit="%"    accent={T.sky}    note="0–1 cm"/>
        <Stat icon="◈" title={t.avgNDVI}     value={stats.ndvi}              accent={T.leaf}   note=""/>
        <Stat icon="△" title={t.riskZones}   value={stats.risk}  unit="рег." accent={T.warn}   note={`${t.high}+${t.critical}`}/>
        <Stat icon="▤" title={t.yieldIdx}    value={stats.yield} unit="/100" accent={T.ok}     note=""/>
        <Stat icon="◆" title={t.waterStress} value={stats.water} unit="%"    accent={T.gold}   note=""/>
      </div>

      {/* Map + region card — FIX: on mobile stack vertically with proper heights */}
      <div className="g-map" style={{display:"grid", gridTemplateColumns:"minmax(0,1.5fr) minmax(0,1fr)", gap:16}}>
        <Panel style={{padding:0, overflow:"hidden", minHeight:340, borderRadius:18, position:"relative"}}>
          <LeafletMap data={data} selected={selected} onSelect={drawMode?()=>{}:onSelect} layer="ndvi" height="100%" drawMode={drawMode} onAreaCapture={handleCapture}/>
          <div style={{position:"absolute", top:90, left:14, zIndex:1000}}>
            <button onClick={() => setDrawMode(!drawMode)} style={{display:"flex", alignItems:"center", gap:6, padding:"10px 14px", borderRadius:10, cursor:"pointer", border:drawMode?`1px solid rgba(124,58,237,0.4)`:`1px solid ${T.brd}`, background:drawMode?"rgba(124,58,237,0.08)":T.labelBg, color:drawMode?T.violet:T.fg, fontSize:11, fontWeight:700, backdropFilter:"blur(10px)", minHeight:40}}>
              <span style={{fontSize:13}}>{drawMode?"✕":"⬡"}</span>
              {drawMode ? t.cancel : t.drawForAI}
            </button>
          </div>
        </Panel>

        <div style={{display:"grid", gap:14, alignContent:"start"}}>
          <Panel>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10}}>
              <div>
                <div style={{fontSize:14, fontWeight:800, color:T.fg}}>{selected?.name}</div>
                <div style={{fontSize:10, color:T.dim, marginTop:2}}>{selected?.city} · {selected?.crop?.toLocaleString()} тыс.га</div>
              </div>
              {sel && <Badge level={sel.risk}/>}
            </div>
            {sel?.cur ? (
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                {[
                  ["◎","Темп",`${sel.cur.temperature_2m?.toFixed(1)}°C`],
                  ["◇","Влажн.возд",`${sel.cur.relative_humidity_2m}%`],
                  ["◈","Влажн.почвы",`${(sel.cur.soil_moisture_0_to_1cm*100).toFixed(1)}%`],
                  ["△","Темп.почвы",`${sel.cur.soil_temperature_0cm?.toFixed(1)}°C`],
                  ["▷","Ветер",`${sel.cur.wind_speed_10m?.toFixed(1)} км/ч`],
                  ["◇","Осадки 7д",`${sel.p7} мм`],
                  ["○","ET₀",`${sel.et} мм/д`],
                  ["◈","NDVI",sel.ndvi?.toFixed(2)],
                  ["▤","Урожай",`${sel.yieldScore}/100`],
                  ["◆","Вод.стресс",`${((sel.waterStress||0)*100).toFixed(0)}%`],
                ].map(([ic,label,val]) => (
                  <div key={label} style={{background:T.innerBg, borderRadius:8, padding:"7px 10px"}}>
                    <div style={{fontSize:9, color:T.dim, marginBottom:2}}>{ic}  {label}</div>
                    <div style={{fontSize:13, fontWeight:700, color:T.fg}}>{val}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{color:T.dim, fontSize:13}}>Нет данных</div>}
            {sel?.wx && (
              <div style={{marginTop:10, padding:"8px 12px", background:T.innerBg, borderRadius:10, fontSize:12, color:T.sub}}>{wxKey(sel.wx, LANG[t ? "ru" : "ru"])}</div>
            )}
          </Panel>

          <Panel>
            <Title>Распределение рисков</Title>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pie} dataKey="value" cx="42%" cy="50%" innerRadius={36} outerRadius={56} strokeWidth={0}>
                  {pie.map((e,i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Legend iconType="circle" iconSize={6} formatter={v => <span style={{color:T.sub, fontSize:11}}>{v}</span>}/>
                <Tooltip contentStyle={tipStyle(T)}/>
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>

      {sel?.chart && (
        <div className="g-charts">
          <Panel>
            <Title>Температура · {selected?.name}</Title>
            <ResponsiveContainer width="100%" height={155}>
              <ComposedChart data={sel.chart}>
                <defs><linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.err} stopOpacity={0.2}/><stop offset="100%" stopColor={T.err} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
                <XAxis dataKey="label" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit="°"/>
                <Tooltip contentStyle={tipStyle(T)}/>
                <Area type="monotone" dataKey="tMax" stroke={T.err} fill="url(#tGrad)" strokeWidth={2} name="Макс °C"/>
                <Line type="monotone" dataKey="tMin" stroke={T.sky} strokeWidth={1.5} dot={false} name="Мин °C"/>
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <Title>Осадки vs Испарение</Title>
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={sel.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
                <XAxis dataKey="label" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tipStyle(T)}/>
                <Bar dataKey="rain" fill={T.sky} radius={[3,3,0,0]} name="Осадки мм"/>
                <Bar dataKey="et0" fill="rgba(217,119,6,0.45)" radius={[3,3,0,0]} name="ET₀ мм"/>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <Title>Баланс влаги</Title>
            <ResponsiveContainer width="100%" height={155}>
              <BarChart data={sel.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
                <XAxis dataKey="label" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit=" мм"/>
                <Tooltip contentStyle={tipStyle(T)}/>
                <Bar dataKey="balance" radius={[3,3,0,0]} name={t.balance}>
                  {sel.chart.map((e,i) => <Cell key={i} fill={e.balance>=0?T.ok:T.err}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{fontSize:10, color:T.dim, marginTop:6}}><span style={{color:T.ok}}>■</span> профицит  <span style={{color:T.err}}>■</span> дефицит</div>
          </Panel>
        </div>
      )}
    </div>
  );
}
