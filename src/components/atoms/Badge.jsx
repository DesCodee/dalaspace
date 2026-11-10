import { useTheme } from "../../contexts/ThemeContext";

export default function Badge({ level }) {
  const { RISK_STYLE } = useTheme();
  const s = RISK_STYLE[level] || RISK_STYLE.medium;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:4,
      background:s.bg, color:s.color, border:`1px solid ${s.brd}`,
      padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700,
      letterSpacing:0.2, whiteSpace:"nowrap",
    }}>
      <span style={{fontSize:8}}>{s.icon}</span> {s.label}
    </span>
  );
}
