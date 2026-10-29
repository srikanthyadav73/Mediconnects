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
} from "@/app/actions/appointments";
import type { PatientDetailed } from "@/lib/patients-data";

interface AppointmentsCalendarViewProps {
  initialAppointments: AppointmentRecord[];
  patients: PatientDetailed[];
}

export function AppointmentsCalendarView({
  initialAppointments,
  patients,
}: AppointmentsCalendarViewProps) {
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>(
    initialAppointments
  );
  const [viewMode, setViewMode] = React.useState<"day" | "week" | "month" | "list">("list");
  const [doctorFilter, setDoctorFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Booking Modal
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

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Pediatric Appointments
            <Badge variant="secondary" className="text-xs">
              {filtered.length} Booked
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Doctor schedules, slot conflict prevention, and WhatsApp reminder triggers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              setBookError(null);
              setBookDialogOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Book New Slot
          </Button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <Card className="shadow-2xs">
        <CardContent className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Toggles */}
          <div className="inline-flex rounded-lg bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === "list" ? "bg-background text-foreground shadow" : ""
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === "day" ? "bg-background text-foreground shadow" : ""
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === "week" ? "bg-background text-foreground shadow" : ""
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === "month" ? "bg-background text-foreground shadow" : ""
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Month
            </button>
          </div>

          {/* Doctor & Status Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Doctor:</span>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="text-xs h-8 w-44">
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
              <span className="text-[11px] text-muted-foreground font-medium">Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs h-8 w-36">
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
        </CardContent>
      </Card>

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
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Status Transition buttons */}
                        {apt.status === "booked" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                            onClick={() => handleStatusChange(apt.id, "confirmed")}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
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
                          className="p-2 rounded-md bg-secondary/60 border border-secondary text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-foreground">
                              {m.startTime} &ndash; {m.patientName} ({m.patientCode})
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {m.doctorName} &bull; {m.reason}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {m.status}
                          </Badge>
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
                      className="p-2 rounded bg-card border border-border text-[11px] space-y-0.5"
                    >
                      <span className="font-semibold text-primary block">
                        {a.startTime} {a.patientName}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {a.doctorName}
                      </span>
                      <Badge variant="secondary" className="text-[9px] py-0 px-1">
                        {a.status}
                      </Badge>
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
                  className={`p-2 rounded-lg border text-left min-h-[70px] ${
                    hasBookings ? "bg-primary/5 border-primary/30" : "border-border/60"
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
    </div>
  );
}
