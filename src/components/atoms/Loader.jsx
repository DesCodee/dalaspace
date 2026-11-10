import { useTheme } from "../../contexts/ThemeContext";

export default function Loader({ text, progress }) {
  const { T } = useTheme();
  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20, padding:"100px 20px"}}>
      <div style={{position:"relative", width:64, height:64}}>
        <div style={{position:"absolute", inset:0, borderRadius:"50%", border:`3px solid ${T.brd}`, borderTopColor:T.leaf, animation:"revolve 1.2s linear infinite"}}/>
        <div style={{position:"absolute", inset:8, borderRadius:"50%", border:`2px solid ${T.brd}`, borderBottomColor:T.gold, animation:"revolve 1.8s linear infinite reverse"}}/>
        <span style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18}}>🌾</span>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:14, fontWeight:700, color:T.fg}}>{text||"Загрузка…"}</div>
        {progress != null && (
          <div style={{marginTop:12, width:240}}>
            <div style={{height:4, background:T.brd, borderRadius:2, overflow:"hidden"}}>
              <div style={{width:`${progress}%`, height:"100%", borderRadius:2, background:`linear-gradient(90deg, ${T.leaf}, ${T.sky})`, transition:"width 0.3s"}}/>
            </div>
            <div style={{fontSize:11, color:T.dim, marginTop:6}}>{progress}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
