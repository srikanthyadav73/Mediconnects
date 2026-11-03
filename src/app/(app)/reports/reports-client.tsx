"use client";

import React, { useState } from "react";
import {
  Download,
  Lock,
  DollarSign,
  Activity,
  FileSpreadsheet,
  Clock,
  TrendingUp,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { downloadCSV } from "@/lib/csv-export";

function MiniSparkline({ color }: { color: string }) {
  return (
    <div className="h-10 w-full mt-3 -mb-1 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path
          d="M0,16 Q18,6 36,13 T72,11 T90,6 T100,9 L100,24 L0,24 Z"
          fill={`url(#grad-${color.replace("#", "")})`}
        />
        <path
          d="M0,16 Q18,6 36,13 T72,11 T90,6 T100,9"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

interface PeriodMetrics {
  badge: string;
  totalVolume: string;
  volumeTrend: string;
  totalRevenue: string;
  revenueNote: string;
  avgWait: string;
  waitNote: string;
  satisfaction: string;
  reviewsNote: string;
  departments: Array<{
    name: string;
    visits: number;
    revenue: string;
    doctors: string;
  }>;
}

const REPORT_DATA: Record<"month" | "quarter" | "year", PeriodMetrics> = {
  month: {
    badge: "October 2026 Review",
    totalVolume: "142",
    volumeTrend: "↗ +18% MoM",
    totalRevenue: "₹78,400",
    revenueNote: "94% collected",
    avgWait: "14 Mins",
    waitNote: "Zero-wait triage",
    satisfaction: "4.9 ★",
    reviewsNote: "320 Reviews",
    departments: [
      { name: "General Pediatrics & Triage", visits: 62, revenue: "₹37,200", doctors: "Dr. Ananya Roy, Dr. Rahul D." },
      { name: "Pediatric Pulmonology & Allergy", visits: 38, revenue: "₹24,500", doctors: "Dr. Rahul Deshpande" },
      { name: "Neonatology & Well-Baby Clinic", visits: 24, revenue: "₹18,000", doctors: "Dr. Ananya Roy" },
      { name: "Pediatric Surgery & Orthopedics", visits: 18, revenue: "₹14,400", doctors: "Dr. Tanvi Shah" },
    ],
  },
  quarter: {
    badge: "Q3 2026 Review",
    totalVolume: "428",
    volumeTrend: "↗ +24% QoQ",
    totalRevenue: "₹236,500",
    revenueNote: "96% collected",
    avgWait: "15 Mins",
    waitNote: "Triage on track",
    satisfaction: "4.8 ★",
    reviewsNote: "960 Reviews",
    departments: [
      { name: "General Pediatrics & Triage", visits: 186, revenue: "₹111,600", doctors: "Dr. Ananya Roy, Dr. Rahul D." },
      { name: "Pediatric Pulmonology & Allergy", visits: 114, revenue: "₹73,500", doctors: "Dr. Rahul Deshpande" },
      { name: "Neonatology & Well-Baby Clinic", visits: 72, revenue: "₹54,000", doctors: "Dr. Ananya Roy" },
      { name: "Pediatric Surgery & Orthopedics", visits: 56, revenue: "₹44,800", doctors: "Dr. Tanvi Shah" },
    ],
  },
  year: {
    badge: "FY 2026-27 Review",
    totalVolume: "1,680",
    volumeTrend: "↗ +32% YoY",
    totalRevenue: "₹924,000",
    revenueNote: "98% collected",
    avgWait: "14 Mins",
    waitNote: "NABH compliant",
    satisfaction: "4.9 ★",
    reviewsNote: "3,840 Reviews",
    departments: [
      { name: "General Pediatrics & Triage", visits: 740, revenue: "₹444,000", doctors: "Dr. Ananya Roy, Dr. Rahul D." },
      { name: "Pediatric Pulmonology & Allergy", visits: 450, revenue: "₹292,500", doctors: "Dr. Rahul Deshpande" },
      { name: "Neonatology & Well-Baby Clinic", visits: 290, revenue: "₹217,500", doctors: "Dr. Ananya Roy" },
      { name: "Pediatric Surgery & Orthopedics", visits: 200, revenue: "₹160,000", doctors: "Dr. Tanvi Shah" },
    ],
  },
};

const PERIODS: { id: "month" | "quarter" | "year"; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

export function ReportsClient() {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const current = REPORT_DATA[period];

  const handleExportSummaryCSV = () => {
    const headers = ["Department", "Visits Completed", "Revenue Generated", "Lead Pediatricians", "Reporting Period"];
    const rows = current.departments.map((d) => [d.name, d.visits, d.revenue, d.doctors, current.badge]);
    downloadCSV(`MediConnect_Department_Reports_${period.toUpperCase()}_2026`, headers, rows);
  };

  const handleExportDepartmentCSV = (dept: (typeof current.departments)[0]) => {
    const headers = ["Department", "Visits Completed", "Revenue Generated", "Lead Pediatricians", "Reporting Period"];
    const rows = [[dept.name, dept.visits, dept.revenue, dept.doctors, current.badge]];
    downloadCSV(`MediConnect_${dept.name.replace(/[^a-zA-Z0-9]/g, "_")}_${period.toUpperCase()}_2026`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Clinical &amp; Operational Reports
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
              {current.badge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Aggregated OPD volumes, department performance, revenue collections, and WhatsApp outreach analytics.
          </p>
        </div>

        {/* Center: Pediatric Mascot & Slogan */}
        <div className="hidden lg:flex items-center gap-4 relative z-10">
          <div className="relative h-18 w-22 shrink-0 overflow-hidden rounded-2xl bg-white/70 shadow-xs border border-white">
            <img
              src="/images/child-teddy-banner.jpg"
              alt="Care Mascot with Teddy Bear"
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div className="text-left select-none">
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight block leading-tight">
              Clinical Excellence
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Data Insights <span className="text-orange-500 font-normal">📊</span>
            </span>
          </div>
        </div>

        {/* Right: CTA Action */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportSummaryCSV}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* 2. 4 SUMMARY KPI CARDS (DYNAMICALLY REACTIVE TO SELECTED PERIOD) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total OPD Volume */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {period === "month" ? "Monthly OPD Volume" : period === "quarter" ? "Quarterly OPD Volume" : "Annual OPD Volume"}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                {current.volumeTrend}
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">{current.totalVolume}</span>
            </div>
          </div>
          <MiniSparkline color="#0d9488" />
        </div>

        {/* Card 2: Total Hospital Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Hospital Collections</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {current.revenueNote}
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">{current.totalRevenue}</span>
            </div>
          </div>
          <MiniSparkline color="#10b981" />
        </div>

        {/* Card 3: Average Wait Time */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Average Wait Time</span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
                {current.waitNote}
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-sky-600">{current.avgWait}</span>
            </div>
          </div>
          <MiniSparkline color="#0284c7" />
        </div>

        {/* Card 4: Parent Satisfaction */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Parent Satisfaction</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                {current.reviewsNote}
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">{current.satisfaction}</span>
            </div>
          </div>
          <MiniSparkline color="#f59e0b" />
        </div>
      </div>

      {/* 3. DEPARTMENT WISE BREAKDOWN TABLE (DYNAMICALLY FILTERED) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pediatric Specialty Performance</h2>
            <p className="text-xs text-slate-500">
              Showing {period === "month" ? "October 2026 Monthly" : period === "quarter" ? "Q3 2026 Quarterly" : "FY 2026-27 Annual"} clinical breakdown by medical division
            </p>
          </div>

          {/* DYNAMIC PERIOD FILTER BUTTONS WITH CLEAR ACTIVE STYLES */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-slate-600">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === p.id
                    ? "bg-[#00796b] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Pediatric Department</th>
                <th className="py-4 px-5">Encounters</th>
                <th className="py-4 px-5">Collections</th>
                <th className="py-4 px-5">Attending Doctors</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody key={period} className="divide-y divide-slate-100 transition-opacity duration-200 animate-in fade-in-50">
              {current.departments.map((dept) => (
                <tr key={dept.name} className="hover:bg-slate-50/70 transition-colors text-xs">
                  <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span>{dept.name}</span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-800">{dept.visits} visits</td>
                  <td className="py-4 px-5 font-extrabold text-emerald-700">{dept.revenue}</td>
                  <td className="py-4 px-5 text-slate-600 font-medium">{dept.doctors}</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => handleExportDepartmentCSV(dept)}
                      title={`Export ${dept.name} data as CSV`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-50/50 text-[#0f766e] font-semibold text-xs transition-colors shadow-2xs group"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-teal-600" />
                      <span>Export CSV</span>
                      <ChevronRight className="h-3 w-3 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BOTTOM CONFIDENTIALITY BANNER */}
      <div className="p-3 bg-[#e8f7f4] border border-[#b2e2d8] rounded-xl flex items-center gap-2.5 text-xs text-[#0f6055] font-medium">
        <Lock className="w-4 h-4 text-[#0f766e] shrink-0" />
        <span>Statistical health summaries comply with anonymization standards and hospital administrative guidelines.</span>
      </div>
    </div>
  );
}
