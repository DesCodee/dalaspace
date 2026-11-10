import { useTheme } from "../contexts/ThemeContext";
import DalaLogo from "./DalaLogo";

export default function SettingsPanel({ show, onClose, lang, setLang, theme, setTheme }) {
  const { T } = useTheme();
  if (!show) return null;
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:9998,backdropFilter:"blur(3px)"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:340,maxWidth:"90vw",background:T.isDark?"#0e1012":"#fff",zIndex:9999,boxShadow:"-8px 0 40px rgba(0,0,0,0.15)",overflowY:"auto",animation:"slideInRight 0.25s ease"}}>
        <div style={{padding:"20px 20px 12px",borderBottom:`1px solid ${T.brd}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:16,fontWeight:800,color:T.fg}}>{lang==="kz"?"Баптаулар":lang==="ru"?"Настройки":"Settings"}</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:"none",background:T.controlBg,color:T.sub,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{padding:20,display:"flex",flexDirection:"column",gap:20}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:T.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{lang==="kz"?"Тіл":lang==="ru"?"Язык":"Language"}</div>
            <div style={{display:"flex",gap:6}}>
              {[{l:"kz",f:"🇰🇿",n:"Қазақша"},{l:"ru",f:"🇷🇺",n:"Русский"},{l:"en",f:"🇬🇧",n:"English"}].map(({l,f,n}) => (
                <button key={l} onClick={()=>setLang(l)} style={{flex:1,padding:"10px 8px",borderRadius:10,cursor:"pointer",border:`1px solid ${lang===l?T.leaf:T.brd}`,background:lang===l?`${T.leaf}12`:"transparent",color:lang===l?T.leaf:T.sub,fontSize:12,fontWeight:lang===l?700:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:16}}>{f}</span>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:T.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{lang==="kz"?"Тема":lang==="ru"?"Тема":"Theme"}</div>
            <div style={{display:"flex",gap:6}}>
              {[{k:"light",i:"☀",n:lang==="kz"?"Жарық":lang==="ru"?"Светлая":"Light"},{k:"dark",i:"☾",n:lang==="kz"?"Қараңғы":lang==="ru"?"Тёмная":"Dark"}].map(({k,i,n}) => (
                <button key={k} onClick={()=>setTheme(k)} style={{flex:1,padding:10,borderRadius:10,cursor:"pointer",border:`1px solid ${theme===k?T.leaf:T.brd}`,background:theme===k?`${T.leaf}12`:"transparent",color:theme===k?T.leaf:T.sub,fontSize:12,fontWeight:theme===k?700:500,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><span style={{fontSize:16}}>{i}</span>{n}</button>
              ))}
            </div>
          </div>
          <div style={{padding:16,borderRadius:14,background:T.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)",border:`1px solid ${T.brd}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><DalaLogo size={28}/><div><div style={{fontSize:14,fontWeight:800,color:T.fg}}>DalaSpace</div><div style={{fontSize:10,color:T.dim}}>v2.2 · AEROO SPACE AI</div></div></div>
            <p style={{fontSize:12,color:T.sub,lineHeight:1.6,margin:0}}>Платформа спутниковой аналитики сельского хозяйства Казахстана. 17 регионов в реальном времени.</p>
            <div style={{marginTop:10,fontSize:10,color:T.dim}}>Разработчик: Murat · AEROO SPACE AI 2025</div>
          </div>
        </div>
      </div>
    </>
  );
}
