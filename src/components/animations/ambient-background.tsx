"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
        <div className="absolute top-2/3 -right-20 w-96 h-96 rounded-full bg-orange-200/20 blur-3xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Drifting Mint Shape */}
      <motion.div
        animate={{
          x: [0, 25, 0],
          y: [0, -30, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 -left-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-teal-200/25 via-emerald-100/20 to-transparent blur-3xl"
      />

      {/* Drifting Peach Shape */}
      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] rounded-full bg-gradient-to-bl from-orange-200/25 via-amber-100/20 to-transparent blur-3xl"
      />

      {/* Soft Sky Blue Accent */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-sky-200/20 blur-3xl"
      />
    </div>
  );
}

