"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Lock,
  Calendar,
  ArrowUpDown,
  Activity,
  FileText,
  ChevronRight,
  X,
} from "lucide-react";

interface EnrichedVisit {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string | null;
  vitals: {
    weight_kg?: number;
    height_cm?: number;
    temp_c?: number;
    spo2?: number;
    pulse_bpm?: number;
  };
  prescription: string | null;
  doctorName?: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  guardianName: string;
  guardianPhone: string;
}

interface VisitsClientProps {
  initialVisits: EnrichedVisit[];
}

// Mini SVG Sparkline
function MiniSparkline({ color }: { color: string }) {
  return (
    <div className="h-10 w-full mt-3 -mb-1 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
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

// Deterministic pastel avatar background and text color matching design
function getAvatarStyle(name: string) {
  const map: Record<string, { bg: string; text: string }> = {
    "Aarav Sharma": { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" },
    "Ananya Sharma": { bg: "bg-[#fce7f3]", text: "text-[#db2777]" },
    "Rudra Patel": { bg: "bg-[#ccfbf1]", text: "text-[#0f766e]" },
    "Vihaan Verma": { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
    "Kabir Malhotra": { bg: "bg-[#f3e8ff]", text: "text-[#7e22ce]" },
  };
  if (map[name]) return map[name];

  const styles = [
    { bg: "bg-sky-100", text: "text-sky-700" },
    { bg: "bg-pink-100", text: "text-pink-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
  ];
  const charCode = name.charCodeAt(0) || 0;
  return styles[charCode % styles.length];
}

export function VisitsClient({ initialVisits }: VisitsClientProps) {
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [filterOpen, setFilterOpen] = useState(false);

  // Doctors list
  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    initialVisits.forEach((v) => {
      if (v.doctorName) set.add(v.doctorName);
    });
    return Array.from(set);
  }, [initialVisits]);

  // Filtered visits
  const filteredVisits = useMemo(() => {
    let list = initialVisits.filter((v) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        v.patientName.toLowerCase().includes(q) ||
        v.patientCode.toLowerCase().includes(q) ||
        v.chiefComplaint.toLowerCase().includes(q) ||
        (v.diagnosis && v.diagnosis.toLowerCase().includes(q)) ||
        (v.doctorName && v.doctorName.toLowerCase().includes(q));

      const matchesDoctor = doctorFilter === "all" || v.doctorName === doctorFilter;
      return matchesSearch && matchesDoctor;
    });

    if (sortBy === "date") {
      list = [...list].sort(
        (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
      );
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.patientName.localeCompare(b.patientName));
    }
    return list;
  }, [initialVisits, search, doctorFilter, sortBy]);

  // Derived KPI metrics
  const totalVisits = initialVisits.length;
  const withVitals = initialVisits.filter(
    (v) => v.vitals.weight_kg || v.vitals.temp_c || v.vitals.spo2
  ).length;
  const vitalsRate = totalVisits > 0 ? Math.round((withVitals / totalVisits) * 100) : 100;
  const withPrescription = initialVisits.filter((v) => v.prescription).length;

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Visits &amp; Clinical Encounters
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
              {totalVisits} Recorded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Log of pediatric consultations, symptom triage, vitals observations, and prescriptions.
          </p>
        </div>

        {/* Center: Pediatric Mascot Illustration & Slogan */}
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
              Gentle
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight block leading-tight">
              Healing
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Expert
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Triage <span className="text-orange-500 font-normal">🩺</span>
            </span>
          </div>
        </div>

        {/* Right: CTA Action */}
        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Consultation Visit</span>
          </Link>
        </div>
      </div>

      {/* 2. 3 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Visits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Clinical Encounters</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ +18% <span className="font-normal text-slate-400">vs last month</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{totalVisits}</span>
            </div>
          </div>
          <MiniSparkline color="#0d9488" />
        </div>

        {/* Card 2: Vitals Recorded */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Vitals Recorded</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✓ {vitalsRate}% <span className="font-normal text-slate-400">compliance</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{withVitals}</span>
            </div>
          </div>
          <MiniSparkline color="#10b981" />
        </div>

        {/* Card 3: Prescriptions Issued */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Rx Prescriptions</span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ 100% <span className="font-normal text-slate-400">digital records</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{withPrescription}</span>
            </div>
          </div>
          <MiniSparkline color="#0284c7" />
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="relative flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child name, UHID, symptom, diagnosis, or doctor..."
            className="w-full pl-10 pr-9 text-xs h-10 rounded-xl border border-slate-200 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-slate-800 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Doctor Filter */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`w-full sm:w-auto rounded-xl border px-4 py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors ${
              doctorFilter !== "all"
                ? "bg-teal-50 border-teal-300 text-teal-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>{doctorFilter === "all" ? "Filter Doctor" : doctorFilter}</span>
            {doctorFilter !== "all" && (
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 text-xs">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                Filter by Doctor
              </span>
              <button
                onClick={() => {
                  setDoctorFilter("all");
                  setFilterOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg ${
                  doctorFilter === "all" ? "bg-teal-50 font-bold text-teal-700" : "hover:bg-slate-50"
                }`}
              >
                All Pediatricians
              </button>
              {doctorOptions.map((doc) => (
                <button
                  key={doc}
                  onClick={() => {
                    setDoctorFilter(doc);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg ${
                    doctorFilter === doc ? "bg-teal-50 font-bold text-teal-700" : "hover:bg-slate-50"
                  }`}
                >
                  {doc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => setSortBy(sortBy === "date" ? "name" : "date")}
          className="w-full sm:w-auto rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Sort by: {sortBy === "date" ? "Recent Date" : "Child Name"}</span>
        </button>
      </div>

      {/* 4. VISITS TABLE MATCHING PATIENT DIRECTORY DESIGN */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Date &amp; Time</th>
                <th className="py-4 px-5">Child / Patient ID</th>
                <th className="py-4 px-5">Chief Complaint &amp; Diagnosis</th>
                <th className="py-4 px-5">Vitals Observation</th>
                <th className="py-4 px-5">Consulting Doctor</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400">
                    No clinical encounters found matching your search.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => {
                  const avatar = getAvatarStyle(visit.patientName);
                  const initial = visit.patientName.trim()[0] || "P";
                  const dateObj = new Date(visit.visitDate);
                  const formattedDate = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={visit.id}
                      className="hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      {/* Column 1: Date & Time */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block ml-5 leading-tight mt-0.5 font-mono">
                          {formattedTime}
                        </span>
                      </td>

                      {/* Column 2: Patient with Pastel Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center font-bold text-sm shrink-0`}
                          >
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/patients/${visit.patientId}`}
                              className="font-bold text-slate-900 text-xs hover:text-teal-700 transition-colors block leading-tight"
                            >
                              {visit.patientName}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-400 block leading-tight mt-0.5">
                              {visit.patientCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Complaint & Diagnosis */}
                      <td className="py-4 px-5 max-w-xs">
                        <span className="font-semibold text-slate-800 block leading-tight truncate">
                          {visit.chiefComplaint}
                        </span>
                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5 truncate">
                          {visit.diagnosis || "Under clinical triage"}
                        </span>
                      </td>

                      {/* Column 4: Vitals Observation Tags */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {visit.vitals.weight_kg && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-medium">
                              {visit.vitals.weight_kg} kg
                            </span>
                          )}
                          {visit.vitals.temp_c && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-mono font-medium">
                              {visit.vitals.temp_c}°C
                            </span>
                          )}
                          {visit.vitals.spo2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 text-[10px] font-mono font-medium">
                              SpO₂ {visit.vitals.spo2}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Doctor */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span>{visit.doctorName || "Dr. Ananya Roy"}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block ml-5 leading-tight mt-0.5">
                          Pediatrician
                        </span>
                      </td>

                      {/* Column 6: Actions Button */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/patients/${visit.patientId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-50/50 text-[#0f766e] font-semibold text-xs transition-colors shadow-2xs group"
                        >
                          <FileText className="h-3.5 w-3.5 text-teal-600" />
                          <span>View Chart</span>
                          <ChevronRight className="h-3 w-3 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM CONFIDENTIALITY BANNER */}
      <div className="p-3 bg-[#e8f7f4] border border-[#b2e2d8] rounded-xl flex items-center gap-2.5 text-xs text-[#0f6055] font-medium">
        <Lock className="w-4 h-4 text-[#0f766e] shrink-0" />
        <span>Clinical records and pediatric chart entries are strictly protected under DPDP compliance.</span>
      </div>
    </div>
  );
}
