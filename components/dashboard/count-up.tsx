"use client";

import * as React from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  format?: (v: number) => string;
}

export function CountUp({ value, duration = 900, decimals = 0, format }: CountUpProps) {
  const [display, setDisplay] = React.useState(value);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    const start = performance.now();
    const from = valueRef.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else valueRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = format
    ? format(display)
    : display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

  return <>{text}</>;
}
