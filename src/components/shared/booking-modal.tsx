"use client";

import * as React from "react";
import {
  X,
  MessageSquare,
  Clock,
  Phone,
} from "lucide-react";
import { AppointmentRequestForm } from "./appointment-form";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  // Prevent background scrolling when modal is open and handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-gradient-to-br from-[#ebfaf6] via-[#f3fcf9] to-[#e4f6fb] border border-teal-100 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Heart Decorations */}
        <div className="absolute top-10 left-8 text-rose-300/40 text-4xl select-none pointer-events-none transform -rotate-12">
          ♡
        </div>
        <div className="absolute top-20 right-20 text-teal-300/30 text-5xl select-none pointer-events-none">
          ♡
        </div>
        <div className="absolute bottom-12 right-1/3 text-orange-300/40 text-3xl select-none pointer-events-none transform rotate-12">
          ♡
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close booking modal"
          className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-white/95 hover:bg-white text-slate-500 hover:text-slate-900 shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-200/80"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Feature Highlights & Mascot */}
            <div className="lg:col-span-5 space-y-5">
              {/* WhatsApp Synced Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-2xs">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#25d366] text-white">
                  <MessageSquare className="h-2.5 w-2.5 fill-current" />
                </span>
                <span>Instant Clinic Booking • WhatsApp Synced</span>
              </div>

              {/* Headline with Outline Heart */}
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Pediatric Care <br />
                <span className="text-[#00897b] inline-flex items-center gap-2">
                  Made Simple
                  <span className="text-[#f1592a] text-3xl font-normal inline-block transform -rotate-6">
                    ♡
                  </span>
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Book your child&apos;s consultation in just a few clicks. Get instant confirmation, queue tokens, and reminders on WhatsApp.
              </p>

              {/* 3 Styled Feature Highlights */}
              <div className="space-y-2.5 pt-1">
                {/* Feature 1 */}
                <div className="bg-[#eef9f5]/90 border border-emerald-100/90 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
                  <div className="h-9 w-9 rounded-full bg-[#25d366] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
                    <MessageSquare className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      Automated WhatsApp Reminders
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Receive reminders 24h &amp; 2h before consultation.
                    </span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#f0f8fd]/90 border border-sky-100/90 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
                  <div className="h-9 w-9 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/25">
                    <Clock className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      ~30 Min Fast-Track Response
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Our pediatric desk reviews and confirms promptly.
                    </span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#fff4ee]/90 border border-orange-100/90 rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
                  <div className="h-9 w-9 rounded-full bg-[#f1592a] text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/25">
                    <Phone className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block leading-tight">
                      24/7 Pediatric Emergency Desk
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Call (022) 2654 8900 for immediate support.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Mascot with Teddy Bear & Tagline */}
              <div className="pt-1 flex items-end gap-3.5">
                <div className="relative h-20 w-24 sm:h-24 sm:w-28 rounded-2xl overflow-hidden shadow-md border-2 border-white/90 bg-white/60 shrink-0">
                  <img
                    src="/images/child-teddy-banner.jpg"
                    alt="Happy child with teddy bear"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="pb-1 select-none">
                  <div className="font-extrabold text-[#00695c] text-xs leading-tight tracking-tight rotate-[-2deg]">
                    Healthy
                  </div>
                  <div className="font-extrabold text-[#00695c] text-xs leading-tight tracking-tight rotate-[-2deg] pl-1.5">
                    Kids
                  </div>
                  <div className="font-extrabold text-[#00796b] text-xs leading-tight tracking-tight rotate-[-2deg] pl-2.5">
                    Happier
                  </div>
                  <div className="font-extrabold text-[#00796b] text-xs leading-tight tracking-tight rotate-[-2deg] flex items-center gap-1 pl-3.5">
                    Tomorrows <span className="text-[#f1592a] text-xs">🧡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Appointment Form Component */}
            <div className="lg:col-span-7">
              <AppointmentRequestForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

