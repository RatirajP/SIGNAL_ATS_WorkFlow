import React, { useEffect, useRef, useState } from "react";

function bandFor(score) {
  if (score >= 75) return { color: "var(--success)", label: "Strong match" };
  if (score >= 50) return { color: "var(--warning)", label: "Partial match" };
  return { color: "var(--danger)", label: "Weak match" };
}

/**
 * ScoreRing — animates from 0 to its target value on mount/whenever the
 * score changes, using requestAnimationFrame for a smooth ease-out count-up
 * that also drives the stroke of the ring.
 */
export default function ScoreRing({ score, size = 64, strokeWidth = 6, showLabel = true }) {
  const [animated, setAnimated] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimated(Math.round(eased * score));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const { color, label } = bandFor(score);

  return (
    <div
      className="score-ring"
      style={{ width: size, height: size, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      role="img"
      aria-label={`${label}, score ${score} out of 100`}
      title={`${label}: ${score}/100`}
    >
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {showLabel && (
        <span
          className="mono"
          style={{ position: "absolute", fontWeight: 700, color, fontSize: size / 3.6 }}
        >
          {animated}
        </span>
      )}
    </div>
  );
}
