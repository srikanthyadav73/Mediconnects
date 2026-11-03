"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Stethoscope,
  Phone,
  Clock,
  MapPin,
  Calendar,
  Baby,
  Activity,
  Mail,
  Syringe,
  Smile,
  User,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookingModal } from "@/components/shared/booking-modal";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/animations/fade-up";
import { WordReveal } from "@/components/animations/text-reveal";
import { CountUp } from "@/components/animations/count-up";
import { ECGDivider } from "@/components/animations/ecg-divider";
import { ScrollProgress } from "@/components/animations/scroll-progress";
import { SmoothScrollProvider } from "@/components/animations/smooth-scroll";
import { FloatingCTA } from "@/components/animations/floating-cta";
import { AmbientBackground } from "@/components/animations/ambient-background";
import { SpotlightCard } from "@/components/animations/spotlight-card";

function MediConnectLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 44 44" className="w-full h-full drop-shadow-xs" fill="none">
        {/* Soft rounded heart base with deep emerald/teal */}
        <path
          d="M22 39C20.8 39 8.5 29 4.8 21.2C1.5 14.5 3.2 6.8 9.8 4.6C15.3 3 19.8 6.3 22 9C24.2 6.3 28.7 3 34.2 4.6C40.8 6.8 42.5 14.5 39.2 21.2C35.5 29 23.2 39 22 39Z"
          fill="#0c6961"
        />
        {/* Warm vibrant orange medical plus */}
        <rect x="19" y="13" width="6" height="18" rx="2" fill="#ff6738" />
        <rect x="13" y="19" width="18" height="6" rx="2" fill="#ff6738" />
      </svg>
    </div>
  );
}

// Compute live hospital operating status in Indian Standard Time (IST, UTC+5:30)
function getHospitalStatus(): { isOpen: boolean; text: string } {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);

  const day = istDate.getDay(); // 0 is Sunday, 1-6 is Mon-Sat
  const hour = istDate.getHours();
  const minute = istDate.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Mon-Sat: 8:00 AM (480 mins) to 9:00 PM (1260 mins)
  const isOpdOpen = day >= 1 && day <= 6 && timeInMinutes >= 480 && timeInMinutes < 1260;

  if (isOpdOpen) {
    return { isOpen: true, text: "Open Now • Regular OPD (Emergency 24/7)" };
  } else {
    return { isOpen: false, text: "OPD Closed • Emergency Open 24/7" };
  }
}

export default function LandingPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash === "#appointment-form") {
        setIsBookingModalOpen(true);
      }
    };
    const timer = setTimeout(checkHash, 0);
    window.addEventListener("hashchange", checkHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", checkHash);
    };
  }, []);

  const hospitalStatus = useMemo(() => getHospitalStatus(), []);

  // 6 Specialty Cards with individual soft pastel accents
  const services = [
    {
      title: "General Pediatrics & OPD",
      desc: "Complete acute illness care, fever management, routine health assessments, and developmental milestone screening by senior pediatricians.",
      icon: Stethoscope,
      tag: "Outpatient Clinic",
      accent: {
        bg: "bg-emerald-50 text-emerald-700",
        border: "border-t-emerald-500",
        glow: "rgba(16, 185, 129, 0.08)",
      },
    },
    {
      title: "Newborn & Neonatal NICU",
      desc: "Advanced Level-III neonatal intensive care for premature infants, newborn jaundice management, phototherapy, and specialized neonatal surgery.",
      icon: Baby,
      tag: "Critical Care",
      accent: {
        bg: "bg-pink-50 text-pink-700",
        border: "border-t-pink-500",
        glow: "rgba(244, 114, 182, 0.08)",
      },
    },
    {
      title: "Pediatric Pulmonology & Asthma",
      desc: "Comprehensive childhood asthma care, seasonal allergy desensitization, spirometry, and customized nebulization plans for wheezing.",
      icon: Activity,
      tag: "Specialty Clinic",
      accent: {
        bg: "bg-sky-50 text-sky-700",
        border: "border-t-sky-500",
        glow: "rgba(14, 165, 233, 0.08)",
      },
    },
    {
      title: "Childhood Immunization & Flu",
      desc: "WHO & IAP compliant digital vaccination schedule tracking with automatic WhatsApp alerts 24h before booster doses.",
      icon: Syringe,
      tag: "Preventive Care",
      accent: {
        bg: "bg-amber-50 text-amber-700",
        border: "border-t-amber-500",
        glow: "rgba(245, 158, 11, 0.08)",
      },
    },
    {
      title: "Growth, Nutrition & Milestones",
      desc: "Pediatric endocrinology, underweight child nutrition therapy, dietary counseling, and early intervention developmental therapy.",
      icon: Smile,
      tag: "Child Wellness",
      accent: {
        bg: "bg-purple-50 text-purple-700",
        border: "border-t-purple-500",
        glow: "rgba(168, 85, 247, 0.08)",
      },
    },
    {
      title: "24/7 Pediatric Emergency & Triage",
      desc: "Dedicated child-safe resuscitation suite, round-the-clock pediatric intensivists, trauma care, and rapid fever convulsion response.",
      icon: Clock,
      tag: "24/7 Emergency",
      accent: {
        bg: "bg-orange-50 text-[#f1592a]",
        border: "border-t-orange-500",
        glow: "rgba(241, 89, 42, 0.08)",
      },
    },
  ];

  const doctors = [
    {
      name: "Dr. Ananya Roy",
      role: "Chief Pediatrician & Neonatologist",
      qualifications: "MD (Pediatrics), DCH, Fellowship in Neonatology (AIIMS)",
      experience: "16+ Years Experience",
      specialty: "High-risk newborns, infant developmental milestones, and pediatric intensive care.",
      // Optional real photo path: e.g. "/images/doctors/dr-ananya-roy.jpg" - add real photo file when available
      image: undefined as string | undefined,
    },
    {
      name: "Dr. Rahul Deshpande",
      role: "Senior Consultant - Pediatric Pulmonology",
      qualifications: "MBBS, MD (Pediatrics), Pediatric Pulmonology (UK)",
      experience: "14+ Years Experience",
      specialty: "Childhood asthma, recurrent bronchitis, allergy screening, and sleep disorders.",
      // Optional real photo path: e.g. "/images/doctors/dr-rahul-deshpande.jpg"
      image: undefined as string | undefined,
    },
    {
      name: "Dr. Meenakshi Sundaram",
      role: "Head of Behavioral & Developmental Pediatrics",
      qualifications: "MBBS, DNB (Pediatrics), Child Development Specialist",
      experience: "12+ Years Experience",
      specialty: "Speech delays, behavioral nutrition, sensory integration, and early school readiness.",
      // Optional real photo path: e.g. "/images/doctors/dr-meenakshi-sundaram.jpg"
      image: undefined as string | undefined,
    },
    {
      name: "Dr. Tanvi Shah",
      role: "Consultant - Pediatric Surgery & Trauma",
      qualifications: "MBBS, MS (General Surgery), MCh (Pediatric Surgery)",
      experience: "10+ Years Experience",
      specialty: "Minimally invasive pediatric surgery, congenital corrections, and acute trauma.",
      // Optional real photo path: e.g. "/images/doctors/dr-tanvi-shah.jpg"
      image: undefined as string | undefined,
    },
  ];

  const testimonials = [
    {
      parent: "Priya & Rajesh Sharma",
      child: "Parents of Aarav (Age 5)",
      quote:
        "When Aarav had persistent wheezing and high fever at midnight, the emergency pediatric team at MediConnect had him stabilized within 15 minutes. The WhatsApp medication alerts over the next 4 days ensured we never missed an antibiotic dose.",
      location: "Bandra West, Mumbai",
      offsetClass: "md:translate-y-0",
    },
    {
      parent: "Sneha Kulkarni",
      child: "Mother of Aditi (Age 3)",
      quote:
        "The child-friendly environment immediately put my daughter at ease. Dr. Roy took 30 minutes to explain her nutritional chart. Booking via WhatsApp and receiving digital prescriptions right on my phone is revolutionary.",
      location: "Thane, Mumbai",
      offsetClass: "md:translate-y-4",
    },
    {
      parent: "Vikram Malhotra",
      child: "Father of Kabir (Age 8)",
      quote:
        "MediConnect is without question the most organized children’s hospital in Mumbai. Clean rooms, transparent billing with zero surprise fees, and doctors who truly listen to parents.",
      location: "Juhu, Mumbai",
      offsetClass: "md:-translate-y-2",
    },
  ];

  const faqs = [
    {
      question: "How does the WhatsApp appointment reminder system work?",
      answer:
        "Once your appointment is confirmed, our automated WhatsApp integration sends you a calendar notification. You will receive an automated 24-hour reminder with parking and token details, plus a 2-hour reminder on consultation day. You can confirm or reschedule right from WhatsApp.",
    },
    {
      question: "What should I do in case of a nighttime pediatric emergency?",
      answer:
        "Our 24/7 Pediatric Emergency Unit at Bandra West is always staffed by on-duty pediatric intensivists and pediatric nurses. No prior appointment is required for emergency triage. You can also dial our emergency helpline directly: +91 22 2654 8900.",
    },
    {
      question: "Are your vaccination schedules compliant with Indian Academy of Pediatrics (IAP)?",
      answer:
        "Yes, our immunization center strictly adheres to both IAP (Indian Academy of Pediatrics) and WHO guidelines. We maintain cold-chain verified vaccines with digital batch tracking and automatic WhatsApp booster reminders.",
    },
    {
      question: "What cashless insurance and TPA options are accepted?",
      answer:
        "We support all major health insurance providers (Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa) with on-spot TPA desk assistance for cashless pediatric admissions.",
    },
    {
      question: "What is your consultation fee structure?",
      answer:
        "Standard pediatric general OPD consultation is ₹600. Follow-up reviews within 7 days are provided at concessional rates or complimentary depending on the treatment plan.",
    },
  ];

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground scroll-smooth relative">
        {/* Scroll Progress Bar Fixed at Top */}
        <ScrollProgress />

        {/* 1. STICKY TOP NAVIGATION - MATCHING TARGET DESIGN */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/90 backdrop-blur-md shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <MediConnectLogo className="h-11 w-11 transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 leading-tight">
                  MediConnect
                </span>
                <span className="text-xs font-semibold text-teal-700 tracking-wide leading-none">
                  Children&apos;s Hospital
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
              <a href="#services" className="hover:text-teal-700 transition-colors">
                Specialities
              </a>
              <a href="#doctors" className="hover:text-teal-700 transition-colors">
                Our Doctors
              </a>
              <a href="#testimonials" className="hover:text-teal-700 transition-colors">
                Parent Stories
              </a>
              <a href="#contact" className="hover:text-teal-700 transition-colors">
                Contact
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs px-4 h-9 font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Link href="/login">
                  <User className="h-3.5 w-3.5 text-slate-600" />
                  <span>Staff Portal</span>
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsBookingModalOpen(true)}
                className="rounded-full bg-[#f1592a] hover:bg-[#e0481d] text-white font-semibold text-xs px-5 h-9 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Book a Visit
              </Button>
            </div>
          </div>
        </header>

        {/* 2. HERO SECTION - ENHANCED WITH POLISHED VISUALS */}
        <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden border-b border-slate-200/60">
          {/* Subtle Ken Burns Zoom on Background Image */}
          {shouldReduceMotion ? (
            <div
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: "url('/images/hospital-hero.jpg')",
                backgroundPosition: "center right",
              }}
            />
          ) : (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: "url('/images/hospital-hero.jpg')",
                backgroundPosition: "center right",
              }}
            />
          )}

          {/* Soft Left-to-Right Ambient Gradient Overlay for Maximum Text Contrast & Clarity */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent sm:via-white/70 lg:via-white/35 pointer-events-none" />

          {/* Floating Glass Badges on Desktop */}
          {!shouldReduceMotion && (
            <>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl border border-white/80 absolute right-14 top-20 z-20 pointer-events-none select-none"
              >
                <div className="h-8 w-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">NABH Accredited</p>
                  <p className="text-[10px] text-teal-700 font-semibold">Excellence in Pediatric Care</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl border border-white/80 absolute right-10 bottom-24 z-20 pointer-events-none select-none"
              >
                <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">4.9 ★ Parent Rating</p>
                  <p className="text-[10px] text-slate-500 font-semibold">1,200+ Verified Reviews</p>
                </div>
              </motion.div>
            </>
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full z-10">
            <div className="max-w-xl space-y-6 text-left">
              {/* Frosted Rounded Pill Badge */}
              <FadeUp delay={0.1}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 border border-teal-200/80 text-teal-800 text-xs font-semibold backdrop-blur-md shadow-xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <span>NABH Accredited Pediatric Center</span>
                </div>
              </FadeUp>

              {/* Main Headline with Word Reveal Animation */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                <WordReveal text="A Healthier" delay={0.15} /> <br />
                <WordReveal text="Tomorrow" delay={0.35} /> <br />
                <motion.span
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="text-[#0d9488] inline-flex items-center gap-2"
                >
                  Starts Here.
                  {/* Cute orange heart outline matching target design */}
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-[#f1592a] inline-block -mt-1 ml-1 transform rotate-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </motion.span>
              </h1>

              {/* Subtitle */}
              <FadeUp delay={0.65}>
                <p className="text-base sm:text-lg text-slate-600 max-w-md font-normal leading-relaxed">
                  Compassionate doctors, advanced care and a warm, child-friendly environment for every child.
                </p>
              </FadeUp>

              {/* Signature CTA Pill Button with Arrow Circle & Pulsing Glow */}
              <FadeUp delay={0.8} className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="group relative inline-flex items-center gap-3 pl-6 pr-2 py-2 rounded-full bg-gradient-to-r from-[#ff5a36] to-[#f1592a] hover:from-[#f14d27] hover:to-[#df461b] text-white font-semibold text-base shadow-xl shadow-orange-500/25 transition-all w-fit hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-4 ring-orange-500/20"
                >
                  <Calendar className="h-5 w-5 text-white/95" />
                  <span>Book a Visit</span>
                  <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center text-[#f1592a] shadow-xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </div>
                </button>
              </FadeUp>

              {/* Mouse Scroll Indicator */}
              <FadeUp delay={0.95} className="pt-8 sm:pt-10">
                <a
                  href="#services"
                  className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors group"
                >
                  <div className="w-5 h-8 rounded-full border-2 border-slate-400/80 flex items-start justify-center p-1 group-hover:border-slate-600 transition-colors">
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-1 h-2 bg-slate-500 group-hover:bg-slate-700 rounded-full"
                    />
                  </div>
                  <span>Scroll to discover</span>
                </a>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* 2.5 TRUST INDICATORS STRIP - WITH COUNT-UP NUMBERS & MATCHING ICONS */}
        <section className="py-7 bg-slate-50/90 border-b border-border/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center" staggerDelay={0.12}>
              {/* Stat 1 */}
              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-teal-600">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUp value="45,000+" />
                </div>
                <div className="text-xs text-muted-foreground font-medium">Children Treated</div>
              </StaggerItem>

              {/* Stat 2 */}
              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-teal-700">
                  <CountUp value="4.9 ★" />
                </div>
                <div className="text-xs text-muted-foreground font-medium">1,200+ Parent Reviews</div>
              </StaggerItem>

              {/* Stat 3 */}
              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-sky-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  <CountUp value="15 Mins" />
                </div>
                <div className="text-xs text-muted-foreground font-medium">Average OPD Wait Time</div>
              </StaggerItem>

              {/* Stat 4 */}
              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-[#f1592a]">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#f1592a]">24/7 Helpline</div>
                <div className="text-xs text-muted-foreground font-medium">(022) 2654 8900</div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* 3. TRUST STATS STRIP - PRIMARY TEAL WITH COUNT-UP & ICONS */}
        <section className="py-10 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center" staggerDelay={0.12}>
              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-accent">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div className="text-3xl font-extrabold text-accent">
                  <CountUp value="18+" />
                </div>
                <div className="text-xs font-medium text-primary-foreground/90">
                  Super-Specialist Pediatricians
                </div>
              </StaggerItem>

              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-white/90">
                  <Syringe className="h-5 w-5" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  <CountUp value="99.4%" />
                </div>
                <div className="text-xs font-medium text-primary-foreground/90">
                  Timely Vaccination Coverage
                </div>
              </StaggerItem>

              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-accent">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-3xl font-extrabold text-accent">24/7</div>
                <div className="text-xs font-medium text-primary-foreground/90">
                  Pediatric Emergency Triage Desk
                </div>
              </StaggerItem>

              <StaggerItem className="space-y-1">
                <div className="flex justify-center mb-1 text-white/90">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-3xl font-extrabold text-white">
                  <CountUp value="100%" />
                </div>
                <div className="text-xs font-medium text-primary-foreground/90">
                  Digital WhatsApp Appointment Sync
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* Heartbeat ECG Line Divider */}
        <ECGDivider />

        {/* 4. SERVICES & SPECIALTIES - WITH SPOTLIGHT, PASTEL ACCENTS & HOVER EFFECTS */}
        <section id="services" className="py-20 bg-muted/20 scroll-mt-16 relative">
          <AmbientBackground />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeUp className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <Badge variant="outline" className="text-xs font-semibold">
                Pediatric Excellence
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Comprehensive Medical Care Tailored for Children
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                From routine newborn milestones to complex childhood pulmonary and allergic conditions.
              </p>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <StaggerItem key={service.title}>
                    <SpotlightCard
                      spotlightColor={service.accent.glow}
                      className={`h-full rounded-2xl border border-border/80 bg-card shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border-t-4 ${service.accent.border}`}
                    >
                      <Card className="border-0 shadow-none bg-transparent h-full flex flex-col justify-between">
                        <CardHeader className="space-y-2 pb-2">
                          <div className="flex items-center justify-between">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${service.accent.bg}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                              {service.tag}
                            </Badge>
                          </div>
                          <CardTitle className="text-base font-bold text-foreground pt-1">
                            {service.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {service.desc}
                          </p>
                          <div className="pt-1 flex items-center gap-1 text-xs font-bold text-teal-700 opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition-all duration-300">
                            <span>Learn more</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </CardContent>
                      </Card>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>

        {/* Heartbeat ECG Line Divider */}
        <ECGDivider />

        {/* 5. DOCTORS & SPECIALISTS - WITH STAGGER, OPTIONAL PHOTO SUPPORT & HORIZONTAL SWIPE ON MOBILE */}
        <section id="doctors" className="py-20 border-t border-border/80 scroll-mt-16 relative">
          <AmbientBackground />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeUp className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <Badge variant="outline" className="text-xs font-semibold">
                Clinical Team
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Meet Our Senior Pediatric Consultants
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Trained at premier medical institutes with dedicated careers focused exclusively on pediatric medicine.
              </p>
            </FadeUp>

            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-4 max-md:-mx-4 max-md:px-4"
              staggerDelay={0.1}
            >
              {doctors.map((doctor) => (
                <StaggerItem
                  key={doctor.name}
                  className="max-md:min-w-[280px] max-md:w-[280px] max-md:snap-center"
                >
                  <Card className="h-full shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 bg-card border border-border/80 flex flex-col justify-between group">
                    <CardHeader className="space-y-1.5 pb-2">
                      {/* Avatar Frame with Optional Photo Support */}
                      {doctor.image ? (
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden mb-2 border-2 border-teal-200 shadow-sm">
                          <img
                            src={doctor.image}
                            alt={doctor.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 flex items-center justify-center text-primary font-bold text-lg mb-2 shadow-2xs group-hover:scale-105 transition-transform duration-300">
                          {doctor.name.split(" ")[1]?.[0] || "D"}
                        </div>
                      )}

                      <CardTitle className="text-base font-bold text-foreground">
                        {doctor.name}
                      </CardTitle>
                      <p className="text-xs font-semibold text-primary">{doctor.role}</p>
                      <Badge variant="secondary" className="text-[10px] w-fit font-medium">
                        <CountUp value={doctor.experience} />
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <p className="text-muted-foreground font-mono text-[11px]">
                        {doctor.qualifications}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {doctor.specialty}
                      </p>

                      {/* Hover CTA: Book with Doctor */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsBookingModalOpen(true)}
                          className="w-full py-1.5 px-3 rounded-lg bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white font-semibold text-xs transition-colors duration-200 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Book with {doctor.name.split(" ")[1] || "Doctor"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Heartbeat ECG Line Divider */}
        <ECGDivider />

        {/* 6. PARENT TESTIMONIALS - VERTICAL OFFSET, ANIMATED STARS & SWIPE ON MOBILE */}
        <section id="testimonials" className="py-20 bg-muted/30 border-t border-border/80 scroll-mt-16 relative overflow-hidden">
          <AmbientBackground />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <FadeUp className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <Badge variant="coral" className="text-xs font-semibold">
                Parent Stories
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Trusted by Over 45,000 Families Across Mumbai
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Real experiences from parents whose children received care at MediConnect.
              </p>
            </FadeUp>

            <StaggerContainer
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-4 max-md:-mx-4 max-md:px-4"
              staggerDelay={0.12}
            >
              {testimonials.map((t) => (
                <StaggerItem
                  key={t.parent}
                  className={`max-md:min-w-[290px] max-md:w-[290px] max-md:snap-center ${t.offsetClass}`}
                >
                  <Card className="h-full shadow-xs hover:shadow-xl transition-all duration-300 bg-card border border-border/80 relative overflow-hidden flex flex-col justify-between">
                    {/* Large Decorative Soft Quote Mark */}
                    <div className="absolute top-2 right-4 text-6xl text-teal-200/50 font-serif leading-none select-none pointer-events-none">
                      &ldquo;
                    </div>

                    <CardContent className="pt-6 space-y-4 relative z-10">
                      {/* Animated Star Rating */}
                      <div className="flex text-amber-500 gap-1 text-sm">
                        {[0, 1, 2, 3, 4].map((starIdx) => (
                          <motion.span
                            key={starIdx}
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.4 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * starIdx, duration: 0.3 }}
                          >
                            ★
                          </motion.span>
                        ))}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        &ldquo;{t.quote}&rdquo;
                      </p>

                      <div className="pt-3 border-t border-border/60">
                        <p className="text-xs font-bold text-foreground">{t.parent}</p>
                        <p className="text-[11px] text-primary font-medium">{t.child}</p>
                        <p className="text-[10px] text-muted-foreground">{t.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* Heartbeat ECG Line Divider */}
        <ECGDivider />

        {/* 7. FAQ ACCORDION - WITH ACCENT STYLING & WHATSAPP HELP CARD */}
        <section id="faqs" className="py-20 border-t border-border/80 scroll-mt-16 relative">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeUp className="text-center mb-12 space-y-2">
              <Badge variant="outline" className="text-xs font-semibold">
                Questions &amp; Answers
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Everything you need to know about clinic visits, appointments, and WhatsApp updates.
              </p>
            </FadeUp>

            <FadeUp delay={0.2}>
              <Accordion type="single" collapsible className="w-full space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.question}
                    value={`item-${index}`}
                    className="border border-border/70 rounded-xl px-4 data-[state=open]:border-l-4 data-[state=open]:border-l-teal-600 data-[state=open]:bg-teal-50/40 transition-all duration-200"
                  >
                    <AccordionTrigger className="text-xs sm:text-sm font-semibold text-foreground hover:no-underline py-4 text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>

            {/* "Still Have Questions? Chat with us on WhatsApp" Card */}
            <FadeUp delay={0.3} className="mt-8">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-teal-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25">
                    <MessageSquare className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Still have questions?</h4>
                    <p className="text-xs text-slate-600">Our pediatric helpline desk is available directly on WhatsApp.</p>
                  </div>
                </div>
                <a
                  href="https://wa.me/919820011000?text=Hello%20MediConnect%2C%20I%20have%20a%20question%20about%20your%20pediatric%20services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <MessageSquare className="h-3.5 w-3.5 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* Heartbeat ECG Line Divider */}
        <ECGDivider />

        {/* 8. CONTACT & LOCATION - WITH EMBEDDED MAP & LIVE OPERATING STATUS */}
        <section id="contact" className="py-20 bg-muted/20 border-t border-border/80 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <FadeUp className="space-y-6">
                <div>
                  <Badge variant="outline" className="text-xs font-semibold mb-2">
                    Hospital Location &amp; Timings
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    MediConnect Children&apos;s Hospital
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Centrally located in Bandra West with dedicated pediatric valet parking and wheelchair access.
                  </p>
                </div>

                {/* Live Operating Hours Status Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-2xs">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span>{hospitalStatus.text}</span>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Address:</span>
                      <span className="text-muted-foreground">
                        MediConnect Medical Tower, Plot 42, S.V. Road, Near Bandra Station, Bandra West, Mumbai, Maharashtra 400050
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Phone &amp; WhatsApp:</span>
                      <span className="text-muted-foreground">
                        OPD Appointments:{" "}
                        <a href="tel:+912226548900" className="text-teal-700 hover:underline font-semibold">
                          +91 22 2654 8900
                        </a>{" "}
                        | WhatsApp Desk:{" "}
                        <a
                          href="https://wa.me/919820011000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:underline font-semibold"
                        >
                          +91 98200 11000
                        </a>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Operating Hours:</span>
                      <span className="text-muted-foreground">
                        Outpatient Consultations: Monday &ndash; Saturday, 8:00 AM &ndash; 9:00 PM<br />
                        Pediatric Emergency &amp; Neonatal Triage: Open 24 Hours, 365 Days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-foreground block">Clinical Inquiries:</span>
                      <a href="mailto:care@mediconnect.in" className="text-muted-foreground hover:underline">
                        care@mediconnect.in
                      </a>
                    </div>
                  </div>
                </div>
              </FadeUp>

              {/* Embedded Google Maps Card */}
              <FadeUp delay={0.2}>
                <Card className="p-4 sm:p-5 bg-card border-border shadow-md rounded-2xl overflow-hidden space-y-3">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border shadow-inner bg-slate-100">
                    <iframe
                      title="MediConnect Hospital Location"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.4284562098056!2d72.83416037583486!3d19.055866182144708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c91726a7e0a1%3A0xaecab1e26b1a7d60!2sSwami%20Vivekanand%20Rd%2C%20Bandra%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1714000000000!5m2!1sen!2sin"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        MediConnect Pediatric Medical Tower
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        S.V. Road, Bandra West, Mumbai 400050
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs rounded-xl hover:bg-slate-50 shrink-0"
                    >
                      <a
                        href="https://maps.google.com/?q=Bandra+West+Mumbai"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    </Button>
                  </div>
                </Card>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* Soft Wave Divider Above Footer */}
        <div className="w-full overflow-hidden leading-none text-card -mb-1 pointer-events-none select-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-8 text-card fill-current opacity-60"
          >
            <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* 9. FOOTER */}
        <footer className="border-t border-border py-12 bg-card text-card-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-border/80 text-xs">
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    MC
                  </div>
                  <span className="font-bold text-sm tracking-tight text-foreground">
                    MediConnect
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Integrated Pediatric Healthcare, Clinical CRM, and WhatsApp Patient Engagement Platform.
                </p>
                <div className="text-[11px] text-muted-foreground">
                  Reg. No: MH-BOM-MED-2026-9812
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Clinical Services
                </p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Pediatric OPD Consultation</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Neonatal Intensive Care (NICU)</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Childhood Immunization</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Pediatric Pulmonology &amp; Asthma</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Growth &amp; Nutrition Assessments</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Patient Resources
                </p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(true)}
                      className="hover:text-teal-700 text-left cursor-pointer transition-colors"
                    >
                      Book Appointment
                    </button>
                  </li>
                  <li>
                    <a href="#faqs" className="hover:text-teal-700 transition-colors">
                      Patient FAQs
                    </a>
                  </li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Emergency Triage Guidelines</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">IAP Vaccination Schedule</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Cashless Insurance TPAs</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Hospital Administration
                </p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>
                    <Link href="/login" className="text-primary font-semibold hover:underline">
                      Staff &amp; Doctor Login →
                    </Link>
                  </li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Clinical Audit Log</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Privacy &amp; Data Security Notice</li>
                  <li className="hover:text-teal-700 transition-colors cursor-pointer">Patient Consent Framework</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} MediConnect Children&apos;s Hospital. All rights reserved.</p>
              <p>Designed for Indian Pediatric Healthcare • E.164 WhatsApp Compliant • NABH Certified</p>
            </div>
          </div>
        </footer>

        {/* Floating Book a Visit + WhatsApp Buttons (Visible after scrolling past hero) */}
        <FloatingCTA onOpenBooking={() => setIsBookingModalOpen(true)} />

        {/* Interactive Appointment Booking Modal */}
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      </div>
    </SmoothScrollProvider>
  );
}
