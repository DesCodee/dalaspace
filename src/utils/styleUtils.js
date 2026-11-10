export const getRiskStyle = (t, T) => ({
  low:      { label: t?.low||"Low",      color: T.ok,   bg: `${T.ok}12`,   brd: `${T.ok}33`,   icon: "✦" },
  medium:   { label: t?.medium||"Med",   color: T.warn, bg: `${T.warn}12`, brd: `${T.warn}33`, icon: "◆" },
  high:     { label: t?.high||"High",    color: T.err,  bg: `${T.err}12`,  brd: `${T.err}33`,  icon: "▲" },
  critical: { label: t?.critical||"Crit",color: T.crit, bg: `${T.crit}12`, brd: `${T.crit}33`, icon: "◉" },
});

export const ndviColor  = (v, T) => v > 0.55 ? T.ok : v > 0.4 ? "#22c55e" : v > 0.25 ? T.warn : T.err;
export const moistColor = (v, T) => v > 0.3 ? T.sky : v > 0.18 ? T.leaf : v > 0.1 ? T.warn : T.err;

export const tipStyle = (T) => ({
  background: T.tipBg,
  border: `1px solid ${T.brd}`,
  borderRadius: 10,
  fontSize: 12,
  color: T.fg,
  boxShadow: T.tipSh,
});
