import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import { moistColor, tipStyle } from "../utils/styleUtils";
import Stat from "../components/atoms/Stat";
import Panel from "../components/atoms/Panel";
import Title from "../components/atoms/Title";
import MoistureBar from "../components/atoms/MoistureBar";

export default function PageWater({ data, regions, t }) {
  const { T, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const valid = regions.filter(r => data[r.id]?.cur);
  const n = valid.length || 1;
  const sorted = useMemo(() => valid.map(r=>({...r,d:data[r.id]})).sort((a,b)=>(b.d.cur.soil_moisture_0_to_1cm||0)-(a.d.cur.soil_moisture_0_to_1cm||0)), [valid, data]);

  return (
    <div style={{display:"grid", gap:20}}>
      <div className="g-auto">
        <Stat icon="◇" title={t.avgSoilMoist}   value={(valid.reduce((s,r)=>s+(data[r.id].cur.soil_moisture_0_to_1cm||0),0)/n*100).toFixed(1)} unit="%" accent={T.sky}    note="0–1 cm"/>
        <Stat icon="◈" title={t.avgPrecip7}      value={(valid.reduce((s,r)=>s+(data[r.id].p7||0),0)/n).toFixed(1)} unit="мм"  accent={T.leaf}   note={t.allRegions}/>
        <Stat icon="○" title={t.avgET}           value={(valid.reduce((s,r)=>s+(data[r.id].et||0),0)/n).toFixed(1)} unit="мм/д" accent={T.gold}   note="FAO-56"/>
        <Stat icon="◎" title={t.avgSoilTemp}     value={(valid.reduce((s,r)=>s+(data[r.id].cur.soil_temperature_0cm||0),0)/n).toFixed(1)} unit="°C"  accent={T.ok}/>
        <Stat icon="◆" title={t.avgWaterStress}  value={Math.round(valid.reduce((s,r)=>s+(data[r.id].waterStress||0),0)/n*100)} unit="%" accent={T.gold}  note={t.precipWeek}/>
      </div>

      <Panel>
        <Title>Влажность почвы по регионам</Title>
        <div style={{fontSize:11, color:T.dim, marginBottom:16}}>
          <span style={{color:T.sky}}>■</span> хорошо (&gt;30%)  ·  <span style={{color:T.warn}}>■</span> умеренно  ·  <span style={{color:T.err}}>■</span> сухо (&lt;10%)
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:"10px 28px"}}>
          {sorted.map(r => (
            <div key={r.id}>
              <div style={{display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12}}>
                <span style={{color:T.sub}}>{rn(r)}</span>
                <span style={{color:moistColor(r.d.cur.soil_moisture_0_to_1cm, T), fontWeight:700}}>{r.d.cur.soil_moisture_0_to_1cm?.toFixed(3)} м³/м³</span>
              </div>
              <MoistureBar value={r.d.cur.soil_moisture_0_to_1cm}/>
            </div>
          ))}
        </div>
      </Panel>

      <div className="g-charts">
        <Panel>
          <Title>Осадки за 7 дней</Title>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted.map(r=>({name:r.code, rain:r.d.p7}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
              <XAxis dataKey="name" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit=" мм"/>
              <Tooltip contentStyle={tipStyle(T)}/>
              <Bar dataKey="rain" radius={[4,4,0,0]} name="Осадки мм">
                {sorted.map((r,i) => <Cell key={i} fill={moistColor(r.d.cur.soil_moisture_0_to_1cm, T)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <Title>Испарение ET₀</Title>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sorted.map(r=>({name:r.code, et0:r.d.et}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
              <XAxis dataKey="name" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit=" мм"/>
              <Tooltip contentStyle={tipStyle(T)}/>
              <Bar dataKey="et0" radius={[4,4,0,0]} name="ET₀ мм/д">
                {sorted.map((r,i) => <Cell key={i} fill={r.d.et>5?T.err:r.d.et>3?T.warn:T.ok}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
