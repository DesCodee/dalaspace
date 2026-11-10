import { useState } from "react";
import { FileDown } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { DATE_LOCALE } from "../constants/theme";

export default function ExportButton({ data, regions, selected, t }) {
  const { T, RISK_STYLE, lang } = useTheme();
  const [exporting, setExporting] = useState(false);
  const exportReport = async () => {
    setExporting(true);
    try {
      const selR=selected||regions[0]; const d=data[selR.id];
      if (!d) { setExporting(false); return; }
      const lines=[
        "DALASPACE — ОТЧЁТ ПО РЕГИОНУ","═══════════════════════════════",
        `Регион: ${selR.name} (${selR.code})`,`Центр: ${selR.city}`,
        `Площадь пашни: ${selR.crop.toLocaleString()} тыс. га`,
        `Дата: ${new Date().toLocaleDateString(DATE_LOCALE[lang] || DATE_LOCALE.ru)}`,
        "","ТЕКУЩИЕ ПОКАЗАТЕЛИ:",
        `  Температура: ${d.cur?.temperature_2m?.toFixed(1)}°C`,
        `  Влажность почвы: ${(d.cur?.soil_moisture_0_to_1cm*100).toFixed(1)}%`,
        `  NDVI: ${d.ndvi?.toFixed(3)}`,
        `  Осадки 7 дней: ${d.p7} мм`,
        `  ET₀: ${d.et} мм/день`,
        `  Водный стресс: ${(d.waterStress*100).toFixed(0)}%`,
        `  Индекс урожайности: ${d.yieldScore}/100`,
        `  Риск засухи: ${RISK_STYLE[d.risk]?.label||d.risk}`,
        "","Сгенерировано: DalaSpace","Источник: Open-Meteo API, Esri World Imagery",
      ];
      const blob=new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url;
      a.download=`DalaSpace_${selR.code}_${new Date().toISOString().slice(0,10)}.txt`;
      a.click(); URL.revokeObjectURL(url);
    } catch(e) { console.error(e); }
    setExporting(false);
  };
  return (
    <button onClick={exportReport} disabled={exporting} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:`1px solid ${T.brd}`,background:T.innerBg,color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",opacity:exporting?.5:1}}>
      <FileDown size={14}/> {exporting?t.exporting:t.export}
    </button>
  );
}
