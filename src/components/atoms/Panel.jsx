import { useTheme } from "../../contexts/ThemeContext";

export default function Panel({ children, style, className = "" }) {
  const { T } = useTheme();
  return (
    <div className={`mob-panel ${className}`.trim()} style={{
      background:T.card, border:`1px solid ${T.brd}`, borderRadius:20, padding:24,
      boxShadow:T.isDark?"none":"0 1px 4px rgba(0,0,0,0.03)",
      ...style,
    }}>
      {children}
    </div>
  );
}
