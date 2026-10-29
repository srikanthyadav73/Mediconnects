"use client";

import * as React from "react";
import Link from "next/link";
import {
  Baby,
  Phone,
  AlertTriangle,
  Stethoscope,
  CalendarPlus,
  Receipt,
  User,
  Plus,
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PatientDetailed } from "@/lib/patients-data";
import {
  recordNewVisitAction,
  toggleWhatsAppConsentAction,
} from "@/app/actions/patients";
import { formatCurrencyINR, calculateAge } from "@/lib/utils";

interface PatientProfileViewProps {
  patient: PatientDetailed;
}

export function PatientProfileView({ patient }: PatientProfileViewProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [consentStatus, setConsentStatus] = React.useState(
    patient.guardian.whatsappConsent
  );
  const [consentLoading, setConsentLoading] = React.useState(false);

  // New Visit Dialog State
  const [visitDialogOpen, setVisitDialogOpen] = React.useState(false);
  const [visitLoading, setVisitLoading] = React.useState(false);
  const [complaint, setComplaint] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [rx, setRx] = React.useState("");
  const [wt, setWt] = React.useState("18.5");
  const [ht, setHt] = React.useState("109");
  const [temp, setTemp] = React.useState("37.2");
  const [spo2Val, setSpo2Val] = React.useState("99");
  const [pulse, setPulse] = React.useState("96");

  // Local visits list
  const [visitsList, setVisitsList] = React.useState(patient.visits);

  async function handleConsentToggle() {
    setConsentLoading(true);
    const newStatus = consentStatus === "opted_in" ? "opted_out" : "opted_in";
    await toggleWhatsAppConsentAction(patient.guardian.id, newStatus);
    setConsentStatus(newStatus);
    setConsentLoading(false);
  }

  async function handleRecordVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint.trim()) return;

    setVisitLoading(true);
    const newVisitObj = {
      id: `vis-${Date.now()}`,
      visitDate: new Date().toISOString(),
      chiefComplaint: complaint,
      diagnosis: diagnosis || "Clinical consultation",
      vitals: {
        weight_kg: parseFloat(wt),
        height_cm: parseFloat(ht),
        temp_c: parseFloat(temp),
        spo2: parseInt(spo2Val),
        pulse_bpm: parseInt(pulse),
      },
      prescription: rx || null,
      doctorName: "Dr. Ananya Roy",
    };

    await recordNewVisitAction(patient.id, {
      chiefComplaint: complaint,
      diagnosis,
      prescription: rx,
      weightKg: parseFloat(wt),
      heightCm: parseFloat(ht),
      tempC: parseFloat(temp),
      spo2: parseInt(spo2Val),
      pulseBpm: parseInt(pulse),
    });

    setVisitsList([newVisitObj, ...visitsList]);
    setVisitLoading(false);
    setVisitDialogOpen(false);
    setComplaint("");
    setDiagnosis("");
    setRx("");
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <Link
            href="/patients"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Patient Directory
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {patient.fullName}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {patient.patientCode}
            </Badge>
            <Badge variant="secondary" className="capitalize text-xs">
              {calculateAge(patient.dateOfBirth)} &bull; {patient.gender}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Guardian:{" "}
            <strong className="text-foreground">{patient.guardian.name}</strong> ({patient.guardian.relationship}) &bull;{" "}
            <span className="font-mono">{patient.guardian.phone}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setVisitDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm font-semibold"
          >
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
            Record Return Visit
          </Button>

          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/appointments">
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Schedule Slot
            </Link>
          </Button>
        </div>
      </div>

      {/* Allergies Critical Banner */}
      {patient.allergies.length > 0 && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 font-bold" />
            <span>
              <strong>Clinical Allergy Alert:</strong> Patient is allergic to{" "}
              <strong>{patient.allergies.join(", ")}</strong>. Avoid contraindicated medications.
            </span>
          </div>
          <Badge variant="destructive" className="text-[10px] font-mono">
            CRITICAL
          </Badge>
        </div>
      )}

      {/* 6 PROFILE TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/70">
          <TabsTrigger value="overview" className="text-xs py-1.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="visits" className="text-xs py-1.5 flex items-center gap-1">
            Visits
            <span className="h-4 w-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold inline-flex items-center justify-center">
              {visitsList.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs py-1.5 flex items-center gap-1">
            Appointments
            <span className="h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold inline-flex items-center justify-center">
              {patient.appointments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs py-1.5 flex items-center gap-1">
            Billing
            <span className="h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold inline-flex items-center justify-center">
              {patient.invoices.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="text-xs py-1.5 flex items-center gap-1">
            WhatsApp
            <span className="h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold inline-flex items-center justify-center">
              {patient.messages.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="medications" className="text-xs py-1.5 flex items-center gap-1">
            Medications
            <span className="h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold inline-flex items-center justify-center">
              {patient.medications.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Child Profile Details Card */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Baby className="h-4 w-4 text-primary" />
                  Child Medical Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border/60">
                  <div>
                    <span className="text-muted-foreground block">Date of Birth</span>
                    <span className="font-semibold text-foreground">{patient.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Blood Group</span>
                    <span className="font-semibold text-foreground">
                      {patient.bloodGroup || "Not tested"}
                    </span>
                  </div>
                </div>

                <div className="pb-2 border-b border-border/60">
                  <span className="text-muted-foreground block mb-1">Permanent Medical Notes</span>
                  <p className="text-foreground leading-relaxed">
                    {patient.medicalNotes || "No previous chronic conditions recorded."}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground block mb-1">Patient Record Info</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Registered on {new Date(patient.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Guardian & Consent Card */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Guardian &amp; Consent Management
                  </CardTitle>
                  <Badge
                    variant={consentStatus === "opted_in" ? "success" : "warning"}
                    className="text-[10px] capitalize"
                  >
                    WhatsApp: {consentStatus === "opted_in" ? "Opted In" : "Opted Out"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-border/60">
                  <div>
                    <span className="text-muted-foreground block">Guardian Name</span>
                    <span className="font-semibold text-foreground">{patient.guardian.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Relationship</span>
                    <span className="font-semibold text-foreground">{patient.guardian.relationship}</span>
                  </div>
                </div>

                <div className="pb-2 border-b border-border/60">
                  <span className="text-muted-foreground block">Verified Mobile Number</span>
                  <span className="font-mono font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {patient.guardian.phone}
                  </span>
                </div>

                {/* Consent Toggle Action */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-foreground">
                      WhatsApp Messaging Consent
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {consentStatus === "opted_in"
                        ? "Guardian receives automated appointment reminders."
                        : "Guardian has opted out. System will skip WhatsApp sends."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={consentStatus === "opted_in" ? "outline" : "default"}
                    disabled={consentLoading}
                    onClick={handleConsentToggle}
                    className="text-xs h-7 px-3"
                  >
                    {consentLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : consentStatus === "opted_in" ? (
                      "Revoke Consent"
                    ) : (
                      "Enable Consent"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: VISITS TIMELINE */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Outpatient Visits Timeline ({visitsList.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                One patient = One record. Every clinical return creates a new row.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setVisitDialogOpen(true)}
              className="text-xs bg-primary text-primary-foreground h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Visit Row
            </Button>
          </div>

          <div className="space-y-3">
            {visitsList.map((v, index) => (
              <Card key={v.id || index} className="shadow-2xs border-border/80">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      Visit #{visitsList.length - index}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {new Date(v.visitDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-primary font-medium">
                    {v.doctorName || "Dr. Ananya Roy"}
                  </span>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-foreground">Chief Complaint:</span>
                    <p className="text-muted-foreground mt-0.5">{v.chiefComplaint}</p>
                  </div>

                  {v.vitals && Object.keys(v.vitals).length > 0 && (
                    <div className="p-2.5 rounded-md bg-muted/40 border border-border/70 flex flex-wrap gap-4 text-[11px] font-mono">
                      {v.vitals.weight_kg && (
                        <span>
                          <strong className="text-foreground">Wt:</strong> {v.vitals.weight_kg} kg
                        </span>
                      )}
                      {v.vitals.height_cm && (
                        <span>
                          <strong className="text-foreground">Ht:</strong> {v.vitals.height_cm} cm
                        </span>
                      )}
                      {v.vitals.temp_c && (
                        <span>
                          <strong className="text-foreground">Temp:</strong> {v.vitals.temp_c} °C
                        </span>
                      )}
                      {v.vitals.spo2 && (
                        <span>
                          <strong className="text-foreground">SpO2:</strong> {v.vitals.spo2} %
                        </span>
                      )}
                      {v.vitals.pulse_bpm && (
                        <span>
                          <strong className="text-foreground">Pulse:</strong> {v.vitals.pulse_bpm} bpm
                        </span>
                      )}
                    </div>
                  )}

                  {v.diagnosis && (
                    <div>
                      <span className="font-semibold text-foreground">Clinical Diagnosis:</span>
                      <p className="text-foreground/90 mt-0.5">{v.diagnosis}</p>
                    </div>
                  )}

                  {v.prescription && (
                    <div className="p-2.5 rounded-md bg-secondary/50 border border-secondary text-secondary-foreground font-mono text-[11px]">
                      <strong className="block mb-1">Prescription:</strong>
                      {v.prescription}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: APPOINTMENTS */}
        <TabsContent value="appointments" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Appointments ({patient.appointments.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Consultation bookings, slot timings, and status tracking.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs h-8">
              <Link href="/appointments">
                <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                Book Slot
              </Link>
            </Button>
          </div>

          {patient.appointments.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground shadow-2xs">
              No scheduled appointments for this patient. Click &quot;Book Slot&quot; to schedule.
            </Card>
          ) : (
            <div className="space-y-2">
              {patient.appointments.map((a) => (
                <Card key={a.id} className="p-3 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {a.appointmentDate} at {a.startTime.slice(0, 5)}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {a.type}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Attending: {a.doctorName} &bull; {a.reason || "Pediatric consultation"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      a.status === "confirmed"
                        ? "success"
                        : a.status === "completed"
                        ? "default"
                        : "secondary"
                    }
                    className="capitalize text-[10px]"
                  >
                    {a.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 4: BILLING */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Invoices &amp; Receipts ({patient.invoices.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Consultation charges, pharmacy bills, and payment records.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs h-8">
              <Link href="/billing">
                <Receipt className="h-3.5 w-3.5 mr-1" />
                New Invoice
              </Link>
            </Button>
          </div>

          {patient.invoices.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground shadow-2xs">
              No invoices generated for this patient yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {patient.invoices.map((inv) => (
                <Card key={inv.id} className="p-3 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      {inv.invoiceNumber}
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Due Date: {inv.dueDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground block">
                      {formatCurrencyINR(inv.netAmount)}
                    </span>
                    <Badge
                      variant={inv.status === "paid" ? "success" : "warning"}
                      className="text-[10px] capitalize mt-0.5"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 5: MESSAGES */}
        <TabsContent value="messages" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                WhatsApp Dispatch Log ({patient.messages.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Automated reminders sent to guardian mobile {patient.guardian.phone}.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs h-8">
              <Link href="/messages">
                <Send className="h-3.5 w-3.5 mr-1" />
                Send Template
              </Link>
            </Button>
          </div>

          {patient.messages.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground shadow-2xs">
              No WhatsApp messages logged for this guardian yet. Reminders are dispatched automatically before appointments.
            </Card>
          ) : (
            <div className="space-y-2">
              {patient.messages.map((m) => (
                <Card key={m.id} className="p-3 shadow-2xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {m.category}
                    </Badge>
                    <Badge variant="success" className="capitalize text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{m.body}</p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB 6: MEDICATIONS */}
        <TabsContent value="medications" className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Medication Reminders ({patient.medications.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Dosage alerts and parent compliance reminders.
              </p>
            </div>
            <Button asChild size="sm" className="text-xs h-8">
              <Link href="/messages">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Medication
              </Link>
            </Button>
          </div>

          {patient.medications.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted-foreground shadow-2xs">
              No active medication reminders configured for this patient.
            </Card>
          ) : (
            <div className="space-y-2">
              {patient.medications.map((med) => (
                <Card key={med.id} className="p-3 shadow-2xs flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">{med.medicationName}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Dosage: {med.dosage} &bull; {med.frequency} at {med.scheduledTime.slice(0, 5)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Course: {med.startDate} to {med.endDate}
                    </p>
                  </div>
                  <Badge variant={med.isActive ? "success" : "secondary"} className="text-[10px]">
                    {med.isActive ? "Active" : "Completed"}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* RECORD NEW VISIT MODAL DIALOG */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Record New Return Visit for {patient.fullName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new clinical visit record without duplicating the patient profile.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordVisit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <Label htmlFor="complaint" className="text-xs font-semibold">
                Chief Complaint / Symptoms *
              </Label>
              <Input
                id="complaint"
                required
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="e.g. Follow-up review, cough resolved, fever spikes"
                className="text-xs"
              />
            </div>

            {/* Quick Vitals */}
            <div className="p-2.5 bg-muted/40 rounded-lg border border-border/80 space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Today&apos;s Pediatric Vitals
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <div>
                  <Label htmlFor="wt" className="text-[10px] text-muted-foreground">
                    Weight (kg)
                  </Label>
                  <Input
                    id="wt"
                    value={wt}
                    onChange={(e) => setWt(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="ht" className="text-[10px] text-muted-foreground">
                    Height (cm)
                  </Label>
                  <Input
                    id="ht"
                    value={ht}
                    onChange={(e) => setHt(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="temp" className="text-[10px] text-muted-foreground">
                    Temp (°C)
                  </Label>
                  <Input
                    id="temp"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="spo2Val" className="text-[10px] text-muted-foreground">
                    SpO2 (%)
                  </Label>
                  <Input
                    id="spo2Val"
                    value={spo2Val}
                    onChange={(e) => setSpo2Val(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div>
                  <Label htmlFor="pulse" className="text-[10px] text-muted-foreground">
                    Pulse (BPM)
                  </Label>
                  <Input
                    id="pulse"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="text-xs font-mono h-8"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="diagnosis" className="text-xs font-semibold">
                Clinical Diagnosis
              </Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. URTI resolving, bronchitis under control"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rx" className="text-xs font-semibold">
                Prescription &amp; Advice
              </Label>
              <Textarea
                id="rx"
                rows={2}
                value={rx}
                onChange={(e) => setRx(e.target.value)}
                placeholder="e.g. Continue saline drops, stop paracetamol if afebrile x 24h."
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVisitDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={visitLoading}
                size="sm"
                className="bg-primary text-primary-foreground text-xs shadow-md font-semibold"
              >
                {visitLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Recording...
                  </span>
                ) : (
                  "Save Visit to Chart"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
