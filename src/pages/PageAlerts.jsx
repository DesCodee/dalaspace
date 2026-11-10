import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { RNAME } from "../constants/regions";
import Stat from "../components/atoms/Stat";
import Panel from "../components/atoms/Panel";
import Title from "../components/atoms/Title";
import Badge from "../components/atoms/Badge";

export default function PageAlerts({ data, regions, t }) {
  const { T, RISK_STYLE, lang } = useTheme();
  const rn = (r) => RNAME[r.id]?.[lang] || r.name;
  const alerts = useMemo(() => {
    const list = [];
    regions.forEach(r => {
      const d = data[r.id]; if (!d?.cur) return;
      const c = d.cur;
      if (d.risk==="critical")                list.push({id:`dr-${r.id}`,  region:rn(r), sev:"critical", title:t.critDrought, msg:`Влажность ${(c.soil_moisture_0_to_1cm*100).toFixed(1)}%, темп. ${c.temperature_2m?.toFixed(1)}°C`});
      if (c.soil_moisture_0_to_1cm<0.08)     list.push({id:`sm-${r.id}`,  region:rn(r), sev:"critical", title:t.extDry,      msg:`Влажность ${(c.soil_moisture_0_to_1cm*100).toFixed(2)}% — ниже порога`});
      if (c.temperature_2m>37)               list.push({id:`ht-${r.id}`,  region:rn(r), sev:"high",     title:t.heatWave,    msg:`${c.temperature_2m?.toFixed(1)}°C — угроза посевам`});
      if (d.risk==="high")                   list.push({id:`drh-${r.id}`, region:rn(r), sev:"high",     title:t.droughtRisk, msg:`Осадки 7д: ${d.p7} мм, ET₀: ${d.et} мм/день`});
      if (d.et>6)                            list.push({id:`et-${r.id}`,  region:rn(r), sev:"medium",   title:t.highEvap,    msg:`ET₀: ${d.et} мм/день`});
    });
    const ord = {critical:0,high:1,medium:2};
    return list.sort((a,b)=>(ord[a.sev]||2)-(ord[b.sev]||2));
  }, [data, regions, t]);

  const cnt = { c:alerts.filter(a=>a.sev==="critical").length, h:alerts.filter(a=>a.sev==="high").length, m:alerts.filter(a=>a.sev==="medium").length };

  return (
    <div style={{display:"grid", gap:20}}>
      <div className="g-auto">
        <Stat icon="◉" title="Критических" value={cnt.c} accent={T.crit}/>
        <Stat icon="▲" title="Высоких"     value={cnt.h} accent={T.err}/>
        <Stat icon="◆" title="Средних"     value={cnt.m} accent={T.gold}/>
        <Stat icon="▤" title="Всего"       value={alerts.length} unit="событий" accent={T.sub}/>
      </div>
      <Panel>
        <Title>Активные оповещения · Open-Meteo</Title>
        {alerts.length===0 ? (
          <div style={{textAlign:"center", padding:48, color:T.ok, fontSize:15, fontWeight:600}}>✦ Все показатели в норме</div>
        ) : (
          <div style={{display:"grid", gap:8}}>
            {alerts.map(a => (
              <div key={a.id} style={{display:"flex", gap:12, padding:"13px 16px", borderRadius:12, background:RISK_STYLE[a.sev]?.bg||T.card, border:`1px solid ${RISK_STYLE[a.sev]?.brd||T.brd}`}}>
                <span style={{fontSize:14, color:RISK_STYLE[a.sev]?.color, flexShrink:0, marginTop:1}}>{RISK_STYLE[a.sev]?.icon}</span>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3, flexWrap:"wrap", gap:6}}>
                    <span style={{fontSize:13, fontWeight:700, color:T.fg}}>{a.region} — {a.title}</span>
                    <Badge level={a.sev}/>
                  </div>
                  <p style={{fontSize:12, color:T.sub, margin:0, lineHeight:1.5}}>{a.msg}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
