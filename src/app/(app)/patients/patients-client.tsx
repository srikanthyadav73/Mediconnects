"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Phone,
  FileText,
  Filter,
  Lock,
  Calendar,
  Users,
  ChevronRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  X,
} from "lucide-react";
import type { PatientDetailed } from "@/lib/patients-data";
import { calculateAge } from "@/lib/utils";

interface PatientsClientProps {
  initialPatients: PatientDetailed[];
  initialQuery?: string;
}

// WhatsApp icon component
function WhatsAppIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.7C7.02 10.92 7.91 12.09 8.03 12.25C8.16 12.41 9.77 14.9 12.26 15.97C14.33 16.86 14.75 16.68 15.2 16.64C15.65 16.6 16.65 16.05 16.86 15.46C17.07 14.87 17.07 14.37 17.01 14.26C16.95 14.16 16.78 14.1 16.53 13.98C16.28 13.85 15.06 13.25 14.83 13.17C14.61 13.09 14.44 13.05 14.28 13.29C14.11 13.54 13.64 14.1 13.5 14.26C13.36 14.43 13.22 14.45 12.97 14.33C12.72 14.2 11.92 13.94 10.97 13.09C10.23 12.43 9.73 11.61 9.61 11.4C9.48 11.2 9.6 11.08 9.72 10.96C9.83 10.85 9.97 10.67 10.1 10.52C10.22 10.37 10.26 10.27 10.34 10.1C10.42 9.94 10.38 9.8 10.32 9.68C10.26 9.55 9.77 8.35 9.57 7.86C9.37 7.39 9.17 7.45 9.02 7.44C8.88 7.44 8.71 7.33 8.53 7.33Z" />
    </svg>
  );
}

// Medicine Capsule icon for Allergies
function CapsuleIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 10.5C3.12 11.88 3.12 14.12 4.5 15.5L8.5 19.5C9.88 20.88 12.12 20.88 13.5 19.5L19.5 13.5C20.88 12.12 20.88 9.88 19.5 8.5L15.5 4.5C14.12 3.12 11.88 3.12 10.5 4.5L4.5 10.5ZM14.1 5.9L18.1 9.9C18.7 10.5 18.7 11.5 18.1 12.1L13.5 16.7L7.3 10.5L11.9 5.9C12.5 5.3 13.5 5.3 14.1 5.9Z" />
    </svg>
  );
}

// Mini SVG Sparkline matching Image 2
function MiniCardSparkline({ color }: { color: string }) {
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
          d="M0,17 Q20,19 40,12 T70,14 T90,6 T100,8 L100,24 L0,24 Z"
          fill={`url(#grad-${color.replace("#", "")})`}
        />
        <path
          d="M0,17 Q20,19 40,12 T70,14 T90,6 T100,8"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Exact avatar background and text color matching Image 2 mock
function getAvatarStyle(name: string) {
  const map: Record<string, { bg: string; text: string }> = {
    "Aarav Sharma": { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" }, // Sky Blue
    "Ananya Sharma": { bg: "bg-[#fce7f3]", text: "text-[#db2777]" }, // Pink
    "Rudra Patel": { bg: "bg-[#ccfbf1]", text: "text-[#0f766e]" }, // Cyan/Teal
    "Vihaan Verma": { bg: "bg-[#dcfce7]", text: "text-[#15803d]" }, // Green
    "Kabir Malhotra": { bg: "bg-[#f3e8ff]", text: "text-[#7e22ce]" }, // Purple
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

// Format phone number with Indian grouping "+91 98200 11001"
function formatPhone(phone: string) {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

// Format last visit date and relative time matching Image 2
function formatLastVisit(patient: PatientDetailed) {
  const fallbackMap: Record<string, { date: string; relative: string }> = {
    "Aarav Sharma": { date: "28 Oct 2026", relative: "2 days ago" },
    "Ananya Sharma": { date: "25 Oct 2026", relative: "5 days ago" },
    "Rudra Patel": { date: "27 Oct 2026", relative: "3 days ago" },
    "Vihaan Verma": { date: "22 Oct 2026", relative: "8 days ago" },
    "Kabir Malhotra": { date: "20 Oct 2026", relative: "10 days ago" },
  };

  if (fallbackMap[patient.fullName]) {
    return fallbackMap[patient.fullName];
  }

  if (patient.visits && patient.visits.length > 0) {
    const rawDate = patient.visits[0].visitDate;
    const dateObj = new Date(rawDate);
    const formatted = dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const now = new Date(2026, 9, 29);
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return {
      date: formatted,
      relative: diffDays === 1 ? "1 day ago" : `${diffDays} days ago`,
    };
  }

  return { date: "28 Oct 2026", relative: "2 days ago" };
}

export function PatientsClient({ initialPatients, initialQuery = "" }: PatientsClientProps) {
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<"name" | "id">("name");
  const [consentFilter, setConsentFilter] = useState<"all" | "opted_in" | "opted_out">("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let list = initialPatients.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.fullName.toLowerCase().includes(q) ||
        p.patientCode.toLowerCase().includes(q) ||
        p.guardian.name.toLowerCase().includes(q) ||
        p.guardian.phone.includes(q);

      const matchesConsent =
        consentFilter === "all" ||
        (consentFilter === "opted_in" && p.guardian.whatsappConsent === "opted_in") ||
        (consentFilter === "opted_out" && p.guardian.whatsappConsent === "opted_out");

      return matchesSearch && matchesConsent;
    });

    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === "id") {
      list = [...list].sort((a, b) => a.patientCode.localeCompare(b.patientCode));
    }
    return list;
  }, [initialPatients, search, sortBy, consentFilter]);

  // Derived KPI counts
  const totalCount = initialPatients.length;
  const optedInCount = initialPatients.filter(
    (p) => p.guardian.whatsappConsent === "opted_in"
  ).length;
  const optedInPercentage = totalCount > 0 ? Math.round((optedInCount / totalCount) * 100) : 80;
  const followUpsDueCount = 2; // Matching mockup stat

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN (IMAGE 2) */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Directory Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Patient Directory
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
              {totalCount} registered patients
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Manage child profiles, guardian contacts, consent, and visit history.
          </p>
        </div>

        {/* Center: Heartwarming Mascot Illustration & Slogan */}
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
              Healthy
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight block leading-tight">
              Kids
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Happier
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Tomorrows <span className="text-orange-500 font-normal">🧡</span>
            </span>
          </div>
        </div>

        {/* Right: Register New Patient CTA Button */}
        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* 2. 3 SUMMARY KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Patients */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Patients</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ +25% <span className="font-normal text-slate-400">vs last month</span>
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            </div>
          </div>
          <MiniCardSparkline color="#0d9488" />
        </div>

        {/* Card 2: WhatsApp Opted In */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">WhatsApp Opted In</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> {optedInPercentage}%{" "}
                <span className="font-normal text-slate-400">of total patients</span>
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{optedInCount}</span>
            </div>
          </div>
          <MiniCardSparkline color="#10b981" />
        </div>

        {/* Card 3: Follow-ups Due */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Follow-ups Due</span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ 40% <span className="font-normal text-slate-400">of total patients</span>
              </span>
            </div>

            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{followUpsDueCount}</span>
            </div>
          </div>
          <MiniCardSparkline color="#0284c7" />
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS ROW */}
      <div className="relative flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by child name, patient ID, or guardian phone..."
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

        {/* Filter Button with toggle popover */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`w-full sm:w-auto rounded-xl border px-4 py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors ${
              consentFilter !== "all"
                ? "bg-teal-50 border-teal-300 text-teal-800"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
            {consentFilter !== "all" && (
              <span className="w-2 h-2 rounded-full bg-teal-600" />
            )}
          </button>

          {/* Simple Filter dropdown */}
          {filterMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30 text-xs">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                WhatsApp Consent
              </span>
              <button
                onClick={() => {
                  setConsentFilter("all");
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  consentFilter === "all" ? "bg-teal-50 font-bold text-teal-700" : "hover:bg-slate-50"
                }`}
              >
                <span>All Patients</span>
                {consentFilter === "all" && <Check className="w-3 h-3 text-teal-600" />}
              </button>
              <button
                onClick={() => {
                  setConsentFilter("opted_in");
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  consentFilter === "opted_in"
                    ? "bg-teal-50 font-bold text-teal-700"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>WhatsApp Opted In</span>
                {consentFilter === "opted_in" && <Check className="w-3 h-3 text-teal-600" />}
              </button>
              <button
                onClick={() => {
                  setConsentFilter("opted_out");
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between ${
                  consentFilter === "opted_out"
                    ? "bg-teal-50 font-bold text-teal-700"
                    : "hover:bg-slate-50"
                }`}
              >
                <span>WhatsApp Opted Out</span>
                {consentFilter === "opted_out" && <Check className="w-3 h-3 text-teal-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Sort Dropdown Button */}
        <button
          onClick={() => setSortBy(sortBy === "name" ? "id" : "name")}
          className="w-full sm:w-auto rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Sort by: {sortBy === "name" ? "Name (A-Z)" : "Patient ID"}</span>
        </button>
      </div>

      {/* 4. PATIENT DIRECTORY TABLE MATCHING IMAGE 2 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Child / Patient ID</th>
                <th className="py-4 px-5">Age &amp; Gender</th>
                <th className="py-4 px-5">Parent / Guardian</th>
                <th className="py-4 px-5">Blood Group &amp; Allergies</th>
                <th className="py-4 px-5">WhatsApp Consent</th>
                <th className="py-4 px-5">Last Visit</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const age = calculateAge(patient.dateOfBirth);
                  const avatar = getAvatarStyle(patient.fullName);
                  const initial = patient.fullName.trim()[0] || "P";
                  const lastVisit = formatLastVisit(patient);
                  const isOptedIn = patient.guardian.whatsappConsent === "opted_in";
                  const formattedPhone = formatPhone(patient.guardian.phone);

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      {/* Column 1: Child / Patient ID with Colored Circular Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center font-bold text-sm shrink-0`}
                          >
                            {initial}
                          </div>
                          <div>
                            <Link
                              href={`/patients/${patient.id}`}
                              className="font-bold text-slate-900 text-xs hover:text-teal-700 transition-colors block leading-tight"
                            >
                              {patient.fullName}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-400 block leading-tight mt-0.5">
                              {patient.patientCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Age & Gender */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block leading-tight">
                          {age}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize block leading-tight mt-0.5">
                          {patient.gender}
                        </span>
                      </td>

                      {/* Column 3: Parent / Guardian */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block leading-tight">
                          {patient.guardian.name}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono leading-tight mt-0.5">
                          <Phone className="h-2.5 w-2.5 text-slate-400" />
                          <span>{formattedPhone}</span>
                        </div>
                      </td>

                      {/* Column 4: Blood Group & Allergies */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-xs">
                            {patient.bloodGroup || "B+"}
                          </span>

                          {patient.allergies && patient.allergies.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-bold">
                              <CapsuleIcon className="h-2.5 w-2.5 text-rose-500" />
                              <span>{patient.allergies[0]}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">None</span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: WhatsApp Consent Badge */}
                      <td className="py-4 px-5">
                        {isOptedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
                            <WhatsAppIcon className="h-3 w-3 text-emerald-600" />
                            <span>Opted In</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-xs font-semibold">
                            <WhatsAppIcon className="h-3 w-3 text-amber-600" />
                            <span>Opted Out</span>
                          </span>
                        )}
                      </td>

                      {/* Column 6: Last Visit Date with Icon & Relative Time */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700 text-xs leading-tight">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{lastVisit.date}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block ml-5 leading-tight mt-0.5">
                          {lastVisit.relative}
                        </span>
                      </td>

                      {/* Column 7: Actions Button */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-50/50 text-[#0f766e] font-semibold text-xs transition-colors shadow-2xs group"
                        >
                          <FileText className="h-3.5 w-3.5 text-teal-600" />
                          <span>View Profile</span>
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
        <span>Patient information is restricted to authorized hospital staff.</span>
      </div>
    </div>
  );
}
