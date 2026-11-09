"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  CalendarRange,
  ListFilter,
  RefreshCw,
  Loader2,
  ArrowRight,
  Lock,
  CheckCheck,
  MessageSquare,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AppointmentRecord,
  bookAppointmentAction,
  updateAppointmentStatusAction,
  rescheduleAppointmentAction,
  approveAppointmentAction,
  getAppointmentMessagesAction,
  retryAppointmentMessageAction,
} from "@/app/actions/appointments";
import type { PatientDetailed } from "@/lib/patients-data";
import type { SessionUser } from "@/lib/auth";
import type { MessageLogEntry } from "@/types/messaging";

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

interface AppointmentsCalendarViewProps {
  initialAppointments: AppointmentRecord[];
  patients: PatientDetailed[];
  currentUser?: SessionUser | null;
  initialMessages?: MessageLogEntry[];
}

export function AppointmentsCalendarView({
  initialAppointments,
  patients,
  currentUser,
  initialMessages = [],
}: AppointmentsCalendarViewProps) {
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>(
    initialAppointments
  );
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "month" | "list">("list");
  const [doctorFilter, setDoctorFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Booking Modal
  // for checking working
  const [bookDialogOpen, setBookDialogOpen] = React.useState(false);
  const [bookLoading, setBookLoading] = React.useState(false);
  const [bookError, setBookError] = React.useState<string | null>(null);

  const [selectedPatientId, setSelectedPatientId] = React.useState(
    patients[0]?.id || ""
  );
  const [selectedDoctor, setSelectedDoctor] = React.useState("doc-1");
  const [aptDate, setAptDate] = React.useState("2026-10-30");
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("10:30");
  const [aptType, setAptType] = React.useState<"new" | "follow_up" | "camp">("new");
  const [aptReason, setAptReason] = React.useState("Pediatric OPD consultation");

  // Reschedule Modal
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = React.useState(false);
  const [reschedulingApt, setReschedulingApt] = React.useState<AppointmentRecord | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleStart, setRescheduleStart] = React.useState("10:00");
  const [rescheduleEnd, setRescheduleEnd] = React.useState("10:30");
  const [rescheduleLoading, setRescheduleLoading] = React.useState(false);
  const [rescheduleError, setRescheduleError] = React.useState<string | null>(null);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [approvalError, setApprovalError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<MessageLogEntry[]>(initialMessages);
  const [retryingMessageId, setRetryingMessageId] = React.useState<string | null>(null);
  const [lifecycleDialogOpen, setLifecycleDialogOpen] = React.useState(false);
  const [selectedAptForMessages, setSelectedAptForMessages] = React.useState<AppointmentRecord | null>(null);

  const handleRetryMessage = async (messageId: string) => {
    setRetryingMessageId(messageId);
    try {
      const res = await retryAppointmentMessageAction(messageId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, status: "sent", sentAt: new Date().toISOString(), errorMessage: undefined }
              : m
          )
        );
      }
    } finally {
      setRetryingMessageId(null);
    }
  };

  const canApprove = (apt: AppointmentRecord) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "doctor") {
      const cName = currentUser.fullName.toLowerCase();
      const dName = apt.doctorName.toLowerCase();
      return (
        cName.includes(dName) ||
        dName.includes(cName) ||
        currentUser.id === apt.doctorId
      );
    }
    return false;
  };

  const handleApprove = async (aptId: string) => {
    setApprovingId(aptId);
    setApprovalError(null);
    try {
      const res = await approveAppointmentAction(aptId);
      if (!res.success) {
        setApprovalError(res.error || "Failed to approve appointment.");
      } else {
        setAppointments((prev) =>
          prev.map((a) => (a.id === aptId ? { ...a, status: "confirmed" } : a))
        );
        try {
          const latestMsgs = await getAppointmentMessagesAction(aptId);
          if (latestMsgs && latestMsgs.length > 0) {
            setMessages((prev) => {
              const others = prev.filter((m) => m.appointmentId !== aptId);
              return [...latestMsgs, ...others];
            });
          }
        } catch {
          // ignore
        }
      }
    } catch (err: unknown) {
      setApprovalError((err as Error).message || "An error occurred.");
    } finally {
      setApprovingId(null);
    }
  };

  const doctorsList = [
    { id: "doc-1", name: "Dr. Ananya Roy", specialty: "Neonatology & Pediatrics" },
    { id: "doc-2", name: "Dr. Rahul Deshpande", specialty: "Pediatric Pulmonology" },
    { id: "doc-3", name: "Dr. Meenakshi Sundaram", specialty: "Child Development" },
    { id: "doc-4", name: "Dr. Tanvi Shah", specialty: "Pediatric Surgery" },
  ];

  // Filtered Appointments
  const filtered = appointments.filter((a) => {
    if (doctorFilter !== "all" && a.doctorId !== doctorFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    setBookError(null);
    setBookLoading(true);

    const pat = patients.find((p) => p.id === selectedPatientId);
    const doc = doctorsList.find((d) => d.id === selectedDoctor);

    if (!pat || !doc) {
      setBookError("Please select a valid patient and doctor.");
      setBookLoading(false);
      return;
    }

    const res = await bookAppointmentAction({
      patientId: pat.id,
      patientName: pat.fullName,
      patientCode: pat.patientCode,
      guardianName: pat.guardian.name,
      guardianPhone: pat.guardian.phone,
      doctorId: doc.id,
      doctorName: doc.name,
      appointmentDate: aptDate,
      startTime,
      endTime,
      type: aptType,
      reason: aptReason,
    });

    if (res.success && res.appointment) {
      setAppointments([res.appointment, ...appointments]);
      setBookLoading(false);
      setBookDialogOpen(false);
    } else {
      setBookError(res.error || "Failed to book appointment.");
      setBookLoading(false);
    }
  }

  async function handleStatusChange(
    aptId: string,
    newStatus: "booked" | "confirmed" | "completed" | "cancelled" | "no_show"
  ) {
    await updateAppointmentStatusAction(aptId, newStatus);
    setAppointments(
      appointments.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a))
    );
  }

  function openReschedule(apt: AppointmentRecord) {
    setReschedulingApt(apt);
    setRescheduleDate(apt.appointmentDate);
    setRescheduleStart(apt.startTime);
    setRescheduleEnd(apt.endTime);
    setRescheduleError(null);
    setRescheduleDialogOpen(true);
  }

  async function handleRescheduleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reschedulingApt) return;

    setRescheduleError(null);
    setRescheduleLoading(true);

    const res = await rescheduleAppointmentAction(
      reschedulingApt.id,
      rescheduleDate,
      rescheduleStart,
      rescheduleEnd,
      reschedulingApt.doctorId
    );

    if (res.success) {
      setAppointments(
        appointments.map((a) =>
          a.id === reschedulingApt.id
            ? {
              ...a,
              appointmentDate: rescheduleDate,
              startTime: rescheduleStart,
              endTime: rescheduleEnd,
              status: "confirmed",
            }
            : a
        )
      );
      setRescheduleLoading(false);
      setRescheduleDialogOpen(false);
    } else {
      setRescheduleError(res.error || "Failed to reschedule slot.");
      setRescheduleLoading(false);
    }
  }

  function handleCreateFollowUp(completedApt: AppointmentRecord) {
    // 7 days later
    const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    setSelectedPatientId(completedApt.patientId);
    setSelectedDoctor(completedApt.doctorId);
    setAptDate(futureDate);
    setStartTime(completedApt.startTime);
    setEndTime(completedApt.endTime);
    setAptType("follow_up");
    setAptReason(`Follow-up review for ${completedApt.reason || "consultation"}`);
    setBookError(null);
    setBookDialogOpen(true);
  }

  const totalSlots = filtered.length;
  const activeSlots = filtered.filter((a) => a.status === "confirmed" || a.status === "booked").length;
  const completedSlots = filtered.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Pediatric Appointments
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
              {totalSlots} Booked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Doctor schedules, slot conflict prevention, and automated WhatsApp reminder triggers.
          </p>
        </div>

        {/* Center: Mascot & Slogan */}
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
              Gentle Pediatric Slots
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Zero Wait Triage <span className="text-orange-500 font-normal">⏰</span>
            </span>
          </div>
        </div>

        {/* Right: CTA Action */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => {
              setBookError(null);
              setBookDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Book New Slot</span>
          </button>
        </div>
      </div>

      {/* 2. 3 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Slots */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Scheduled Slots</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ +15% <span className="font-normal text-slate-400">vs last week</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{totalSlots}</span>
            </div>
          </div>
          <MiniSparkline color="#0d9488" />
        </div>

        {/* Card 2: Active / Confirmed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Confirmed &amp; Active</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ✓ Real-time <span className="font-normal text-slate-400">sync</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{activeSlots}</span>
            </div>
          </div>
          <MiniSparkline color="#10b981" />
        </div>

        {/* Card 3: Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Completed Consults</span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                ↗ 100% <span className="font-normal text-slate-400">on-time</span>
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-3xl font-extrabold text-slate-900">{completedSlots}</span>
            </div>
          </div>
          <MiniSparkline color="#0284c7" />
        </div>
      </div>

      {/* 3. VIEW SWITCHER & FILTER CONTROLS */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Toggles */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-slate-600">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-teal-800 shadow-xs" : "hover:text-slate-900"
              }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "day" ? "bg-white text-teal-800 shadow-xs" : "hover:text-slate-900"
              }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Day
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "week" ? "bg-white text-teal-800 shadow-xs" : "hover:text-slate-900"
              }`}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            Week
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === "month" ? "bg-white text-teal-800 shadow-xs" : "hover:text-slate-900"
              }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Month
          </button>
        </div>

        {/* Doctor & Status Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold">Doctor:</span>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="text-xs h-9 w-44 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="All Doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctorsList.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs h-9 w-36 rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {approvalError && (
        <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-between">
          <span><strong>Approval Error:</strong> {approvalError}</span>
          <button onClick={() => setApprovalError(null)} className="font-bold text-xs underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* VIEW 1: LIST VIEW */}
      {viewMode === "list" && (
        <Card className="shadow-2xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold">Date &amp; Time Slot</TableHead>
                <TableHead className="text-xs font-semibold">Patient &amp; Guardian</TableHead>
                <TableHead className="text-xs font-semibold">Attending Doctor</TableHead>
                <TableHead className="text-xs font-semibold">Type &amp; Reason</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No appointments match the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((apt) => (
                  <TableRow key={apt.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">
                        {apt.appointmentDate}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" />
                        {apt.startTime} &ndash; {apt.endTime}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-xs text-foreground block">
                        {apt.patientName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {apt.patientCode} &bull; {apt.guardianName} ({apt.guardianPhone})
                      </span>
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">
                        {apt.doctorName}
                      </span>
                    </TableCell>

                    <TableCell className="max-w-xs text-xs">
                      <Badge variant="outline" className="text-[10px] capitalize mb-1">
                        {apt.type}
                      </Badge>
                      <p className="text-muted-foreground text-[11px] line-clamp-1">
                        {apt.reason || "Pediatric consultation"}
                      </p>
                    </TableCell>

                    <TableCell>
                      {apt.status === "booked" ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize font-bold bg-amber-50 text-amber-800 border-dashed border-amber-300 flex items-center gap-1 w-fit"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          Awaiting Approval
                        </Badge>
                      ) : (
                        <div className="space-y-1">
                          <Badge
                            variant={
                              apt.status === "confirmed"
                                ? "success"
                                : apt.status === "completed"
                                  ? "default"
                                  : apt.status === "cancelled"
                                    ? "destructive"
                                    : apt.status === "no_show"
                                      ? "warning"
                                      : "secondary"
                            }
                            className="text-[10px] capitalize font-medium"
                          >
                            {apt.status.replace("_", " ")}
                          </Badge>

                          {/* WhatsApp Message Lifecycle indicator */}
                          {apt.status === "confirmed" && (() => {
                            const aptMsgs = messages.filter((m) => m.appointmentId === apt.id);
                            const confMsg = aptMsgs.find((m) => m.messageType === "appointment_confirmation");
                            const hasNoConsent = aptMsgs.some((m) => m.skipReason === "no_consent") || confMsg?.skipReason === "no_consent";
                            const hasFailed = aptMsgs.some((m) => m.status === "failed" && m.skipReason !== "no_consent");
                            const queuedReminders = aptMsgs.filter((m) => m.status === "queued" && m.scheduledFor);

                            if (hasNoConsent) {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded cursor-default"
                                  title="Parent has not opted-in to WhatsApp updates. Staff may phone the parent."
                                >
                                  <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  Not sent: no consent
                                </span>
                              );
                            }

                            if (hasFailed) {
                              const failedMsg = aptMsgs.find((m) => m.status === "failed" && m.skipReason !== "no_consent");
                              return (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                    Msg failed
                                  </span>
                                  {failedMsg && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      disabled={retryingMessageId === failedMsg.id}
                                      className="h-5 px-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                                      onClick={() => handleRetryMessage(failedMsg.id)}
                                    >
                                      {retryingMessageId === failedMsg.id ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                      ) : (
                                        "Retry"
                                      )}
                                    </Button>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAptForMessages(apt);
                                  setLifecycleDialogOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-1.5 py-0.5 rounded transition-colors"
                                title="View WhatsApp confirmation & reminder schedule"
                              >
                                <CheckCheck className="w-2.5 h-2.5 text-teal-600" />
                                WhatsApp Trail
                                {queuedReminders.length > 0 && (
                                  <span className="text-[9px] text-teal-700 font-normal">({queuedReminders.length} rem)</span>
                                )}
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Status Transition buttons */}
                        {apt.status === "booked" && (
                          canApprove(apt) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approvingId === apt.id}
                              className="h-7 text-xs bg-emerald-50 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 border-emerald-300 font-bold px-2 shadow-2xs"
                              onClick={() => handleApprove(apt.id)}
                            >
                              {approvingId === apt.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Approve Booking
                            </Button>
                          ) : (
                            <span
                              className="text-[10px] font-semibold text-amber-700 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded-md flex items-center gap-1 cursor-default"
                              title={`Requires approval by ${apt.doctorName} or an Admin`}
                            >
                              <Lock className="w-3 h-3 text-amber-600" />
                              Awaiting Dr. Approval
                            </span>
                          )
                        )}

                        {apt.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-primary px-2"
                            onClick={() => handleStatusChange(apt.id, "completed")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        )}

                        {apt.status === "completed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs px-2 font-semibold text-accent"
                            onClick={() => handleCreateFollowUp(apt)}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Book Follow-up
                          </Button>
                        )}

                        {apt.status !== "completed" && apt.status !== "cancelled" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground px-2"
                              onClick={() => openReschedule(apt)}
                            >
                              Reschedule
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                              onClick={() => handleStatusChange(apt.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* VIEW 2: DAY VIEW (Hourly Slot Grid) */}
      {viewMode === "day" && (
        <Card className="shadow-2xs p-4 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
            Today&apos;s Hourly Schedule &bull; {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div className="space-y-2">
            {[
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "14:00",
              "15:00",
              "16:00",
              "17:00",
            ].map((hour) => {
              const matchedApts = filtered.filter(
                (a) => a.startTime.startsWith(hour.slice(0, 2))
              );
              return (
                <div
                  key={hour}
                  className="flex items-start gap-4 p-2.5 rounded-lg border border-border/60 hover:bg-muted/20"
                >
                  <span className="font-mono text-xs font-bold text-muted-foreground w-14 shrink-0 pt-1">
                    {hour}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    {matchedApts.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground italic">
                        Available open slot
                      </span>
                    ) : (
                      matchedApts.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2 rounded-md text-xs flex items-center justify-between border ${m.status === "booked" ? "bg-amber-50/70 border-dashed border-amber-300 text-amber-900" : m.status === "confirmed" ? "bg-teal-50/80 border-solid border-teal-200 text-teal-900 font-medium" : "bg-secondary/60 border-secondary text-foreground"}`}
                        >
                          <div>
                            <span className="font-bold text-foreground">
                              {m.startTime} &ndash; {m.patientName} ({m.patientCode})
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {m.doctorName} &bull; {m.reason}
                            </span>
                          </div>
                          {m.status === "booked" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] capitalize font-bold bg-amber-50 text-amber-800 border-dashed border-amber-300 flex items-center gap-1 w-fit"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              Awaiting Approval
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {m.status}
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* VIEW 3: WEEK VIEW */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
            (day, i) => (
              <Card key={day} className="shadow-2xs">
                <CardHeader className="p-3 border-b border-border/60">
                  <CardTitle className="text-xs font-bold text-foreground">
                    {day}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2.5 space-y-2 min-h-[160px]">
                  {filtered.slice(i, i + 2).map((a) => (
                    <div
                      key={a.id}
                      className={`p-2 rounded text-[11px] space-y-0.5 border ${a.status === "booked" ? "bg-amber-50/70 border-dashed border-amber-300" : a.status === "confirmed" ? "bg-teal-50/70 border-solid border-teal-200" : "bg-card border-border"}`}
                    >
                      <span className="font-semibold text-primary block">
                        {a.startTime} {a.patientName}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {a.doctorName}
                      </span>
                      {a.status === "booked" ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize font-bold bg-amber-50 text-amber-800 border-dashed border-amber-300 flex items-center gap-1 w-fit"
                        >
                          <Clock className="w-2.5 h-2.5" />
                          Awaiting Approval
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] py-0 px-1">
                          {a.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* VIEW 4: MONTH VIEW */}
      {viewMode === "month" && (
        <Card className="shadow-2xs p-4">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground pb-2 border-b border-border">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {Array.from({ length: 31 }).map((_, idx) => {
              const dayNum = idx + 1;
              const hasBookings = dayNum % 3 === 0;
              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded-lg border text-left min-h-[70px] ${hasBookings ? "bg-primary/5 border-primary/30" : "border-border/60"
                    }`}
                >
                  <span className="text-xs font-bold text-foreground block">
                    {dayNum}
                  </span>
                  {hasBookings && (
                    <div className="mt-1 space-y-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block mr-1" />
                      <span className="text-[10px] font-semibold text-primary">
                        {(dayNum % 4) + 1} slots
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* BOOK NEW APPOINTMENT MODAL DIALOG */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Book Pediatric Appointment Slot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Direct consultation booking with automated double-booking prevention.
            </DialogDescription>
          </DialogHeader>

          {bookError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{bookError}</span>
            </div>
          )}

          <form onSubmit={handleBookAppointment} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="patSelect" className="text-xs font-semibold">
                Select Registered Child Patient *
              </Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger id="patSelect" className="text-xs">
                  <SelectValue placeholder="Choose Patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName} ({p.patientCode}) &bull; {p.guardian.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="docSelect" className="text-xs font-semibold">
                Attending Pediatrician *
              </Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger id="docSelect" className="text-xs">
                  <SelectValue placeholder="Choose Doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctorsList.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} &bull; {d.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="aptDate" className="text-xs font-semibold">
                  Date *
                </Label>
                <Input
                  id="aptDate"
                  type="date"
                  required
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs font-semibold">
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs font-semibold">
                  End Time *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="aptType" className="text-xs font-semibold">
                Appointment Category
              </Label>
              <Select value={aptType} onValueChange={(v: "new" | "follow_up" | "camp") => setAptType(v)}>
                <SelectTrigger id="aptType" className="text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up Review</SelectItem>
                  <SelectItem value="camp">Health Camp / Immunization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="aptReason" className="text-xs font-semibold">
                Reason / Clinical Purpose
              </Label>
              <Input
                id="aptReason"
                value={aptReason}
                onChange={(e) => setAptReason(e.target.value)}
                placeholder="e.g. Wheezing follow-up, DTP vaccine"
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBookDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bookLoading}
                size="sm"
                className="bg-primary text-primary-foreground text-xs shadow-md font-semibold"
              >
                {bookLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking Conflicts &amp; Booking...
                  </span>
                ) : (
                  "Confirm Appointment Slot"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RESCHEDULE MODAL DIALOG */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Change slot timing for {reschedulingApt?.patientName} ({reschedulingApt?.doctorName}).
            </DialogDescription>
          </DialogHeader>

          {rescheduleError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
              {rescheduleError}
            </div>
          )}

          <form onSubmit={handleRescheduleSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="resDate" className="text-xs font-semibold">
                New Date *
              </Label>
              <Input
                id="resDate"
                type="date"
                required
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="resStart" className="text-xs font-semibold">
                  New Start Time
                </Label>
                <Input
                  id="resStart"
                  type="time"
                  required
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="resEnd" className="text-xs font-semibold">
                  New End Time
                </Label>
                <Input
                  id="resEnd"
                  type="time"
                  required
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRescheduleDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={rescheduleLoading}
                size="sm"
                className="bg-primary text-primary-foreground text-xs shadow-md font-semibold"
              >
                {rescheduleLoading ? "Checking..." : "Confirm Reschedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* APPOINTMENT WHATSAPP LIFECYCLE MODAL (PHASE 4) */}
      <Dialog open={lifecycleDialogOpen} onOpenChange={setLifecycleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-700" />
              WhatsApp Communication Trail
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lifecycle status of confirmation and automated reminders for this appointment.
            </DialogDescription>
          </DialogHeader>

          {selectedAptForMessages && (() => {
            const aptMsgs = messages.filter((m) => m.appointmentId === selectedAptForMessages.id);
            return (
              <div className="space-y-3 py-1 text-xs">
                {/* Patient Summary Header */}
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-950 space-y-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{selectedAptForMessages.patientName}</span>
                    <span className="font-mono text-xs">{selectedAptForMessages.appointmentDate} @ {selectedAptForMessages.startTime}</span>
                  </div>
                  <div className="text-[11px] text-teal-800 flex justify-between">
                    <span>Guardian: {selectedAptForMessages.guardianName} ({selectedAptForMessages.guardianPhone})</span>
                    <span>{selectedAptForMessages.doctorName}</span>
                  </div>
                </div>

                {/* Messages Trail */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-foreground">Message Lifecycle Log</div>
                  {aptMsgs.length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted/30 text-center text-muted-foreground text-xs">
                      No messages recorded yet. Approving the appointment will trigger immediate confirmation.
                    </div>
                  ) : (
                    aptMsgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg border text-xs space-y-1.5 ${msg.status === "sent" || msg.status === "delivered" || msg.status === "read"
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                            : msg.status === "failed"
                              ? "bg-rose-50/50 border-rose-200 text-rose-950"
                              : "bg-teal-50/30 border-teal-200 text-teal-950"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold capitalize flex items-center gap-1.5">
                            {msg.messageType?.replace(/_/g, " ") || msg.templateName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                msg.status === "sent" || msg.status === "delivered" || msg.status === "read"
                                  ? "default"
                                  : msg.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[9px] capitalize"
                            >
                              {msg.skipReason === "no_consent" ? "No Consent" : msg.status}
                            </Badge>
                            {msg.status === "failed" && msg.skipReason !== "no_consent" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={retryingMessageId === msg.id}
                                onClick={() => handleRetryMessage(msg.id)}
                                className="h-5 px-1.5 text-[10px] font-bold text-rose-700 border-rose-300 hover:bg-rose-100"
                              >
                                {retryingMessageId === msg.id ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  "Retry"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {msg.messageBody}
                        </p>
                        <div className="text-[10px] text-muted-foreground flex justify-between pt-1 border-t border-border/40">
                          <span>
                            {msg.sentAt
                              ? `Sent: ${new Date(msg.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                              : msg.scheduledFor
                                ? `Scheduled: ${new Date(msg.scheduledFor).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at ${new Date(msg.scheduledFor).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                                : ""}
                          </span>
                          {msg.skipReason && (
                            <span className="font-semibold text-rose-600">
                              Reason: {msg.skipReason}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLifecycleDialogOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 5. BOTTOM CONFIDENTIALITY BANNER */}
      <div className="p-3 bg-[#e8f7f4] border border-[#b2e2d8] rounded-xl flex items-center gap-2.5 text-xs text-[#0f6055] font-medium">
        <Lock className="w-4 h-4 text-[#0f766e] shrink-0" />
        <span>Appointments and OPD doctor slot reservations are real-time synchronized with parent WhatsApp reminders.</span>
      </div>
    </div>
  );
}