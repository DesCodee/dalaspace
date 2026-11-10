import { useMemo } from "react";
import {
  Area, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart
} from "recharts";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import { tipStyle } from "../utils/styleUtils";
import Stat from "../components/atoms/Stat";
import Panel from "../components/atoms/Panel";
import Title from "../components/atoms/Title";
import Badge from "../components/atoms/Badge";

export default function PageDrought({ data, regions, selected, onSelect, t }) {
  const { T, RISK_STYLE, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const valid  = regions.filter(r => data[r.id]?.cur);
  const sel    = data[selected?.id];
  const sorted = useMemo(() => {
    const ord = {critical:0,high:1,medium:2,low:3};
    return valid.map(r=>({...r,d:data[r.id]})).sort((a,b)=>(ord[a.d.risk]||2)-(ord[b.d.risk]||2));
  }, [valid, data]);

  const stats = useMemo(() => ({
    maxT:  Math.max(...valid.map(r=>data[r.id].cur.temperature_2m||0)).toFixed(1),
    minM:  (Math.min(...valid.map(r=>data[r.id].cur.soil_moisture_0_to_1cm||1))*100).toFixed(1),
    maxET: Math.max(...valid.map(r=>data[r.id].et||0)).toFixed(1),
    crit:  valid.filter(r=>data[r.id].risk==="critical").length,
  }), [valid, data]);

  return (
    <div style={{display:"grid", gap:20}}>
      <div className="g-auto">
        <Stat icon="△" title={t.maxTemp}    value={stats.maxT} unit="°C"   accent={T.err}  note={t.allRegions}/>
        <Stat icon="◇" title="Мин.влажн."  value={stats.minM} unit="%"    accent={T.gold} note="самый сухой"/>
        <Stat icon="○" title={t.maxET}      value={stats.maxET}unit="мм/д" accent={T.violet} note="FAO"/>
        <Stat icon="◉" title="Критических" value={stats.crit}             accent={T.crit} note="зон засухи"/>
      </div>

      <div className="g-charts">
        <Panel>
          <Title>Рейтинг по риску засухи</Title>
          <div style={{display:"grid", gap:6, maxHeight:380, overflow:"auto"}}>
            {sorted.map((r,i) => (
              <div key={r.id} onClick={() => onSelect(r)} style={{display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:10, cursor:"pointer", background:selected?.id===r.id?T.hover:"rgba(0,60,40,0.02)", border:`1px solid ${RISK_STYLE[r.d.risk].brd}`, transition:"all 0.15s"}}>
                <span style={{fontSize:11, color:T.dim, minWidth:22, fontWeight:700}}>#{i+1}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12, fontWeight:700, color:T.fg}}>{rn(r)}</div>
                  <div style={{fontSize:10, color:T.dim}}>{r.d.cur.temperature_2m?.toFixed(1)}°C · {(r.d.cur.soil_moisture_0_to_1cm*100).toFixed(0)}% · {r.d.p7}мм</div>
                </div>
                <Badge level={r.d.risk}/>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <Title>Дефицит влаги — Осадки vs Испарение</Title>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart layout="vertical" data={sorted.slice(0,12).map(r=>({name:r.code, precip:r.d.p7, deficit:+Math.max(0,r.d.et*7-r.d.p7).toFixed(1)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
              <XAxis type="number" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit=" мм"/>
              <YAxis dataKey="name" type="category" tick={{fill:T.sub,fontSize:10}} axisLine={false} tickLine={false} width={36}/>
              <Tooltip contentStyle={tipStyle(T)}/>
              <Bar dataKey="precip" fill={T.sky} radius={[0,3,3,0]} name="Осадки мм" stackId="a"/>
              <Bar dataKey="deficit" fill="rgba(220,38,38,0.5)" radius={[0,3,3,0]} name="Дефицит мм" stackId="b"/>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {sel?.chart && (
        <div className="g-charts">
          <Panel>
            <Title>Температура · {selected?.name}</Title>
            <ResponsiveContainer width="100%" height={165}>
              <ComposedChart data={sel.chart}>
                <defs><linearGradient id="drT" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.err} stopOpacity={0.2}/><stop offset="100%" stopColor={T.err} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridLine}/>
                <XAxis dataKey="label" tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:T.dim,fontSize:9}} axisLine={false} tickLine={false} unit="°"/>
                <Tooltip contentStyle={tipStyle(T)}/>
                <Area type="monotone" dataKey="tMax" stroke={T.err} fill="url(#drT)" strokeWidth={2} name="Макс °C"/>
                <Line type="monotone" dataKey="tMin" stroke={T.sky} strokeWidth={1.5} dot={false} name="Мин °C"/>
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
          <Panel>
            <Title>Баланс влаги · {selected?.name}</Title>
            <ResponsiveContainer width="100%" height={165}>
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
          </Panel>
        </div>
      )}
    </div>
  );
}
