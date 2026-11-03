"use client";

import React, { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: string;
  duration?: number;
  className?: string;
}

export function CountUp({ value, duration = 1.6, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : "0");

  useEffect(() => {
    if (shouldReduceMotion || !isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const match = value.match(/([^\d.]*)([\d,]+(?:\.\d+)?)(.*)/);

    const step = (timestamp: number) => {
      if (!match) {
        setDisplayValue(value);
        return;
      }

      const prefix = match[1] || "";
      const rawNumberStr = match[2].replace(/,/g, "");
      const suffix = match[3] || "";
      const targetNumber = parseFloat(rawNumberStr);

      if (isNaN(targetNumber)) {
        setDisplayValue(value);
        return;
      }

      const hasComma = match[2].includes(",");
      const decimalPlaces = rawNumberStr.includes(".")
        ? rawNumberStr.split(".")[1].length
        : 0;

      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * targetNumber;

      let formattedNumber: string;
      if (decimalPlaces > 0) {
        formattedNumber = current.toFixed(decimalPlaces);
      } else {
        formattedNumber = Math.round(current).toString();
      }

      if (hasComma) {
        const parts = formattedNumber.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        formattedNumber = parts.join(".");
      }

      setDisplayValue(`${prefix}${formattedNumber}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
