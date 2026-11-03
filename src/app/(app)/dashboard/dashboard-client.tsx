"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Calendar,
  Stethoscope,
  MessageSquare,
  Baby,
  Activity,
  ChevronDown,
  ChevronRight,
  Plus,
  Download,
  Check,
  Clock,
  AlertTriangle,
  Receipt,
  Inbox,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AnalyticsSummary } from "@/lib/analytics-data";
import { downloadCSV } from "@/lib/csv-export";
import type { SessionUser } from "@/lib/auth";
import type { PatientDetailed } from "@/lib/patients-data";
import type { AppointmentRecord } from "@/app/actions/appointments";

interface DashboardClientProps {
  user: SessionUser | null;
  analytics: AnalyticsSummary;
  patients?: PatientDetailed[];
  appointments?: AppointmentRecord[];
}

// Mini Sparkline Component for KPI cards matching target design
function MiniSparkline({ color, points }: { color: string; points: number[] }) {
  const data = points.map((v, i) => ({ i, v }));
  const id = React.useId().replace(/:/g, "");
  return (
    <div className="h-9 w-full mt-2 -mb-2 overflow-hidden pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type RangeKey = "7d" | "14d" | "30d" | "quarter";

interface RangeConfig {
  id: RangeKey;
  label: string;
  totalVisits: number;
  visitsDelta: string;
  uniqueChildren: number;
  childrenDelta: string;
  appointments: number;
  appointmentsDelta: string;
  collections: string;
  collectionsDelta: string;
  whatsappSent: number;
  whatsappDelivery: string;
  sparkVisits: number[];
  sparkChildren: number[];
  sparkAppts: number[];
  sparkRevenue: number[];
  sparkWhatsapp: number[];
  opdTrend: Array<{ date: string; total: number; unique: number }>;
  revenueChannels: Array<{ channel: string; amount: number; label: string; fill: string }>;
}

const RANGE_METRICS: Record<RangeKey, RangeConfig> = {
  "7d": {
    id: "7d",
    label: "Last 7 Days",
    totalVisits: 38,
    visitsDelta: "↗ +9%",
    uniqueChildren: 28,
    childrenDelta: "↗ +6%",
    appointments: 9,
    appointmentsDelta: "↗ +3%",
    collections: "₹ 16,400",
    collectionsDelta: "↗ +11%",
    whatsappSent: 34,
    whatsappDelivery: "94% delivery",
    sparkVisits: [18, 22, 19, 25, 24, 28, 38],
    sparkChildren: [14, 17, 15, 20, 19, 22, 28],
    sparkAppts: [2, 3, 2, 4, 3, 5, 9],
    sparkRevenue: [8, 10, 9, 12, 11, 14, 16.4],
    sparkWhatsapp: [15, 18, 17, 22, 20, 26, 34],
    opdTrend: [
      { date: "Oct 24", total: 14, unique: 10 },
      { date: "Oct 25", total: 18, unique: 12 },
      { date: "Oct 26", total: 22, unique: 15 },
      { date: "Oct 27", total: 26, unique: 19 },
      { date: "Oct 28", total: 31, unique: 22 },
      { date: "Oct 29", total: 35, unique: 25 },
      { date: "Oct 30", total: 38, unique: 28 },
    ],
    revenueChannels: [
      { channel: "Cash", amount: 8.2, label: "₹8.2K", fill: "#0d9488" },
      { channel: "UPI", amount: 4.8, label: "₹4.8K", fill: "#0284c7" },
      { channel: "Card", amount: 2.1, label: "₹2.1K", fill: "#8b5cf6" },
      { channel: "Razorpay", amount: 1.3, label: "₹1.3K", fill: "#f97316" },
    ],
  },
  "14d": {
    id: "14d",
    label: "Last 14 Days",
    totalVisits: 64,
    visitsDelta: "↗ +14%",
    uniqueChildren: 46,
    childrenDelta: "↗ +10%",
    appointments: 16,
    appointmentsDelta: "↗ +8%",
    collections: "₹ 29,800",
    collectionsDelta: "↗ +16%",
    whatsappSent: 58,
    whatsappDelivery: "93% delivery",
    sparkVisits: [16, 18, 22, 20, 25, 28, 32, 30, 36, 40, 48, 56, 60, 64],
    sparkChildren: [12, 14, 17, 15, 19, 21, 24, 23, 27, 30, 36, 40, 43, 46],
    sparkAppts: [3, 4, 3, 5, 4, 6, 7, 6, 8, 9, 11, 13, 14, 16],
    sparkRevenue: [12, 14, 16, 15, 18, 20, 22, 21, 24, 26, 27, 28, 29, 29.8],
    sparkWhatsapp: [20, 24, 26, 28, 32, 35, 38, 42, 45, 48, 51, 54, 56, 58],
    opdTrend: [
      { date: "Oct 17", total: 18, unique: 12 },
      { date: "Oct 19", total: 24, unique: 16 },
      { date: "Oct 21", total: 28, unique: 20 },
      { date: "Oct 23", total: 34, unique: 23 },
      { date: "Oct 25", total: 42, unique: 29 },
      { date: "Oct 27", total: 51, unique: 36 },
      { date: "Oct 29", total: 58, unique: 41 },
      { date: "Oct 30", total: 64, unique: 46 },
    ],
    revenueChannels: [
      { channel: "Cash", amount: 15.6, label: "₹15.6K", fill: "#0d9488" },
      { channel: "UPI", amount: 8.4, label: "₹8.4K", fill: "#0284c7" },
      { channel: "Card", amount: 3.8, label: "₹3.8K", fill: "#8b5cf6" },
      { channel: "Razorpay", amount: 2.0, label: "₹2.0K", fill: "#f97316" },
    ],
  },
  "30d": {
    id: "30d",
    label: "Last 30 Days",
    totalVisits: 124,
    visitsDelta: "↗ +12%",
    uniqueChildren: 86,
    childrenDelta: "↗ +8%",
    appointments: 28,
    appointmentsDelta: "↗ +4%",
    collections: "₹ 48,520",
    collectionsDelta: "↗ +18%",
    whatsappSent: 96,
    whatsappDelivery: "92% delivery",
    sparkVisits: [10, 14, 18, 24, 22, 28, 32, 36, 42, 48, 54, 60],
    sparkChildren: [8, 11, 14, 18, 17, 21, 24, 28, 32, 36, 41, 46],
    sparkAppts: [5, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, 12],
    sparkRevenue: [32, 36, 34, 40, 38, 44, 42, 48, 45, 52, 49, 56],
    sparkWhatsapp: [60, 65, 62, 70, 68, 75, 72, 80, 78, 85, 82, 90],
    opdTrend: [
      { date: "Oct 02", total: 16, unique: 10 },
      { date: "Oct 06", total: 24, unique: 16 },
      { date: "Oct 10", total: 29, unique: 19 },
      { date: "Oct 14", total: 22, unique: 14 },
      { date: "Oct 18", total: 34, unique: 22 },
      { date: "Oct 22", total: 38, unique: 24 },
      { date: "Oct 26", total: 31, unique: 19 },
      { date: "Oct 30", total: 42, unique: 27 },
    ],
    revenueChannels: [
      { channel: "Cash", amount: 28.4, label: "₹28.4K", fill: "#0d9488" },
      { channel: "UPI", amount: 12.6, label: "₹12.6K", fill: "#0284c7" },
      { channel: "Card", amount: 6.5, label: "₹6.5K", fill: "#8b5cf6" },
      { channel: "Razorpay", amount: 4.9, label: "₹4.9K", fill: "#f97316" },
    ],
  },
  quarter: {
    id: "quarter",
    label: "This Quarter",
    totalVisits: 382,
    visitsDelta: "↗ +22%",
    uniqueChildren: 248,
    childrenDelta: "↗ +19%",
    appointments: 84,
    appointmentsDelta: "↗ +15%",
    collections: "₹ 148,900",
    collectionsDelta: "↗ +25%",
    whatsappSent: 290,
    whatsappDelivery: "95% delivery",
    sparkVisits: [24, 28, 30, 34, 38, 42, 40, 46, 50, 52, 58, 62],
    sparkChildren: [18, 21, 24, 26, 30, 32, 31, 36, 40, 42, 46, 50],
    sparkAppts: [12, 14, 15, 18, 20, 22, 21, 24, 26, 28, 30, 32],
    sparkRevenue: [40, 45, 50, 56, 62, 70, 75, 82, 90, 105, 120, 148],
    sparkWhatsapp: [80, 95, 110, 130, 150, 175, 190, 210, 235, 260, 275, 290],
    opdTrend: [
      { date: "Aug W1", total: 48, unique: 32 },
      { date: "Aug W3", total: 62, unique: 41 },
      { date: "Sep W1", total: 75, unique: 50 },
      { date: "Sep W3", total: 84, unique: 56 },
      { date: "Oct W1", total: 92, unique: 60 },
      { date: "Oct W3", total: 105, unique: 68 },
      { date: "Oct W4", total: 118, unique: 76 },
      { date: "Oct End", total: 124, unique: 80 },
    ],
    revenueChannels: [
      { channel: "Cash", amount: 84.5, label: "₹84.5K", fill: "#0d9488" },
      { channel: "UPI", amount: 39.2, label: "₹39.2K", fill: "#0284c7" },
      { channel: "Card", amount: 16.8, label: "₹16.8K", fill: "#8b5cf6" },
      { channel: "Razorpay", amount: 8.4, label: "₹8.4K", fill: "#f97316" },
    ],
  },
};

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "Last 7 Days" },
  { id: "14d", label: "Last 14 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "quarter", label: "This Quarter" },
];

export function DashboardClient({
  user,
  analytics: _analytics,
  patients: _patients,
  appointments: _appointments,
}: DashboardClientProps) {
  const initialRole = user?.role || "admin";
  const [activeRole, setActiveRole] = useState<"admin" | "doctor" | "receptionist">(initialRole);

  const [prevUserRole, setPrevUserRole] = useState(user?.role);
  if (user?.role !== prevUserRole) {
    setPrevUserRole(user?.role);
    setActiveRole(user?.role || "admin");
  }

  const [selectedRange, setSelectedRange] = useState<RangeKey>("30d");
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const rangeMenuRef = useRef<HTMLDivElement>(null);

  const currentMetrics = RANGE_METRICS[selectedRange];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rangeMenuRef.current && !rangeMenuRef.current.contains(event.target as Node)) {
        setRangeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute greeting name
  const rawFullName = user?.fullName || (activeRole === "doctor" ? "Dr. Rahul Deshpande" : activeRole === "receptionist" ? "Kavita S." : "Dr. Ananya Roy");

  const greetingName = React.useMemo(() => {
    if (activeRole === "doctor") {
      return rawFullName.includes("Rahul") ? "Dr. Rahul" : rawFullName.split(" ")[0].startsWith("Dr.") ? `${rawFullName.split(" ")[0]} ${rawFullName.split(" ")[1] || ""}`.trim() : `Dr. ${rawFullName.split(" ")[0]}`;
    }
    if (activeRole === "receptionist") {
      return rawFullName.split(" ")[0]; // "Kavita"
    }
    // Admin
    return rawFullName.includes("Ananya") ? "Dr. Ananya" : rawFullName.split(" ")[0];
  }, [rawFullName, activeRole]);

  // Role Metadata & Actions
  const roleConfig = {
    admin: {
      title: "Admin Mode",
      badgeText: "Administrator • Full Access",
      badgeClass: "bg-purple-100/80 text-purple-800 border-purple-200/80",
      ctaLabel: "Register New Visit",
      ctaHref: "/patients/new",
    },
    doctor: {
      title: "Doctor Mode",
      badgeText: "Doctor Mode • Clinical Console",
      badgeClass: "bg-teal-100/80 text-teal-800 border-teal-200/80",
      ctaLabel: "Register Clinical Visit",
      ctaHref: "/patients",
    },
    receptionist: {
      title: "Reception Mode",
      badgeText: "Reception Mode • Front Desk Operations",
      badgeClass: "bg-orange-100/80 text-orange-800 border-orange-200/80",
      ctaLabel: "Register Walk-in Patient",
      ctaHref: "/patients/new",
    },
  }[activeRole];

  // CSV Export Handler for Payment Channels
  const handleExportRevenue = () => {
    const headers = ["Payment Channel", "Amount (in Thousands INR)", "Display Label", "Range Filter"];
    const rows = currentMetrics.revenueChannels.map((r) => [
      r.channel,
      r.amount,
      r.label,
      currentMetrics.label,
    ]);
    downloadCSV(`MediConnect_Revenue_Breakdown_${selectedRange.toUpperCase()}_2026`, headers, rows);
  };

  // Appointment Status breakdown dataset matching Image 2
  const appointmentBreakdown = [
    { status: "Confirmed", count: 12, percent: "43%", color: "#00b4d8" },
    { status: "Completed", count: 8, percent: "29%", color: "#0d9488" },
    { status: "Pending", count: 4, percent: "14%", color: "#f59e0b" },
    { status: "Cancelled", count: 3, percent: "11%", color: "#f43f5e" },
    { status: "No Show", count: 1, percent: "3%", color: "#94a3b8" },
  ];
  const totalAppointmentsCount = appointmentBreakdown.reduce((acc, cur) => acc + cur.count, 0);

  // Top Services by Revenue dataset matching Image 2
  const topServices = [
    { name: "General Consultation", percent: 32 },
    { name: "Vaccination (MMR/DTP)", percent: 24 },
    { name: "Nebulization", percent: 12 },
    { name: "Growth Monitoring", percent: 8 },
    { name: "Allergy Consultation", percent: 6 },
  ];

  // WhatsApp Campaign Performance dataset matching Image 2
  const campaignData = [
    { metric: "Delivered", count: 86, fill: "#0d9488" },
    { metric: "Read", count: 72, fill: "#0284c7" },
    { metric: "Failed", count: 8, fill: "#f43f5e" },
    { metric: "Pending", count: 2, fill: "#f59e0b" },
  ];

  // Doctor Patient Queue Dataset
  const doctorPatientQueue = [
    {
      token: "Token #1",
      code: "PT-2026-000001",
      name: "Aarav Sharma",
      age: "5y Male",
      guardian: "Rajesh Sharma",
      phone: "+91 98200 11001",
      complaint: "Acute wheezing, dry cough, mild fever (38.2°C)",
      allergy: "Peanuts",
      status: "With Doctor",
      statusColor: "bg-teal-50 text-teal-700 border-teal-200",
      time: "10:00 AM",
    },
    {
      token: "Token #2",
      code: "PT-2026-000003",
      name: "Rudra Patel",
      age: "4y Male",
      guardian: "Priya Patel",
      phone: "+91 98200 11002",
      complaint: "Persistent cold, earache, routine developmental checkup",
      allergy: "None",
      status: "Waiting (Next)",
      statusColor: "bg-amber-50 text-amber-700 border-amber-200",
      time: "10:30 AM",
    },
    {
      token: "Token #3",
      code: "PT-2026-000005",
      name: "Vihaan Verma",
      age: "6y Male",
      guardian: "Amitabh Verma",
      phone: "+91 98200 11003",
      complaint: "Scheduled MMR booster vaccination, weight check",
      allergy: "Penicillin",
      status: "Waiting",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
      time: "11:00 AM",
    },
    {
      token: "Token #4",
      code: "PT-2026-000008",
      name: "Kabir Malhotra",
      age: "8y Male",
      guardian: "Vikram Malhotra",
      phone: "+91 98200 11005",
      complaint: "Seasonal bronchial allergy, nebulization review",
      allergy: "None",
      status: "Waiting",
      statusColor: "bg-slate-100 text-slate-700 border-slate-200",
      time: "11:30 AM",
    },
    {
      token: "Token #5",
      code: "PT-2026-000002",
      name: "Ananya Sharma",
      age: "3y Female",
      guardian: "Rajesh Sharma",
      phone: "+91 98200 11001",
      complaint: "Dietary intake review & physical milestone assessment",
      allergy: "None",
      status: "Completed",
      statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      time: "09:30 AM",
    },
  ];

  // Receptionist Front Desk Appointments
  const receptionAppointments = [
    {
      time: "10:00 AM",
      token: "T-01",
      child: "Aarav Sharma (5y)",
      guardian: "Rajesh Sharma",
      phone: "+91 98200 11001",
      doctor: "Dr. Rahul Deshpande",
      department: "Pediatric Pulmonology",
      status: "Checked In",
      badge: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      time: "10:30 AM",
      token: "T-02",
      child: "Rudra Patel (4y)",
      guardian: "Priya Patel",
      phone: "+91 98200 11002",
      doctor: "Dr. Rahul Deshpande",
      department: "General Pediatrics",
      status: "Arrived / Waiting",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      time: "11:00 AM",
      token: "T-03",
      child: "Vihaan Verma (6y)",
      guardian: "Amitabh Verma",
      phone: "+91 98200 11003",
      doctor: "Dr. Ananya Roy",
      department: "Immunization Clinic",
      status: "Confirmed",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      time: "11:30 AM",
      token: "T-04",
      child: "Kabir Malhotra (8y)",
      guardian: "Vikram Malhotra",
      phone: "+91 98200 11005",
      doctor: "Dr. Rahul Deshpande",
      department: "Pediatric Allergy",
      status: "Pending Call",
      badge: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ROLE SWITCHER TRAY (FOR ADMIN TESTING OR PREVIEWS) */}
      {user?.role === "admin" && (
        <div className="flex items-center justify-between p-2.5 px-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-slate-700">Administrator Console View:</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Preview hospital dashboard from any staff perspective:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveRole("admin")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === "admin"
                  ? "bg-purple-100 text-purple-800 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("doctor")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === "doctor"
                  ? "bg-teal-100 text-teal-800 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("receptionist")}
              className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === "receptionist"
                  ? "bg-orange-100 text-orange-800 shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Reception</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP WELCOME BANNER - TAILORED ACCORDING TO USER ROLE */}
      <div className="relative rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/90 via-[#e0f7fa]/70 to-[#e8f5e9]/60 p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Greeting & Role Mode Badge */}
        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="outline"
              className={`text-[11px] font-bold py-0.5 px-2.5 rounded-full border ${roleConfig.badgeClass}`}
            >
              {roleConfig.badgeText}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
            Welcome back, {greetingName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            {activeRole === "doctor"
              ? "Your outpatient pediatric clinic is ready. 4 children waiting in queue."
              : activeRole === "receptionist"
              ? "Front desk active. 8 outpatient slots scheduled for today."
              : "Here's what's happening across hospital operations today."}
          </p>
        </div>

        {/* Center: Heartwarming Mascot Illustration & Tagline */}
        <div className="hidden lg:flex items-center gap-4 relative z-10">
          <div className="relative h-18 w-22 shrink-0 overflow-hidden rounded-xl bg-white/40 shadow-xs border border-white/60">
            <img
              src="/images/child-teddy-banner.jpg"
              alt="Mascot with Teddy Bear"
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-teal-800 tracking-wide block leading-tight">
              Healthy Kids
            </span>
            <span className="text-xs font-bold text-teal-700 tracking-wide flex items-center gap-1 leading-tight">
              Happier Tomorrows
              <span className="text-orange-500">🧡</span>
            </span>
          </div>
        </div>

        {/* Right: Date Range Dropdown & Role Primary Action CTA */}
        <div className="relative z-30 flex items-center gap-3">
          {/* Interactive Date Range Filter Dropdown */}
          <div className="relative" ref={rangeMenuRef}>
            <button
              type="button"
              onClick={() => setRangeMenuOpen((prev) => !prev)}
              aria-expanded={rangeMenuOpen}
              className="rounded-xl bg-white/95 hover:bg-white border border-slate-200/90 px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-2 transition-all hover:border-slate-300 active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>{currentMetrics.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  rangeMenuOpen ? "rotate-180 text-teal-600" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {rangeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white p-2 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                  Select Time Range
                </div>
                <div className="space-y-0.5">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedRange(opt.id);
                        setRangeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left cursor-pointer ${
                        selectedRange === opt.id
                          ? "bg-teal-50 text-[#00796b]"
                          : "text-slate-700 hover:bg-slate-100/80"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedRange === opt.id && (
                        <Check className="w-3.5 h-3.5 text-[#00796b] stroke-[2.5]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            asChild
            className="rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs px-5 py-2.5 shadow-sm shadow-teal-700/20 flex items-center gap-1.5 h-auto transition-all hover:scale-[1.02]"
          >
            <Link href={roleConfig.ctaHref}>
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{roleConfig.ctaLabel}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ========================================================
          BRANCH 1: DOCTOR DASHBOARD VIEW (CLINICAL CONSOLE)
          ======================================================== */}
      {activeRole === "doctor" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Doctor KPI Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Today's Clinical Volume */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <Stethoscope className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Today&apos;s Consultations</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">14 Visits</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    4 in Queue
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0d9488" points={[6, 8, 9, 11, 10, 13, 14]} />
            </div>

            {/* KPI 2: My Scheduled Appointments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Scheduled Slots</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">5 Slots</span>
                  <span className="text-[11px] font-bold text-sky-600 flex items-center">
                    Next: 10:30 AM
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0284c7" points={[2, 3, 4, 3, 5, 4, 5]} />
            </div>

            {/* KPI 3: Follow-ups Due */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <Baby className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Follow-ups Due</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">4 Due</span>
                  <span className="text-[11px] font-bold text-purple-600 flex items-center">
                    Asthma &amp; MMR
                  </span>
                </div>
              </div>
              <MiniSparkline color="#8b5cf6" points={[1, 3, 2, 4, 3, 4, 4]} />
            </div>

            {/* KPI 4: High Priority / Allergy Alerts */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Allergy Alerts</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-rose-700">2 Patients</span>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    Peanuts, Penicillin
                  </span>
                </div>
              </div>
              <MiniSparkline color="#f43f5e" points={[1, 1, 2, 2, 1, 2, 2]} />
            </div>
          </div>

          {/* Section: Live Clinical Consultation Queue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Today&apos;s Clinical Consultation Queue</h2>
                  <p className="text-[11px] text-slate-400">
                    Live outpatient queue for Dr. Rahul Deshpande (Pediatric Ward)
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs h-8 border-slate-200">
                <Link href="/visits">
                  View All Outpatients
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Token &amp; Time</th>
                    <th className="py-2.5 px-3">Child Patient</th>
                    <th className="py-2.5 px-3">Parent Contact</th>
                    <th className="py-2.5 px-3">Chief Complaint / Symptoms</th>
                    <th className="py-2.5 px-3">Allergies</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorPatientQueue.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-800 block">{item.token}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {item.time}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{item.name}</span>
                        <span className="text-[11px] text-slate-500">{item.age} • {item.code}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium block">{item.guardian}</span>
                        <span className="text-[10px] text-slate-400">{item.phone}</span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">{item.complaint}</p>
                      </td>
                      <td className="py-3 px-3">
                        {item.allergy !== "None" ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">
                            ⚠ {item.allergy}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-2xs">
                          <Link href="/patients">
                            Start Consultation
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Clinical Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Consultation Volume Trend */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">OPD Clinical Workload</h3>
                    <p className="text-[10px] text-slate-400">Daily pediatric patient encounters ({currentMetrics.label})</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                  124 Total Encounters
                </span>
              </div>
              <div className="h-56 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentMetrics.opdTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="docVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Clinical Consultations"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      fill="url(#docVisitsGradient)"
                      dot={{ r: 4, fill: "#0d9488", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Pediatric Specialty Breakdown */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Pediatric Specialty Encounters</h3>
                    <p className="text-[10px] text-slate-400">Clinical breakdown by specialty</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 text-xs">
                {[
                  { name: "General Pediatrics & Triage", count: 62, percent: 50, color: "bg-[#0d9488]" },
                  { name: "Pediatric Pulmonology & Allergy", count: 38, percent: 31, color: "bg-[#0284c7]" },
                  { name: "Neonatology & Well-Baby Clinic", count: 24, percent: 19, color: "bg-[#8b5cf6]" },
                  { name: "Pediatric Surgery & Orthopedics", count: 18, percent: 15, color: "bg-[#f97316]" },
                ].map((spec) => (
                  <div key={spec.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{spec.name}</span>
                      <span className="font-bold text-slate-800">{spec.count} visits ({spec.percent}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${spec.color}`} style={{ width: `${spec.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BRANCH 2: RECEPTIONIST DASHBOARD VIEW (FRONT DESK)
          ======================================================== */}
      {activeRole === "receptionist" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Receptionist KPI Cards (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Today's Appointments & Check-ins */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Today&apos;s Appointments</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">8 Slots</span>
                  <span className="text-[11px] font-bold text-teal-600 flex items-center">
                    5 Checked In
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0284c7" points={[2, 3, 4, 5, 5, 6, 8]} />
            </div>

            {/* KPI 2: Walk-in Registrations */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Walk-in Registrations</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">6 New</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    ↗ +15% Today
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0d9488" points={[1, 2, 2, 4, 3, 5, 6]} />
            </div>

            {/* KPI 3: Desk Cash/UPI Collections */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                      ₹
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Today&apos;s Desk Collections</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">₹14,800</span>
                  <span className="text-[11px] font-bold text-orange-600 flex items-center">
                    ₹2,300 Pending
                  </span>
                </div>
              </div>
              <MiniSparkline color="#f97316" points={[4, 6, 8, 9, 11, 13, 14.8]} />
            </div>

            {/* KPI 4: Pending Website Booking Enquiries */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <Inbox className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Website Enquiries</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-700">1 Pending</span>
                  <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    Action Required
                  </span>
                </div>
              </div>
              <MiniSparkline color="#8b5cf6" points={[0, 1, 0, 1, 2, 1, 1]} />
            </div>
          </div>

          {/* Section: Front Desk Appointments & Intake Schedule */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Front Desk Appointment Intake &amp; Check-ins</h2>
                  <p className="text-[11px] text-slate-400">
                    Verify patient arrival, issue tokens, and generate OPD receipts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white">
                  <Link href="/appointments">
                    View Full Calendar
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Slot Time</th>
                    <th className="py-2.5 px-3">Child &amp; Guardian</th>
                    <th className="py-2.5 px-3">Doctor Assigned</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receptionAppointments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-800 block">{item.time}</span>
                        <span className="text-[10px] text-slate-400">{item.token}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">{item.child}</span>
                        <span className="text-[11px] text-slate-500">{item.guardian} • {item.phone}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {item.doctor}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {item.department}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${item.badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild variant="outline" size="sm" className="h-7 text-xs border-slate-200">
                            <Link href="/billing">
                              <Receipt className="w-3 h-3 mr-1" />
                              Bill
                            </Link>
                          </Button>
                          <Button asChild size="sm" className="h-7 text-xs bg-[#00796b] hover:bg-[#00695c] text-white">
                            <Link href="/appointments">
                              Check In
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Front Desk Operations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Appointment Status Distribution */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Today&apos;s Slot Breakdown</h3>
                    <p className="text-[10px] text-slate-400">Total 28 appointment slots</p>
                  </div>
                </div>
              </div>

              <div className="h-48 relative flex items-center justify-center pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={appointmentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {appointmentBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800">28</span>
                  <span className="text-[10px] font-medium text-slate-400">Slots</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                {appointmentBreakdown.slice(0, 4).map((s) => (
                  <div key={s.status} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                    <span className="text-slate-600">{s.status}:</span>
                    <span className="font-bold text-slate-800">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Pending Website Enquiry Alert Card */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Inbox className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Incoming Website Booking Enquiries</h3>
                    <p className="text-[10px] text-slate-400">Public booking requests awaiting parent contact</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  1 Pending Review
                </Badge>
              </div>

              <div className="mt-4 p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Tanmay Verma (Age 2y)</span>
                    <span className="text-[11px] text-slate-600">Parent: Amitabh Verma • +91 98200 11003</span>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-md">
                    Pref Date: 2026-11-02
                  </span>
                </div>
                <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Symptoms:</span> Night cough, restless breathing, mild fever for 2 days.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Submitted via Website Booking Form</span>
                  <Button asChild size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    <Link href="/enquiries">
                      Triage &amp; Book Slot
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BRANCH 3: ADMIN DASHBOARD VIEW (EXECUTIVE & FINANCIAL)
          ======================================================== */}
      {activeRole === "admin" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Admin KPI Cards (5 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Total OPD Visits */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Total OPD Visits</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{currentMetrics.totalVisits}</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                    {currentMetrics.visitsDelta}
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0d9488" points={currentMetrics.sparkVisits} />
            </div>

            {/* KPI 2: Unique Children */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                      <Baby className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Unique Children</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{currentMetrics.uniqueChildren}</span>
                  <span className="text-[11px] font-bold text-sky-600 flex items-center">
                    {currentMetrics.childrenDelta}
                  </span>
                </div>
              </div>
              <MiniSparkline color="#0284c7" points={currentMetrics.sparkChildren} />
            </div>

            {/* KPI 3: Appointments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                      <CalendarCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Appointments</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{currentMetrics.appointments}</span>
                  <span className="text-[11px] font-bold text-purple-600 flex items-center">
                    {currentMetrics.appointmentsDelta}
                  </span>
                </div>
              </div>
              <MiniSparkline color="#8b5cf6" points={currentMetrics.sparkAppts} />
            </div>

            {/* KPI 4: Collections (INR) */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs">
                      ₹
                    </div>
                    <span className="text-xs font-semibold text-slate-700">Collections (INR)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{currentMetrics.collections}</span>
                  <span className="text-[11px] font-bold text-orange-600 flex items-center">
                    {currentMetrics.collectionsDelta}
                  </span>
                </div>
              </div>
              <MiniSparkline color="#f97316" points={currentMetrics.sparkRevenue} />
            </div>

            {/* KPI 5: WhatsApp Sent */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">WhatsApp Sent</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">{currentMetrics.whatsappSent}</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> {currentMetrics.whatsappDelivery}
                  </span>
                </div>
              </div>
              <MiniSparkline color="#10b981" points={currentMetrics.sparkWhatsapp} />
            </div>
          </div>

          {/* Section: OPD Trend Overview + Appointment Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Card (7 cols): OPD Trend Overview */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">OPD Trend Overview</h2>
                    <p className="text-[11px] text-slate-400">
                      Daily visits vs unique children ({currentMetrics.label.toLowerCase()})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                    {currentMetrics.visitsDelta} vs previous period
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentMetrics.opdTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="totalVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00b4d8" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="uniqueChildrenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, "auto"]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total Visits"
                      stroke="#00b4d8"
                      strokeWidth={2.5}
                      fill="url(#totalVisitsGradient)"
                      dot={{ r: 4, fill: "#00b4d8", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="unique"
                      name="Unique Children"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      fill="url(#uniqueChildrenGradient)"
                      dot={{ r: 4, fill: "#0284c7", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 pt-3 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b4d8]" />
                  <span>Total Visits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
                  <span>Unique Children</span>
                </div>
              </div>
            </div>

            {/* Right Card (5 cols): Appointment Status */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Appointment Status</h2>
                    <p className="text-[11px] text-slate-400">Today&apos;s schedule at a glance</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-slate-500">Today</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 pt-4">
                {/* Donut Chart with Total inside */}
                <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={appointmentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {appointmentBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">{totalAppointmentsCount}</span>
                    <span className="text-[11px] font-medium text-slate-400">Total</span>
                  </div>
                </div>

                {/* Status Legend Breakdown */}
                <div className="sm:col-span-6 space-y-2 text-xs">
                  {appointmentBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center justify-between py-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600 font-medium">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">{item.count}</span>
                        <span className="text-[11px] text-slate-400 w-8 text-right">{item.percent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Revenue, Top Services, and Campaigns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Revenue by Payment Channel */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Revenue by Payment Channel</h3>
                    <p className="text-[10px] text-slate-400">Collections in {currentMetrics.label.toLowerCase()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleExportRevenue}
                  title="Download payment channel revenue CSV"
                  className="rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <span>CSV</span>
                  <Download className="w-2.5 h-2.5 text-slate-400" />
                </button>
              </div>

              <div className="h-52 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentMetrics.revenueChannels} margin={{ top: 18, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis
                      domain={[0, "auto"]}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v) => `${v}K`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [`₹${val}K`, "Revenue"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[6, 6, 0, 0]}
                      label={{
                        position: "top",
                        formatter: (v: React.ReactNode) => `₹${v}K`,
                        fontSize: 10,
                        fontWeight: 700,
                        fill: "#334155",
                      }}
                    >
                      {currentMetrics.revenueChannels.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Card 2: Top Services by Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">Top Services by Revenue</h3>
                    <p className="text-[10px] text-slate-400">Top 5 pediatric services</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3.5 pt-4">
                {topServices.map((service) => (
                  <div key={service.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{service.name}</span>
                      <span className="font-bold text-slate-800">{service.percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#00b4d8] transition-all"
                        style={{ width: `${service.percent * 2.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: WhatsApp Campaign Performance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">WhatsApp Campaign Outreach</h3>
                    <p className="text-[10px] text-slate-400">Delivery and parent engagement</p>
                  </div>
                </div>
              </div>

              <div className="h-52 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaignData} margin={{ top: 18, right: 10, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [val, "Messages"]}
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        border: "1px solid #e2e8f0",
                        fontSize: "11px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      label={{
                        position: "top",
                        fontSize: 10,
                        fontWeight: 700,
                        fill: "#334155",
                      }}
                    >
                      {campaignData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
