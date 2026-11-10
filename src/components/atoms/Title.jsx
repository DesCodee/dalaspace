import { useTheme } from "../../contexts/ThemeContext";

export default function Title({ children }) {
  const { T } = useTheme();
  return <div className="mob-title" style={{fontSize:13, fontWeight:700, color:T.fg, marginBottom:16, letterSpacing:0.1}}>{children}</div>;
}
