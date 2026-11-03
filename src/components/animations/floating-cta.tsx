"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Calendar, MessageSquare, ArrowRight } from "lucide-react";

interface FloatingCTAProps {
  onOpenBooking: () => void;
}

export function FloatingCTA({ onOpenBooking }: FloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      // Appear after scrolling past the hero section (~450px)
      if (window.scrollY > 450) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappUrl =
    "https://wa.me/919820011000?text=Hello%20MediConnect%20Children%27s%20Hospital%2C%20I%20would%20like%20to%20inquire%20about%20a%20pediatric%20appointment";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.92 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 drop-shadow-xl"
        >
          {/* WhatsApp Direct Chat Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="group flex items-center gap-2 h-12 px-4 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <MessageSquare className="h-5 w-5 fill-current" />
            <span className="hidden sm:inline text-xs font-bold tracking-tight">
              WhatsApp Desk
            </span>
          </a>

          {/* Quick Book a Visit Button */}
          <button
            type="button"
            onClick={onOpenBooking}
            aria-label="Book an Appointment"
            className="group relative flex items-center gap-2.5 h-12 pl-5 pr-4 rounded-full bg-gradient-to-r from-[#ff5a36] to-[#f1592a] hover:from-[#f14d27] hover:to-[#df461b] text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer overflow-hidden"
          >
            {/* Subtle light sweep reflection */}
            <span className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
            <Calendar className="h-4 w-4" />
            <span>Book a Visit</span>
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="h-3 w-3 stroke-[3]" />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

