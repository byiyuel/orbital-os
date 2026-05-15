"use client";

import { useEffect, useState, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
}

export default function Counter({ value, duration = 2, formatter = (v) => v.toLocaleString() }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  const [displayValue, setDisplayValue] = useState(formatter(0));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(formatter(latest));
    });
  }, [springValue, formatter]);

  return <span ref={ref}>{displayValue}</span>;
}
