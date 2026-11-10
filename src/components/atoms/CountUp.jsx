import { useState, useEffect } from "react";

export default function CountUp({ end, suffix = "" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = parseFloat(end);
    if (isNaN(num)) { setVal(end); return; }
    const decimals = end.toString().includes(".") ? end.toString().split(".")[1].length : 0;
    const start = Date.now();
    const tick = () => {
      const pct = Math.min((Date.now() - start) / 1400, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(decimals ? (num * ease).toFixed(decimals) : Math.round(num * ease));
      if (pct < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [end]);
  return <>{val}{suffix}</>;
}
