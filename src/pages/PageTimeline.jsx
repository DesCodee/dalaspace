import { useState, useEffect, useRef, useMemo } from "react";
import { Play, Pause } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { tipStyle } from "../utils/styleUtils";
import Title from "../components/atoms/Title";
import Panel from "../components/atoms/Panel";

export default function PageTimeline({ data, regions, selected, onSelect, t }) {
  const { T } = useTheme();
  const [dayIdx,  setDayIdx]  = useState(7);
  const [playing, setPlaying] = useState(false);
  const [metric,  setMetric]  = useState("temp");
  const intervalRef = useRef(null);
  const selData = data[selected?.id];
  const days = selData?.chart || [];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setDayIdx(prev => { if (prev>=days.length-1) { setPlaying(false); return 0; } return prev+1; });
      }, 800);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, days.length]);

  const daySnapshot = useMemo(() => regions.map(r => {
    const d = data[r.id]; const day = d?.chart?.[dayIdx];
    if (!day) return {...r, value:0};
    const value = metric==="temp"?(day.tMax+day.tMin)/2:metric==="rain"?day.rain:metric==="ndvi"?day.ndvi:day.balance;
    return {...r, value, day};
  }).sort((a,b)=>b.value-a.value), [data, regions, dayIdx, metric]);

  const METRICS = [{id:"temp",label:t.temp,unit:"°C",color:T.err},{id:"rain",label:t.precip,unit:"мм",color:T.sky},{id:"ndvi",label:"NDVI",unit:"",color:T.leaf},{id:"balance",label:"Вод.баланс",unit:"мм",color:T.gold}];
  const activeMetric = METRICS.find(m=>m.id===metric);
  const currentDay = days[dayIdx]||{};

  return (
    <div style={{display:"grid", gap:22}}>
      <Title>Динамика по дням</Title>
      <Panel>
        <div style={{display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
          <div style={{flex:1, minWidth:200}}>
            <div style={{fontSize:11,color:T.sub,marginBottom:6}}>{currentDay.label||"—"} · День {dayIdx+1}/{days.length}{dayIdx<7?" (прошлое)":dayIdx===7?" (сегодня)":" (прогноз)"}</div>
            <input type="range" min={0} max={Math.max(0,days.length-1)} value={dayIdx} onChange={e=>setDayIdx(+e.target.value)} style={{width:"100%",accentColor:T.leaf}}/>
          </div>
          <button onClick={() => setPlaying(!playing)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:`1px solid ${T.brd}`,background:playing?"rgba(220,38,38,0.12)":"rgba(5,150,105,0.08)",color:playing?T.err:T.leaf,cursor:"pointer",fontSize:12,fontWeight:700}}>
            {playing?<><Pause size={14}/> Пауза</>:<><Play size={14}/> Воспроизвести</>}
          </button>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {METRICS.map(m => <button key={m.id} onClick={()=>setMetric(m.id)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${metric===m.id?m.color+"44":T.brd}`,background:metric===m.id?m.color+"15":"transparent",color:metric===m.id?m.color:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>{m.label}</button>)}
          </div>
        </div>
      </Panel>

      <Panel>
        <Title>{activeMetric?.label} по регионам · {currentDay.label||"—"}</Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={daySnapshot} margin={{bottom:50}}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.brd}/>
            <XAxis dataKey="code" tick={{fontSize:9,fill:T.sub,angle:-45}} interval={0} textAnchor="end" height={60}/>
            <YAxis tick={{fontSize:10,fill:T.dim}}/>
            <Tooltip contentStyle={tipStyle(T)}/>
            <Bar dataKey="value" radius={[4,4,0,0]}>
              {daySnapshot.map((d,i) => <Cell key={i} fill={activeMetric?.color||T.leaf} fillOpacity={d.id===selected?.id?1:0.6} stroke={d.id===selected?.id?"#fff":"none"} strokeWidth={2}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
