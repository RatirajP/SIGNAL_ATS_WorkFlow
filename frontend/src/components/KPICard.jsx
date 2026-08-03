import React, { useEffect, useRef, useState } from "react";

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

export default function KPICard({ icon: Icon, label, value, suffix = "", accent = "primary", delay = 0 }) {
  const animated = useCountUp(value);

  return (
    <div
      className="card kpi-card animate-in-scale"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`kpi-card__icon kpi-card__icon--${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="kpi-card__value mono">
          {animated}
          {suffix}
        </p>
        <p className="kpi-card__label">{label}</p>
      </div>
    </div>
  );
}
