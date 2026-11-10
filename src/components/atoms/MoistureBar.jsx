import { useTheme } from "../../contexts/ThemeContext";
import { moistColor } from "../../utils/styleUtils";

export default function MoistureBar({ value }) {
  const { T } = useTheme();
  const pct = Math.min((value||0)*250, 100);
  const col = moistColor(value||0, T);
  return (
    <div style={{display:"flex", alignItems:"center", gap:8}}>
      <div style={{flex:1, height:5, background:T.isDark?"rgba(255,255,255,0.05)":"rgba(0,60,40,0.05)", borderRadius:3, overflow:"hidden"}}>
        <div style={{width:`${pct}%`, height:"100%", background:col, borderRadius:3, transition:"width 0.8s"}}/>
      </div>
      <span style={{fontSize:11, fontWeight:700, color:col, minWidth:44, textAlign:"right"}}>
        {((value||0)*100).toFixed(1)}%
      </span>
    </div>
  );
}
