import { useTheme } from "../../contexts/ThemeContext";

export default function Stat({ icon, title, value, unit, accent, note }) {
  const { T } = useTheme();
  return (
    <div className="mob-stat" style={{
      background:T.card, border:`1px solid ${T.brd}`, borderRadius:18,
      padding:"20px 22px", position:"relative", overflow:"hidden",
      boxShadow:T.isDark?"none":"0 1px 3px rgba(0,0,0,0.03)",
    }}>
      <div style={{
        position:"absolute", top:-16, right:-16, width:72, height:72,
        borderRadius:"50%", background:`${accent}12`, filter:"blur(28px)",
      }}/>
      <div className="mob-stat-title" style={{
        fontSize:11, color:T.sub, marginBottom:12, fontWeight:600,
        letterSpacing:0.3, textTransform:"uppercase",
      }}>{icon}  {title}</div>
      <div className="mob-stat-val" style={{fontSize:28, fontWeight:800, color:accent, letterSpacing:-1.2, lineHeight:1}}>
        {value}
        {unit && <span style={{fontSize:13, fontWeight:500, color:T.sub, marginLeft:5}}>{unit}</span>}
      </div>
      {note && <div className="mob-stat-note" style={{fontSize:11, color:T.dim, marginTop:8}}>{note}</div>}
    </div>
  );
}
