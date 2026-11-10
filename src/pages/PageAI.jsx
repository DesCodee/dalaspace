import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { DATE_LOCALE } from "../constants/theme";
import { ndviColor } from "../utils/styleUtils";
import { formatHa } from "../utils/mapUtils";
import { analyzeFieldImage } from "../utils/aiService";
import Title from "../components/atoms/Title";
import Panel from "../components/atoms/Panel";
import Badge from "../components/atoms/Badge";

export default function PageAI({ initialImage, onConsumeImage, t, lang }) {
  const { T, RISK_STYLE } = useTheme();
  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef    = useRef(null);
  const autoRunRef  = useRef(false);
  const boundsRef   = useRef(null);
  const hectaresRef = useRef(null);

  useEffect(() => {
    if (initialImage && !autoRunRef.current) {
      if (initialImage.preview?.startsWith("data:image") && initialImage.preview.length > 200) {
        setPreview(initialImage.preview);
        setFile({ name: initialImage.name, type: "image/jpeg" });
        boundsRef.current   = initialImage.bounds;
        hectaresRef.current = initialImage.hectares || null;
        setResult(null); setError(null);
        autoRunRef.current = true;
      } else {
        setError("Снимок повреждён, попробуйте выделить заново");
      }
      onConsumeImage?.();
    }
  }, [initialImage, onConsumeImage]);

  useEffect(() => {
    if (autoRunRef.current && preview && !loading && !result) {
      autoRunRef.current = false;
      const timer = setTimeout(() => doAnalyze(), 500);
      return () => clearTimeout(timer);
    }
  }, [preview]);

  const pickFile = f => {
    if (!f?.type.startsWith("image/")) { setError("Нужно изображение: JPG, PNG, WEBP"); return; }
    setFile(f); setResult(null); setError(null); boundsRef.current = null; hectaresRef.current = null;
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const doAnalyze = async () => {
    if (!preview) return;
    setLoading(true); setError(null); setResult(null);
    try {
      if (!preview.startsWith("data:image")) throw new Error("Некорректное изображение");
      const [meta, b64] = preview.split(",");
      if (!b64 || b64.length < 100) throw new Error("Изображение слишком маленькое");
      const mimeType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";

      const bounds = boundsRef.current;
      const ha = hectaresRef.current;
      const coordInfo = bounds
        ? `\nКоординаты: ЮЗ ${bounds.sw.lat.toFixed(3)}°N, ${bounds.sw.lng.toFixed(3)}°E, СВ ${bounds.ne.lat.toFixed(3)}°N, ${bounds.ne.lng.toFixed(3)}°E (Казахстан).${ha ? ` Площадь: ~${Math.round(ha)} га.` : ""} Спутниковый снимок Esri.`
        : "";

      const parsed = await analyzeFieldImage({ b64, mimeType, coordInfo, lang, bounds, hectares: ha });

      setResult(parsed);
      setHistory(h => [{
        id: Date.now(), preview, result: parsed,
        name: file?.name || "satellite.jpg",
        date: new Date().toLocaleString(DATE_LOCALE[lang] || DATE_LOCALE.ru),
        hectares: ha,
      }, ...h].slice(0, 8));
    } catch (e) {
      console.error("Ошибка анализа:", e.message);
      setError("Не удалось выполнить анализ: " + e.message);
    }
    setLoading(false);
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setError(null); boundsRef.current = null; hectaresRef.current = null; };

  return (
    <div style={{display:"grid", gap:20}}>
      <div className="ai-main" style={{display:"grid", gridTemplateColumns:result?"minmax(0,340px) minmax(0,1fr)":"minmax(0,420px) minmax(0,1fr)", gap:18}}>
        <div style={{display:"grid", gap:14, alignContent:"start"}}>
          <Panel>
            <Title>ИИ-анализ земельного участка</Title>
            {!preview ? (
              <div
                onDrop={e=>{e.preventDefault();setDragging(false);if(e.dataTransfer?.files?.[0])pickFile(e.dataTransfer.files[0]);}}
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onClick={()=>inputRef.current?.click()}
                style={{border:`2px dashed ${dragging?T.violet:T.brd}`,borderRadius:14,padding:"48px 20px",minHeight:180,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:12,background:dragging?"rgba(124,58,237,0.04)":"rgba(0,60,40,0.02)"}}>
                <div style={{width:56,height:56,borderRadius:16,background:"rgba(124,58,237,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>⬡</div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.fg}}>Загрузите фото участка</div>
                  <div style={{fontSize:12,color:T.dim,marginTop:3}}>JPG · PNG · WEBP</div>
                </div>
                <input ref={inputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&pickFile(e.target.files[0])}/>
              </div>
            ) : (
              <div>
                <div style={{position:"relative",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                  <img src={preview} alt="" style={{width:"100%",maxHeight:210,objectFit:"cover",display:"block"}}/>
                  <button onClick={reset} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
                <div style={{fontSize:11,color:T.dim,marginBottom:10}}>
                  {file?.name}{hectaresRef.current&&<span style={{marginLeft:8,color:T.gold,fontWeight:700}}>· {formatHa(hectaresRef.current)}</span>}
                </div>
                <button onClick={doAnalyze} disabled={loading} style={{width:"100%",padding:14,borderRadius:12,border:"none",cursor:loading?"wait":"pointer",background:loading?"rgba(124,58,237,0.15)":`linear-gradient(135deg,${T.violet},#8b5cf6)`,color:"#fff",fontSize:14,fontWeight:700,opacity:loading?.75:1}}>
                  {loading?"Анализирую…":"Запустить анализ"}
                </button>
                {error&&<div style={{marginTop:10,padding:"10px 14px",borderRadius:10,background:"rgba(220,38,38,0.06)",border:`1px solid rgba(220,38,38,0.2)`,color:T.err,fontSize:12}}>{error}</div>}
              </div>
            )}
          </Panel>
        </div>

        {result ? (
          <div style={{display:"grid", gap:14, alignContent:"start"}}>
            <div className="ai-verdict" style={{background:T.card,border:`1px solid ${RISK_STYLE[result.erosion_risk]?.brd||T.brd}`,borderRadius:18,padding:"18px 22px",display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"center"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:13,fontWeight:800,color:T.fg,textTransform:"uppercase",letterSpacing:0.5}}>{result.land_type}</span>
                  <Badge level={result.erosion_risk}/>
                  {result.irrigation_needed&&<span style={{fontSize:11,fontWeight:700,color:T.sky,background:"rgba(8,145,178,0.1)",border:"1px solid rgba(8,145,178,0.2)",padding:"2px 10px",borderRadius:20}}>◇ Нужен полив</span>}
                  {hectaresRef.current&&<span style={{fontSize:11,fontWeight:800,color:T.gold,background:"rgba(217,119,6,0.1)",border:"1px solid rgba(217,119,6,0.22)",padding:"2px 10px",borderRadius:20}}>▤ {formatHa(hectaresRef.current)}</span>}
                </div>
                <p style={{fontSize:13,color:T.sub,lineHeight:1.6,margin:0}}>{result.summary}</p>
              </div>
              <div style={{textAlign:"center",minWidth:80}}>
                <div style={{position:"relative",width:72,height:72,margin:"0 auto"}}>
                  <svg viewBox="0 0 72 72" style={{width:72,height:72,transform:"rotate(-90deg)"}}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke={T.isDark?"rgba(255,255,255,0.06)":"rgba(0,60,40,0.06)"} strokeWidth="5"/>
                    <circle cx="36" cy="36" r="30" fill="none" stroke={result.usability_score>70?T.ok:result.usability_score>40?T.warn:T.err} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(result.usability_score/100)*188.5} 188.5`}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                    <span style={{fontSize:20,fontWeight:900,color:T.fg,lineHeight:1}}>{result.usability_score}</span>
                    <span style={{fontSize:8,color:T.dim,fontWeight:600}}>из 100</span>
                  </div>
                </div>
                <div style={{fontSize:10,color:T.dim,marginTop:4,fontWeight:600}}>Пригодность</div>
              </div>
            </div>

            <div className="ai-metrics" style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8}}>
              {[
                {label:"NDVI",val:result.ndvi_estimate?.toFixed(2),col:ndviColor(result.ndvi_estimate||0, T),icon:"◈",pct:(result.ndvi_estimate||0)*100},
                {label:"Влажность",val:result.moisture_estimate?.toFixed(2),col:T.sky,icon:"◇",pct:(result.moisture_estimate||0)*100},
                {label:"Покрытие",val:`${result.vegetation_cover}%`,col:T.ok,icon:"◎",pct:result.vegetation_cover||0},
                {label:"Эрозия",val:RISK_STYLE[result.erosion_risk]?.label,col:RISK_STYLE[result.erosion_risk]?.color,icon:"△",pct:result.erosion_risk==="critical"?100:result.erosion_risk==="high"?75:result.erosion_risk==="medium"?50:20},
                {label:"Восстановл.",val:`${result.recovery_potential}%`,col:T.leaf,icon:"▤",pct:result.recovery_potential||0},
                {label:"Статус",val:result.status==="active"?"Активный":result.status==="recovering"?"Восстановл.":result.status==="degraded"?"Деградация":"Заброшен",col:result.status==="active"?T.ok:T.err,icon:"✦",pct:result.status==="active"?90:50},
              ].map(m => (
                <div key={m.label} style={{background:T.card,border:`1px solid ${T.brd}`,borderRadius:14,padding:"12px 10px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${Math.max(m.pct,5)}%`,background:`${m.col}08`}}/>
                  <div style={{fontSize:10,color:T.dim,marginBottom:4}}>{m.icon} {m.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:m.col,lineHeight:1}}>{m.val}</div>
                </div>
              ))}
            </div>

            <div className="ai-details" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <Panel style={{padding:16}}>
                <Title>Детали участка</Title>
                {[["Тип",result.land_type,T.fg],["Культуры",result.crops_detected,T.ok],["Сезон",result.season_estimate,T.gold],["Полив",result.irrigation_needed?"Нужен":"Не нужен",result.irrigation_needed?T.sky:T.ok],["Почва",result.soil_condition,T.sub]].map(([k,v,c]) => (
                  <div key={k} style={{padding:"6px 0",borderBottom:`1px solid ${T.innerBg}`}}>
                    <div style={{fontSize:10,color:T.dim,marginBottom:2}}>{k}</div>
                    <div style={{fontSize:12,fontWeight:600,color:c,lineHeight:1.4}}>{v}</div>
                  </div>
                ))}
              </Panel>
              <Panel style={{padding:16,background:"rgba(220,38,38,0.03)",border:`1px solid rgba(220,38,38,0.08)`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <span style={{color:T.err,fontSize:12,fontWeight:800}}>▲</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.fg}}>Проблемы</span>
                  <span style={{marginLeft:"auto",fontSize:11,fontWeight:800,color:T.err,background:"rgba(220,38,38,0.1)",padding:"1px 8px",borderRadius:10}}>{(result.problems||[]).length}</span>
                </div>
                {(result.problems||[]).map((p,i) => (
                  <div key={i} style={{display:"flex",gap:7,padding:"7px 9px",borderRadius:8,background:"rgba(220,38,38,0.05)",marginBottom:5}}>
                    <span style={{color:T.err,flexShrink:0,fontSize:9,marginTop:3}}>●</span>
                    <span style={{fontSize:12,color:T.fg,lineHeight:1.5}}>{p}</span>
                  </div>
                ))}
              </Panel>
              <Panel style={{padding:16,background:"rgba(5,150,105,0.03)",border:`1px solid rgba(5,150,105,0.08)`}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <span style={{color:T.ok,fontSize:12,fontWeight:800}}>✦</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.fg}}>Рекомендации</span>
                  <span style={{marginLeft:"auto",fontSize:11,fontWeight:800,color:T.ok,background:"rgba(5,150,105,0.1)",padding:"1px 8px",borderRadius:10}}>{(result.recommendations||[]).length}</span>
                </div>
                {(result.recommendations||[]).map((r,i) => (
                  <div key={i} style={{display:"flex",gap:7,padding:"7px 9px",borderRadius:8,background:"rgba(5,150,105,0.05)",marginBottom:5}}>
                    <span style={{color:T.ok,flexShrink:0,fontSize:9,marginTop:3}}>●</span>
                    <span style={{fontSize:12,color:T.fg,lineHeight:1.5}}>{r}</span>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        ) : preview&&!loading ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",background:T.card,border:`1px solid ${T.brd}`,borderRadius:18,minHeight:200}}>
            <div style={{textAlign:"center",color:T.dim}}><div style={{fontSize:36,marginBottom:10}}>⬡</div><div style={{fontSize:14}}>Нажмите «Запустить анализ»</div></div>
          </div>
        ) : null}
      </div>

      {history.length>0 && (
        <Panel>
          <Title>История анализов</Title>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
            {history.map(h => (
              <div key={h.id} onClick={() => {setPreview(h.preview);setResult(h.result);setFile({name:h.name});setError(null);hectaresRef.current=h.hectares||null;}} style={{display:"flex",gap:10,padding:10,borderRadius:12,cursor:"pointer",background:"rgba(0,60,40,0.02)",border:`1px solid ${T.brd}`}}>
                <img src={h.preview} alt="" style={{width:48,height:48,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
                <div><div style={{fontSize:12,fontWeight:700,color:T.fg}}>{h.result.land_type}</div><div style={{fontSize:10,color:T.dim,marginBottom:4}}>{h.date}{h.hectares?` · ${formatHa(h.hectares)}`:""}</div><Badge level={h.result.erosion_risk}/></div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}