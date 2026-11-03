"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Inbox,
  Search,
  Lock,
  Clock,
  Phone,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  X,
  AlertCircle,
  Plus,
} from "lucide-react";
import { calculateAge } from "@/lib/utils";

export interface EnquiryItem {
  id: string;
  child_name: string;
  child_dob: string;
  parent_name: string;
  phone: string;
  email: string | null;
  preferred_date: string;
  department_or_reason: string | null;
  whatsapp_consent: boolean;
  status: "pending" | "contacted" | "converted";
  created_at: string;
}

interface EnquiriesClientProps {
  initialEnquiries: EnquiryItem[];
}

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

function getAvatarStyle(name: string) {
  const styles = [
    { bg: "bg-[#e0f2fe]", text: "text-[#0284c7]" },
    { bg: "bg-[#fce7f3]", text: "text-[#db2777]" },
    { bg: "bg-[#ccfbf1]", text: "text-[#0f766e]" },
    { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
    { bg: "bg-[#f3e8ff]", text: "text-[#7e22ce]" },
  ];
  const charCode = name.charCodeAt(0) || 0;
  return styles[charCode % styles.length];
}

function formatPhone(phone: string) {
  if (!phone) return "";
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("+91") && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

export function EnquiriesClient({ initialEnquiries }: EnquiriesClientProps) {
  const [enquiries] = useState<EnquiryItem[]>(initialEnquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalCount = enquiries.length;
  const pendingCount = enquiries.filter((e) => e.status === "pending").length;
  const convertedCount = enquiries.filter((e) => e.status === "converted").length;

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.child_name.toLowerCase().includes(q) ||
        e.parent_name.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        (e.department_or_reason && e.department_or_reason.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Website Enquiries
            </h1>
            {pendingCount > 0 ? (
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                {pendingCount} Pending Triage
              </span>
            ) : (
              <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                {totalCount} Inquiries
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Public inquiries submitted by parents via the website booking portal.
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
              Fast-Track Triage
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              30-Min Response <span className="text-orange-500 font-normal">⚡</span>
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
            <span>Register Walk-in Patient</span>
          </Link>
        </div>
      </div>

      {/* 2. 3 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Enquiries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Inbox className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Enquiries</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ +28% <span className="font-normal text-slate-400">vs last week</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{totalCount}</span>
            </div>
          </div>
          <MiniSparkline color="#0d9488" />
        </div>

        {/* Card 2: Pending Response */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Pending Triage</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                Action required
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-amber-600">{pendingCount}</span>
            </div>
          </div>
          <MiniSparkline color="#f59e0b" />
        </div>

        {/* Card 3: Converted */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Converted to OPD</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✓ Intake success
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{convertedCount}</span>
            </div>
          </div>
          <MiniSparkline color="#10b981" />
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
            placeholder="Search by child name, parent, phone, or symptoms..."
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

        {/* Status Filter Toggle Pills */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-slate-600">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "contacted", label: "Contacted" },
            { id: "converted", label: "Converted" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-teal-800 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. ENQUIRIES TABLE MATCHING PATIENT DIRECTORY DESIGN */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Received Date</th>
                <th className="py-4 px-5">Child Patient</th>
                <th className="py-4 px-5">Parent &amp; Mobile</th>
                <th className="py-4 px-5">Preferred Date</th>
                <th className="py-4 px-5">Symptoms / Reason</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Convert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-slate-400">
                    No website appointment enquiries found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enq) => {
                  const avatar = getAvatarStyle(enq.child_name);
                  const initial = enq.child_name.trim()[0] || "C";
                  const age = calculateAge(enq.child_dob);
                  const formattedPhone = formatPhone(enq.phone);
                  const dateObj = new Date(enq.created_at);
                  const formattedDate = dateObj.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  });
                  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const convertParams = new URLSearchParams({
                    childName: enq.child_name,
                    parentName: enq.parent_name,
                    phone: enq.phone,
                    reason: enq.department_or_reason || "",
                    enquiryId: enq.id,
                  });

                  return (
                    <tr
                      key={enq.id}
                      className="hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      {/* Received Date */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 text-xs block">
                          {formattedDate}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {formattedTime}
                        </span>
                      </td>

                      {/* Child Patient */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center font-bold text-sm shrink-0`}
                          >
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-tight">
                              {enq.child_name}
                            </span>
                            <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                              DOB: {enq.child_dob} {age && `(${age})`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block leading-tight">
                          {enq.parent_name}
                        </span>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono leading-tight mt-0.5">
                          <Phone className="h-2.5 w-2.5 text-slate-400" />
                          <span>{formattedPhone}</span>
                        </div>
                      </td>

                      {/* Preferred Date */}
                      <td className="py-4 px-5 font-mono text-xs text-slate-700 font-semibold">
                        {enq.preferred_date}
                      </td>

                      {/* Symptoms */}
                      <td className="py-4 px-5 max-w-xs text-xs text-slate-600 truncate">
                        {enq.department_or_reason || "Pediatric consultation request"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {enq.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 text-[11px] font-semibold">
                            Pending
                          </span>
                        )}
                        {enq.status === "contacted" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-semibold">
                            Contacted
                          </span>
                        )}
                        {enq.status === "converted" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold">
                            Converted
                          </span>
                        )}
                      </td>

                      {/* Convert Action */}
                      <td className="py-4 px-5 text-right">
                        {enq.status === "converted" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Registered
                          </span>
                        ) : (
                          <Link
                            href={`/patients/new?${convertParams.toString()}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-white hover:bg-teal-50/50 text-[#0f766e] font-semibold text-xs transition-colors shadow-2xs group"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                            <span>Register</span>
                            <ChevronRight className="h-3 w-3 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
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
        <span>Website enquiry leads are encrypted and routed directly to pediatric triage staff.</span>
      </div>
    </div>
  );
}
