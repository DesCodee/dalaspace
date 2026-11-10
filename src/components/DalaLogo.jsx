import { useTheme } from "../contexts/ThemeContext";

export default function DalaLogo({ size = 32, color }) {
  const { T } = useTheme();
  const c = color || T.leaf;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={`${c}15`} stroke={`${c}40`} strokeWidth="1.5"/>
      <path d="M10 28 Q15 22 20 24 Q25 26 30 20" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M8 32 Q16 26 24 28 Q30 30 34 24" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
      <ellipse cx="22" cy="14" rx="10" ry="4" stroke={c} strokeWidth="1.2" strokeDasharray="2 2" fill="none" opacity="0.5" transform="rotate(-20 22 14)"/>
      <circle cx="28" cy="11" r="2.5" fill={c} opacity="0.9"/>
      <circle cx="28" cy="11" r="4" fill="none" stroke={c} strokeWidth="0.8" opacity="0.4"/>
    </svg>
  );
}
