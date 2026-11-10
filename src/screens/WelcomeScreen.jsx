import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import DalaLogo from "../components/DalaLogo";
import CountUp from "../components/atoms/CountUp";

export default function WelcomeScreen({ onStart, t, lang, setLang, theme, setTheme, data, progress, userName, setUserName }) {
  const { T } = useTheme();
  /* ALL hooks declared here at top level — no hooks inside JSX */
  const [photoIdx,    setPhotoIdx]    = useState(0);
  const [blurOut,     setBlurOut]     = useState(false);
  const [imgLoaded,   setImgLoaded]   = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const photos = [
    "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=70&auto=format",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=70&auto=format",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=1200&q=70&auto=format",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=70&auto=format",
  ];

  const liveStats = useMemo(() => {
    const entries = Object.values(data||{}).filter(d=>d?.cur);
    if (!entries.length) return null;
    const n = entries.length;
    return {
      avgT:  (entries.reduce((s,d)=>s+(d.cur.temperature_2m||0),0)/n).toFixed(1),
      avgNDVI:(entries.reduce((s,d)=>s+(d.ndvi||0),0)/n).toFixed(2),
      riskCount:entries.filter(d=>["critical","high"].includes(d.risk)).length,
    };
  }, [data]);

  // Preload images
  useEffect(() => {
    photos.forEach((src,i) => {
      const img = new Image();
      img.src = src;
      if (i===0) img.onload = () => setImgLoaded(true);
    });
  }, []);

  // Photo rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setBlurOut(true);
      setTimeout(() => { setPhotoIdx(prev=>(prev+1)%photos.length); setBlurOut(false); }, 700);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  // CountUp component (defined inside but no hooks — just a render function)
// CountUp is now imported as a standalone component
  const changelog = [
    lang==="kz"?"6 жаңа карта мүмкіндігі":lang==="ru"?"6 новых фич карты":"6 new map features",
    lang==="kz"?"Мобильді UI толық түзетілді":lang==="ru"?"Mobile UI полностью исправлен":"Mobile UI fully fixed",
    lang==="kz"?"AI модель таңдау":lang==="ru"?"Выбор AI-модели":"AI model selection",
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",minHeight:"100dvh",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>
      <div style={{display:"flex",flex:1}}>
        {/* Photo panel */}
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#0a2e1a,#1a4a2e)"}}/>
          <div style={{position:"absolute",inset:-8,backgroundImage:`url('${photos[photoIdx]}')`,backgroundSize:"cover",backgroundPosition:"center",animation:"wZoom 22s ease-in-out infinite alternate",filter:blurOut?"blur(16px) brightness(0.8)":"blur(0) brightness(1)",opacity:imgLoaded?1:0,transition:"filter 0.7s ease,opacity 0.8s ease"}}/>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,0.02) 0%,rgba(0,0,0,0.45) 80%,rgba(0,0,0,0.6) 100%)"}}/>

          {/* Dots */}
          <div style={{position:"absolute",bottom:14,right:18,zIndex:3,display:"flex",gap:5}}>
            {photos.map((_,i) => <div key={i} style={{width:i===photoIdx?18:6,height:6,borderRadius:3,background:i===photoIdx?"#fff":"rgba(255,255,255,0.3)",transition:"all 0.4s"}}/>)}
          </div>

          {/* Info */}
          <div style={{position:"absolute",bottom:40,left:40,right:40,zIndex:2,color:"#fff",animation:"wSlideUp 0.8s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <DalaLogo size={32} color="#fff"/>
              <h2 style={{fontSize:20,fontWeight:800,letterSpacing:-0.8,margin:0}}>DalaSpace</h2>
            </div>
            <p style={{fontSize:13,lineHeight:1.7,opacity:0.75,maxWidth:340}}>{t.monitoring}</p>
          </div>
        </div>

        {/* Form panel */}
        <div style={{flex:"0 0 460px",maxWidth:"100%",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:"36px 28px",background:T.isDark?"#0e1012":"#fff",position:"relative",overflowY:"auto",boxSizing:"border-box"}}>
          {/* Top bar */}
          <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6,alignItems:"center",zIndex:5}}>
            <button onClick={()=>setShowChangelog(!showChangelog)} style={{padding:"3px 9px",borderRadius:6,border:"none",cursor:"pointer",background:T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",color:T.leaf,fontSize:9,fontWeight:700}}>v2.2</button>
            <div style={{display:"flex",gap:2,background:T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",borderRadius:8,padding:2}}>
              {["kz","ru","en"].map(l => (
                <button key={l} onClick={()=>setLang(l)} style={{padding:"4px 0",width:30,borderRadius:6,border:"none",cursor:"pointer",fontSize:10,fontWeight:lang===l?700:500,textTransform:"uppercase",textAlign:"center",background:lang===l?T.leaf:"transparent",color:lang===l?"#fff":T.dim}}>{l}</button>
              ))}
            </div>
            <button onClick={()=>setTheme(theme==="light"?"dark":"light")} style={{width:30,height:30,borderRadius:8,border:"none",background:T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.04)",color:T.dim,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{theme==="light"?"☾":"☀"}</button>
          </div>

          {showChangelog&&(
            <div style={{position:"absolute",top:50,right:16,zIndex:10,background:T.isDark?"#1a1d20":"#fff",borderRadius:12,border:`1px solid ${T.brd}`,padding:14,width:220,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",animation:"wFadeIn 0.25s ease"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.fg,marginBottom:6}}>{lang==="kz"?"Жаңалықтар":lang==="ru"?"Что нового":"What's new"} v2.2</div>
              {changelog.map((item,i) => <div key={i} style={{fontSize:11,color:T.sub,padding:"3px 0",display:"flex",gap:5}}><span style={{color:T.leaf,fontSize:7,marginTop:4}}>●</span>{item}</div>)}
            </div>
          )}

          <div style={{width:"100%",maxWidth:330,animation:"wSlideUp 0.5s ease"}}>
            <DalaLogo size={44}/>
            <h1 style={{fontSize:26,fontWeight:700,color:T.fg,margin:"24px 0 0",letterSpacing:-0.5,lineHeight:1.2}}>
              {lang==="kz"?"Қош келдіңіз":lang==="ru"?"Добро пожаловать":"Welcome"}
            </h1>
            <p style={{fontSize:13,color:T.sub,marginTop:6,lineHeight:1.5}}>
              {lang==="kz"?"DalaSpace жүйесіне кіру":lang==="ru"?"Войдите в DalaSpace":"Sign in to DalaSpace"}
            </p>

            <div style={{marginTop:20}}>
              <label style={{fontSize:11,fontWeight:600,color:T.dim,marginBottom:5,display:"block"}}>
                {lang==="kz"?"Сіздің атыңыз":lang==="ru"?"Ваше имя":"Your name"}
              </label>
              <input value={userName} onChange={e=>setUserName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onStart()}
                placeholder={lang==="kz"?"Аят":lang==="ru"?"Аят":"Ayat"}
                style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1px solid ${T.brd}`,background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)",color:T.fg,fontSize:14,outline:"none",transition:"border-color 0.2s",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor=T.leaf} onBlur={e=>e.target.style.borderColor=T.brd}/>
            </div>

            {/* Live stats or progress bar */}
            {liveStats ? (
              <div style={{marginTop:14,padding:"12px 14px",borderRadius:12,background:T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)",border:`1px solid ${T.brd}`,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,animation:"wFadeIn 0.8s ease"}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:T.fg}}><CountUp end={liveStats.avgT} suffix="°"/></div><div style={{fontSize:9,color:T.dim,marginTop:1}}>{lang==="kz"?"орт. t°":lang==="ru"?"ср. t°":"avg t°"}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:T.leaf}}><CountUp end={liveStats.avgNDVI}/></div><div style={{fontSize:9,color:T.dim,marginTop:1}}>NDVI</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:liveStats.riskCount>0?T.err:T.ok}}><CountUp end={String(liveStats.riskCount)}/></div><div style={{fontSize:9,color:T.dim,marginTop:1}}>{lang==="kz"?"қауіп":lang==="ru"?"риск":"risk"}</div></div>
              </div>
            ) : progress>0 ? (
              <div style={{marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.dim,marginBottom:3}}><span>{lang==="kz"?"Жүктелуде":lang==="ru"?"Загрузка":"Loading"}</span><span>{progress}%</span></div>
                <div style={{height:4,borderRadius:2,background:T.isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)"}}><div style={{height:"100%",borderRadius:2,background:T.leaf,width:`${progress}%`,transition:"width 0.3s"}}/></div>
              </div>
            ) : null}

            <button onClick={onStart} style={{width:"100%",marginTop:16,padding:"13px 0",borderRadius:12,background:T.leaf,border:"none",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.9"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              {userName.trim()
                ? (lang==="kz"?`Кіру, ${userName.trim()}`:lang==="ru"?`Войти, ${userName.trim()}`:`Enter, ${userName.trim()}`)
                : t.enter}
            </button>
            <button onClick={()=>{setUserName("Demo");onStart();}} style={{width:"100%",marginTop:8,padding:"9px 0",borderRadius:10,background:"transparent",border:`1px solid ${T.brd}`,color:T.sub,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.leaf;e.currentTarget.style.color=T.leaf;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.brd;e.currentTarget.style.color=T.sub;}}>
              {lang==="kz"?"Демо режимді көру →":lang==="ru"?"Посмотреть демо →":"Try demo →"}
            </button>
            <div style={{marginTop:24,fontSize:10,color:T.dim}}>{t.competitionLine}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
