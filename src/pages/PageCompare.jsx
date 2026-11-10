import { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import Title from "../components/atoms/Title";
import Panel from "../components/atoms/Panel";
import Badge from "../components/atoms/Badge";

export default function PageCompare({ data, regions, t }) {
  const { T } = useTheme();
  const [sel, setSel] = useState([regions[0]?.id, regions[4]?.id, regions[8]?.id]);
  const toggleRegion = id => setSel(prev => prev.includes(id)?prev.filter(x=>x!==id):prev.length>=4?[...prev.slice(1),id]:[...prev,id]);
  const COLORS = [T.leaf, T.sky, T.gold, T.violet];

  const compareData = useMemo(() => sel.map(id => {
    const r = regions.find(x=>x.id===id); const d = data[id];
    return r&&d ? {...r,...d} : null;
  }).filter(Boolean), [sel, data, regions]);

  const metrics = [
    {key:"ndvi",label:"NDVI",fmt:v=>v?.toFixed(2)},
    {key:"temp",label:t.temp,fmt:v=>v?.toFixed(1)+"°C",get:d=>d.cur?.temperature_2m},
    {key:"moist",label:"Влажность почвы",fmt:v=>(v*100).toFixed(1)+"%",get:d=>d.cur?.soil_moisture_0_to_1cm},
    {key:"p7",label:"Осадки 7д",fmt:v=>v+" мм"},
    {key:"et",label:"ET₀",fmt:v=>v+" мм/д"},
    {key:"waterStress",label:"Водный стресс",fmt:v=>(v*100).toFixed(0)+"%"},
    {key:"yieldScore",label:"Индекс урожайности",fmt:v=>v+"/100"},
  ];

  return (
    <div style={{display:"grid", gap:22}}>
      <Title>Сравнение регионов</Title>
      <Panel>
        <div style={{fontSize:12,fontWeight:700,color:T.sub,marginBottom:10}}>Выберите до 4 регионов:</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {regions.map(r => (
            <button key={r.id} onClick={() => toggleRegion(r.id)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${sel.includes(r.id)?T.leaf:T.brd}`,background:sel.includes(r.id)?"rgba(5,150,105,0.1)":"transparent",color:sel.includes(r.id)?T.leaf:T.sub,fontSize:11,fontWeight:600,cursor:"pointer"}}>{r.code}</button>
          ))}
        </div>
      </Panel>

      {compareData.length>0 && (
        <Panel style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.brd}`}}>
                <th style={{textAlign:"left",padding:"10px 12px",color:T.sub,fontWeight:600}}>{t.metricCol}</th>
                {compareData.map((d,i) => <th key={d.id} style={{textAlign:"center",padding:"10px 12px",fontWeight:700,color:COLORS[i]}}>{d.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m,mi) => {
                const vals = compareData.map(d=>m.get?m.get(d):d[m.key]);
                const maxVal = Math.max(...vals.filter(v=>v!=null));
                return (
                  <tr key={m.key} style={{borderBottom:`1px solid ${T.brd}`}}>
                    <td style={{padding:"10px 12px",color:T.sub,fontWeight:600}}>{m.label}</td>
                    {compareData.map((d,i) => {
                      const v=vals[i]; const isBest=v===maxVal&&v!=null;
                      return <td key={d.id} style={{textAlign:"center",padding:"10px 12px",fontWeight:isBest?800:500,color:isBest?COLORS[i]:T.fg,background:isBest?`${COLORS[i]}10`:"transparent"}}>{v!=null?m.fmt(v):"—"}{isBest&&<span style={{fontSize:9,marginLeft:4}}>★</span>}</td>;
                    })}
                  </tr>
                );
              })}
              <tr style={{borderBottom:`1px solid ${T.brd}`}}>
                <td style={{padding:"10px 12px",color:T.sub,fontWeight:600}}>Риск</td>
                {compareData.map((d,i) => <td key={d.id} style={{textAlign:"center",padding:"10px 12px"}}><Badge level={d.risk}/></td>)}
              </tr>
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
