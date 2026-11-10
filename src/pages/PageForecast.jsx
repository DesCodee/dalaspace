import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import { tipStyle } from "../utils/styleUtils";
import Stat from "../components/atoms/Stat";
import Panel from "../components/atoms/Panel";
import Title from "../components/atoms/Title";

export default function PageForecast({ data, regions, selected, onSelect, t }) {
  const { T, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const yieldData = useMemo(() =>
    regions.map(r => {
      const d = data[r.id];
      return { name:r.code, region:rn(r), id:r.id, yield:d?.yieldScore||0, ndvi:d?.ndvi||0, water:d?.waterStress||0, crop:r.crop };
    }).sort((a,b)=>b.yield-a.yield)
  , [data, regions]);

  const selData = data[selected?.id];
  const avgYield = Math.round(yieldData.reduce((s,r)=>s+r.yield,0)/yieldData.length);
  const topRegion = yieldData[0];
  const worstRegion = yieldData[yieldData.length-1];

  const forecastChart = useMemo(() => selData?.chart?.map((day,i) => ({
    ...day,
    yieldIndex: Math.round(Math.min(100, Math.max(10, day.ndvi*40 + day.waterStress*30 + (day.tMax>10&&day.tMax<35?30:10)))),
  })) || [], [selData]);

  return (
    <div style={{display:"grid", gap:22}}>
      <Title>Прогноз урожайности</Title>
      <div className="g-auto">
        <Stat icon="◎" title="Средний индекс"  value={avgYield}           unit="/100" accent={T.leaf} note={t.allRegions}/>
        <Stat icon="▲" title={t.bestRegion}    value={topRegion?.yield||0} unit="/100" accent={T.ok}   note={topRegion?.region}/>
        <Stat icon="▼" title={t.worstRegion}   value={worstRegion?.yield||0} unit="/100" accent={T.err} note={worstRegion?.region}/>
        <Stat icon="◇" title={t.waterStress}   value={selData?(selData.waterStress*100).toFixed(0):"—"} unit="%" accent={T.sky} note={selected?.name}/>
      </div>

      <Panel>
        <Title>Рейтинг регионов по прогнозу урожайности</Title>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={yieldData} layout="vertical" margin={{left:40,right:20}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.brd}/>
            <XAxis type="number" domain={[0,100]} tick={{fontSize:10,fill:T.dim}}/>
            <YAxis dataKey="name" type="category" width={40} tick={{fontSize:10,fill:T.sub}}/>
            <Tooltip contentStyle={tipStyle(T)}/>
            <Bar dataKey="yield" radius={[0,4,4,0]} onClick={d => { const r=regions.find(x=>x.id===d.id); if(r) onSelect(r); }}>
              {yieldData.map((d,i) => <Cell key={i} fill={d.yield>70?T.ok:d.yield>45?T.warn:T.err} fillOpacity={d.id===selected?.id?1:0.7} stroke={d.id===selected?.id?"#fff":"none"} strokeWidth={2}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="g-charts">
        <Panel>
          <Title>Динамика индекса: {selected?.name}</Title>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={forecastChart}>
              <defs><linearGradient id="yGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.leaf} stopOpacity={0.3}/><stop offset="100%" stopColor={T.leaf} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.brd}/>
              <XAxis dataKey="label" tick={{fontSize:9,fill:T.dim}}/> <YAxis domain={[0,100]} tick={{fontSize:10,fill:T.dim}}/>
              <Tooltip contentStyle={tipStyle(T)}/>
              <Area type="monotone" dataKey="yieldIndex" stroke={T.leaf} fill="url(#yGrad)" name="Индекс"/>
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <Title>Рекомендуемые культуры: {selected?.name}</Title>
          {selData?.crops?.length ? selData.crops.map((c,i) => (
            <div key={i} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, marginBottom:6, background:`rgba(${c.score>75?"52,211,153":c.score>60?"232,185,49":"240,115,110"},0.06)`, border:`1px solid rgba(${c.score>75?"52,211,153":c.score>60?"232,185,49":"240,115,110"},0.15)`}}>
              <span style={{fontSize:22}}>{c.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:700, color:T.fg}}>{t[c.key]||c.key}</div>
                <div style={{fontSize:11, color:T.sub}}>{t.suitability}: {c.score}%</div>
              </div>
              <div style={{width:40,height:40,borderRadius:"50%",background:`conic-gradient(${c.score>75?T.ok:c.score>60?T.warn:T.err} ${c.score*3.6}deg,${T.card} 0deg)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:T.fg}}>{c.score}</div>
              </div>
            </div>
          )) : <div style={{color:T.dim,fontSize:12}}>Нет данных</div>}
        </Panel>
      </div>
    </div>
  );
}
