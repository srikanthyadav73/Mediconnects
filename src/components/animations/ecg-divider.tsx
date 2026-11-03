"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ECGDividerProps {
  className?: string;
}

export function ECGDivider({ className = "" }: ECGDividerProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`w-full overflow-hidden flex items-center justify-center py-4 select-none pointer-events-none ${className}`}>
      <div className="w-full max-w-4xl px-4 flex items-center justify-center">
        <svg
          viewBox="0 0 600 32"
          className="w-full h-8 overflow-visible"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0" />
              <stop offset="25%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="45%" stopColor="#0d9488" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f1592a" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#0d9488" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Background subtle base line */}
          <line
            x1="0"
            y1="16"
            x2="600"
            y2="16"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Animated ECG Pulse Line */}
          {shouldReduceMotion ? (
            <path
              d="M 0,16 L 240,16 L 255,16 L 265,9 L 275,25 L 285,3 L 295,28 L 305,12 L 315,18 L 325,16 L 600,16"
              stroke="url(#ecgGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <motion.path
              d="M 0,16 L 240,16 L 255,16 L 265,9 L 275,25 L 285,3 L 295,28 L 305,12 L 315,18 L 325,16 L 600,16"
              stroke="url(#ecgGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 1.4,
                ease: "easeOut",
              }}
            />
          )}

          {/* Little heart pulse at center */}
          <circle
            cx="285"
            cy="3"
            r="3"
            fill="#f1592a"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

