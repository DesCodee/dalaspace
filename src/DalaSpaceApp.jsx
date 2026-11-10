import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Map, TrendingUp, MessageCircle
} from "lucide-react";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { REGIONS, getNav } from "./constants/regions";
import { LANG } from "./constants/lang";
import { DATE_LOCALE } from "./constants/theme";
import { fetchWeather, processWeather } from "./utils/weather";
import { GLOBAL_CSS } from "./constants/globalCss";

import DalaLogo from "./components/DalaLogo";
import Loader from "./components/atoms/Loader";
import ExportButton from "./components/ExportButton";
import SettingsPanel from "./components/SettingsPanel";
import WelcomeScreen from "./screens/WelcomeScreen";

import PageOverview from "./pages/PageOverview";
import PageMap from "./pages/PageMap";
import PageRegions from "./pages/PageRegions";
import PageForecast from "./pages/PageForecast";
import PageCompare from "./pages/PageCompare";
import PageDrought from "./pages/PageDrought";
import PageWater from "./pages/PageWater";
import PageTimeline from "./pages/PageTimeline";
import PageAI from "./pages/PageAI";
import PageChat from "./pages/PageChat";
import PageAlerts from "./pages/PageAlerts";

export default function DalaSpaceApp() {
  const [lang, setLang] = useState("ru");
  const [theme, setTheme] = useState("light");

  return (
    <ThemeProvider theme={theme} lang={lang}>
      <AppInner lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />
    </ThemeProvider>
  );
}

function AppInner({ lang, setLang, theme, setTheme }) {
  const { T, RISK_STYLE } = useTheme();
  const [tab,          setTab]         = useState("overview");
  const [selected,     setSelected]    = useState(REGIONS[0]);
  const [data,         setData]        = useState({});
  const [loading,      setLoading]     = useState(true);
  const [progress,     setProgress]    = useState(0);
  const [updated,      setUpdated]     = useState(null);
  const [mobileMenu,   setMobileMenu]  = useState(false);
  const [showSettings, setShowSettings]= useState(false);
  const [showWelcome,  setShowWelcome] = useState(true);
  const [userName,     setUserName]    = useState("");
  const [satImage,     setSatImage]    = useState(null);

  const t = LANG[lang] || LANG.ru;
  const NAV = useMemo(() => getNav(t), [t]);

  const loadAll = useCallback(async () => {
    setLoading(true); setProgress(0);
    const results = {};
    let done = 0;
    const batchSize = 3;
    for (let i = 0; i < REGIONS.length; i += batchSize) {
      const batch = REGIONS.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (r) => {
          try {
            const raw = await fetchWeather(r);
            results[r.id] = processWeather(raw, lang);
          } catch (e) {
            results[r.id] = { error: true };
          } finally {
            done++;
            setProgress(Math.round((done / REGIONS.length) * 100));
          }
        })
      );
      if (i + batchSize < REGIONS.length) {
        await new Promise((res) => setTimeout(res, 80));
      }
    }
    setData(results); setUpdated(new Date()); setLoading(false);
  }, [lang]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const alertCount = useMemo(() => {
    let n=0;
    REGIONS.forEach(r => {
      const d = data[r.id];
      if (!d?.cur) return;
      if (["critical","high"].includes(d.risk)) n++;
      if (d.cur.soil_moisture_0_to_1cm < 0.08) n++;
    });
    return n;
  }, [data]);

  const handleAreaCapture = useCallback(areaData => {
    setSatImage(areaData);
    setTab("ai");
  }, []);

  const consumeSatImage = useCallback(() => {
    setTimeout(() => setSatImage(null), 100);
  }, []);

  const ctx = { data, regions: REGIONS, selected, onSelect: setSelected, navigate: setTab, t, lang, userName };

  return (
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:T.bg,color:T.fg,minHeight:"100dvh",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
      <style>{GLOBAL_CSS(T)}</style>

      <SettingsPanel show={showSettings} onClose={()=>setShowSettings(false)} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme}/>

      {showWelcome ? (
        <WelcomeScreen onStart={()=>setShowWelcome(false)} t={t} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} data={data} progress={progress} userName={userName} setUserName={setUserName}/>
      ) : (
        <>
          {/* ─── HEADER ─── */}
          <header className="mob-header" style={{display:"flex",alignItems:"center",height:56,flexShrink:0,borderBottom:`1px solid ${T.brd}`,background:T.headerBg,backdropFilter:"blur(16px)",boxShadow:T.headerSh,position:"sticky",top:0,zIndex:200}}>
            <div className="mob-header-inner" style={{display:"flex",alignItems:"center",width:"100%",padding:"0 20px",gap:0}}>
              {/* Logo */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginRight:28,flexShrink:0}}>
                <DalaLogo size={34}/>
                <div>
                  <div className="mob-logo-text" style={{fontSize:15,fontWeight:900,color:T.fg,lineHeight:1,letterSpacing:-0.5}}>DalaSpace</div>
                  <div className="mob-logo-sub" style={{fontSize:8,color:T.leaf,fontWeight:700,letterSpacing:2.5,textTransform:"uppercase"}}>Kazakhstan</div>
                </div>
              </div>

              {/* Desktop nav */}
              <nav className="desk-nav" style={{display:"flex",gap:1,flex:1,overflow:"hidden",minWidth:0,alignItems:"center"}}>
                {NAV.map(n => (
                  <button key={n.id} onClick={()=>setTab(n.id)} title={n.label} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:tab===n.id?700:500,background:tab===n.id?T.activeTabBg:"transparent",color:tab===n.id?T.leaf:T.sub,position:"relative",transition:"all 0.15s",whiteSpace:"nowrap",flexShrink:0}}>
                    <n.Icon size={14} strokeWidth={tab===n.id?2.2:1.8}/>
                    <span className="nav-lbl">{n.label}</span>
                    {n.id==="alerts"&&alertCount>0&&<span style={{position:"absolute",top:3,right:5,background:T.err,color:"#fff",fontSize:8,fontWeight:800,width:14,height:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{Math.min(alertCount,9)}</span>}
                  </button>
                ))}
              </nav>

              {/* Mobile hamburger */}
              <button className="mob-btn" onClick={()=>setMobileMenu(!mobileMenu)} style={{display:"none",alignItems:"center",justifyContent:"center",width:36,height:36,borderRadius:9,border:"none",background:T.controlBg,color:T.sub,cursor:"pointer",fontSize:16,flexShrink:0,marginLeft:"auto"}}>☰</button>

              {/* Right controls */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexShrink:0}}>
                <span className="mob-export">{!loading&&<ExportButton data={data} regions={REGIONS} selected={selected} t={t}/>}</span>
                {!loading&&updated&&<div className="mob-time" style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:T.dim}}><span style={{width:5,height:5,borderRadius:"50%",background:T.leaf,display:"inline-block",animation:"blink 2s infinite"}}/>{updated.toLocaleTimeString(DATE_LOCALE[lang] || DATE_LOCALE.ru)}</div>}
                {loading&&<span style={{fontSize:11,color:T.gold}}>{progress}%</span>}
                <button onClick={()=>setShowSettings(true)} style={{width:32,height:32,borderRadius:8,border:`1px solid ${T.brd}`,background:T.controlBg,color:T.sub,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>⚙</button>
                <button onClick={loadAll} disabled={loading} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${T.brd}`,background:T.controlBg,color:T.sub,fontSize:12,cursor:"pointer",opacity:loading?.4:1,fontWeight:600}}>↻</button>
              </div>
            </div>
          </header>

          {/* ─── MOBILE DROPDOWN MENU ─── */}
          {mobileMenu&&(
            <div className="mob-menu" style={{position:"fixed",top:48,left:0,right:0,bottom:56,zIndex:190,background:T.menuBg,backdropFilter:"blur(16px)",borderBottom:`1px solid ${T.brd}`,padding:8,overflowY:"auto"}}>
              <div style={{display:"flex",gap:8,padding:"8px 14px 12px",borderBottom:`1px solid ${T.brd}`,marginBottom:6}}>
                <div style={{display:"flex",gap:2,background:T.controlBg,borderRadius:7,padding:2,border:`1px solid ${T.brd}`}}>
                  {["kz","ru","en"].map(l => <button key={l} onClick={()=>setLang(l)} style={{padding:"4px 0",width:34,borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:lang===l?800:500,textTransform:"uppercase",textAlign:"center",background:lang===l?T.leaf:"transparent",color:lang===l?(T.isDark?"#0a0c0e":"#fff"):T.sub}}>{l}</button>)}
                </div>
                <button onClick={()=>setTheme(theme==="light"?"dark":"light")} style={{width:36,height:36,borderRadius:8,border:`1px solid ${T.brd}`,background:T.controlBg,color:T.leaf,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{theme==="light"?"☾":"☀"}</button>
              </div>
              {NAV.map(n => (
                <button key={n.id} onClick={()=>{setTab(n.id);setMobileMenu(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,border:"none",cursor:"pointer",width:"100%",background:tab===n.id?T.activeTabBg:"transparent",color:tab===n.id?T.leaf:T.sub,fontSize:13,fontWeight:tab===n.id?700:500,marginBottom:2}}>
                  <n.Icon size={16} strokeWidth={tab===n.id?2.2:1.8}/> {n.label}
                  {n.id==="alerts"&&alertCount>0&&<span style={{marginLeft:"auto",background:T.err,color:"#fff",fontSize:9,fontWeight:800,padding:"1px 7px",borderRadius:10}}>{alertCount}</span>}
                </button>
              ))}
            </div>
          )}

          {/* ─── MOBILE BOTTOM TAB BAR ─── */}
          <div className="mob-bottom-bar" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,height:56,zIndex:200,background:T.barBg,backdropFilter:"blur(16px)",boxShadow:T.headerSh,borderTop:`1px solid ${T.brd}`,justifyContent:"space-around",alignItems:"center",padding:"0 2px"}}>
            {[
              {id:"overview",Icon:LayoutDashboard,label:t.overviewTab},
              {id:"map",     Icon:Map,            label:t.mapTab},
              {id:"forecast",Icon:TrendingUp,     label:t.forecastTab},
              {id:"chat",    Icon:MessageCircle,  label:t.chatTab},
              {id:"more",    Icon:null,           label:t.moreTab},
            ].map(n => (
              <button key={n.id} onClick={()=>{ if (n.id==="more") setMobileMenu(!mobileMenu); else { setTab(n.id); setMobileMenu(false); } }} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"6px 0",border:"none",cursor:"pointer",background:"transparent",flex:1,color:(n.id==="more"&&mobileMenu)||tab===n.id?T.leaf:T.dim,fontSize:9,fontWeight:tab===n.id?700:500,position:"relative"}}>
                {n.id==="more"?<span style={{fontSize:18,lineHeight:1}}>⋯</span>:<n.Icon size={20} strokeWidth={tab===n.id?2.2:1.5}/>}
                {n.label}
              </button>
            ))}
          </div>

          {/* ─── CONTENT ─── */}
          <main className="page" key={tab} style={{flex:1,padding:"22px 24px",overflow:"auto",overflowX:"hidden",paddingBottom:22}}>
            {loading ? <Loader text={t.loading||"Loading..."} progress={progress}/> : (
              <>
                {tab==="overview" && <PageOverview {...ctx} onAreaCapture={handleAreaCapture}/>}
                {tab==="map"      && <PageMap      {...ctx}/>}
                {tab==="regions"  && <PageRegions  {...ctx}/>}
                {tab==="forecast" && <PageForecast {...ctx}/>}
                {tab==="compare"  && <PageCompare  {...ctx}/>}
                {tab==="drought"  && <PageDrought  {...ctx}/>}
                {tab==="water"    && <PageWater    {...ctx}/>}
                {tab==="timeline" && <PageTimeline {...ctx}/>}
                {tab==="ai"       && <PageAI initialImage={satImage} onConsumeImage={consumeSatImage} t={t} lang={lang}/>}
                {tab==="chat"     && <PageChat {...ctx}/>}
                {tab==="alerts"   && <PageAlerts   {...ctx}/>}
              </>
            )}
          </main>

          <footer style={{borderTop:`1px solid ${T.brd}`,padding:"10px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6,fontSize:11,color:T.dim}}>
            <span>© 2025 DalaSpace · AEROO SPACE AI</span>
            <span>Open-Meteo · Esri · Claude AI · {REGIONS.length} регионов</span>
            <span>Казахстан</span>
          </footer>
        </>
      )}
    </div>
  );
}
