"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Baby,
  User,
  Stethoscope,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Loader2,
  History,
  FilePlus2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  preScreenDuplicateAction,
  registerPatientAndVisitAction,
  type RegistrationFormValues,
} from "@/app/actions/patients";
import type { DuplicateDetectionResult } from "@/lib/patient-duplicate";
import { isValidIndianMobile } from "@/lib/validators/phone";

export default function NewPatientRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from query params (e.g. from converting an enquiry)
  const initialChildName = searchParams.get("childName") || "";
  const initialParentName = searchParams.get("parentName") || "";
  const initialPhone = searchParams.get("phone")?.replace("+91", "") || "";
  const initialComplaint = searchParams.get("reason") || "";
  const enquiryId = searchParams.get("enquiryId");

  const [loading, setLoading] = React.useState(false);
  const [duplicateResult, setDuplicateResult] = React.useState<DuplicateDetectionResult | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false);
  const [pendingFormData, setPendingFormData] = React.useState<RegistrationFormValues | null>(null);

  // Form states
  const [guardianName, setGuardianName] = React.useState(initialParentName);
  const [guardianPhone, setGuardianPhone] = React.useState(initialPhone);
  const [guardianEmail, setGuardianEmail] = React.useState("");
  const [guardianAddress, setGuardianAddress] = React.useState("");
  const [relationship, setRelationship] = React.useState("Mother");

  const [childName, setChildName] = React.useState(initialChildName);
  const [dateOfBirth, setDateOfBirth] = React.useState("2022-06-15");
  const [gender, setGender] = React.useState<"male" | "female" | "other">("male");
  const [bloodGroup, setBloodGroup] = React.useState<"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-">("B+");
  const [allergies, setAllergies] = React.useState("");
  const [medicalNotes, setMedicalNotes] = React.useState("");

  const [chiefComplaint, setChiefComplaint] = React.useState(initialComplaint || "Pediatric consultation & wellness check");
  const [doctorName, setDoctorName] = React.useState("Dr. Ananya Roy");
  const [weightKg, setWeightKg] = React.useState("16.2");
  const [heightCm, setHeightCm] = React.useState("104");
  const [tempC, setTempC] = React.useState("37.0");
  const [spo2, setSpo2] = React.useState("99");
  const [pulseBpm, setPulseBpm] = React.useState("94");
  const [prescription, setPrescription] = React.useState("");
  const [whatsappConsent, setWhatsappConsent] = React.useState(true);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidIndianMobile(guardianPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number for the guardian.");
      return;
    }

    if (!childName.trim()) {
      setErrorMessage("Child's full name is required.");
      return;
    }

    const payload: RegistrationFormValues = {
      guardianName,
      guardianPhone,
      guardianEmail,
      guardianAddress,
      relationship,
      childName,
      dateOfBirth,
      gender,
      bloodGroup,
      allergies,
      medicalNotes,
      chiefComplaint,
      doctorName,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      heightCm: heightCm ? parseFloat(heightCm) : undefined,
      tempC: tempC ? parseFloat(tempC) : undefined,
      spo2: spo2 ? parseInt(spo2) : undefined,
      pulseBpm: pulseBpm ? parseInt(pulseBpm) : undefined,
      prescription,
      whatsappConsent,
    };

    setPendingFormData(payload);
    setLoading(true);

    try {
      // 1. RUN PRE-SCREEN DUPLICATE DETECTION
      const dupCheck = await preScreenDuplicateAction({
        guardianPhone,
        childName,
        dateOfBirth,
      });

      if (dupCheck.hasMatch && dupCheck.matchedPatient) {
        // Show Possible Existing Patient dialog
        setDuplicateResult(dupCheck);
        setDuplicateDialogOpen(true);
        setLoading(false);
        return;
      }

      // No exact match, proceed to save directly
      await finalizeRegistration(payload);
    } catch {
      setErrorMessage("Registration failed. Please check entries and retry.");
      setLoading(false);
    }
  }

  async function finalizeRegistration(
    payload: RegistrationFormValues,
    options?: { useExistingPatientId?: string }
  ) {
    setLoading(true);
    setDuplicateDialogOpen(false);

    try {
      const result = await registerPatientAndVisitAction(payload, options);
      if (result.success && result.patientId) {
        router.push(`/patients/${result.patientId}`);
      } else {
        setErrorMessage(result.error || "Failed to record patient registration.");
        setLoading(false);
      }
    } catch {
      setErrorMessage("Network error during save. Please retry.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/patients"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Patient Directory
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            New Patient &amp; Visit Registration
            {enquiryId && (
              <Badge variant="coral" className="text-xs">
                Converted from Enquiry
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">
            Combined registration of parent/guardian, child profile, and initial clinical outpatient visit.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleInitialSubmit} className="space-y-6">
        {/* SECTION 1: PARENT / GUARDIAN */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Step 1: Guardian / Parent Information
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                Unique Phone (E.164)
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Primary contact for WhatsApp reminders, digital invoices, and consent management.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="guardianName" className="text-xs font-semibold">
                  Guardian Full Name *
                </Label>
                <Input
                  id="guardianName"
                  required
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guardianPhone" className="text-xs font-semibold flex items-center justify-between">
                  <span>Mobile Phone Number (+91 E.164) *</span>
                  <span className="text-[10px] text-muted-foreground">WhatsApp Primary</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="guardianPhone"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="98200 11001"
                    className="pl-12 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="relationship" className="text-xs font-semibold">
                  Relationship to Child
                </Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger id="relationship" className="text-xs">
                    <SelectValue placeholder="Relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Grandparent">Grandparent</SelectItem>
                    <SelectItem value="Guardian">Legal Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guardianEmail" className="text-xs font-semibold">
                  Email Address (Optional)
                </Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="guardianAddress" className="text-xs font-semibold">
                  Residential Area / Address
                </Label>
                <Input
                  id="guardianAddress"
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                  placeholder="e.g. Andheri West, Mumbai"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: CHILD / PATIENT */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                Step 2: Child Patient Profile
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                One Patient = One Record
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Every child has a unique permanent patient code (e.g. PT-2026-000001).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="childName" className="text-xs font-semibold">
                  Child&apos;s Full Name *
                </Label>
                <Input
                  id="childName"
                  required
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth" className="text-xs font-semibold">
                  Date of Birth *
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-semibold">
                  Gender *
                </Label>
                <Select value={gender} onValueChange={(v: "male" | "female" | "other") => setGender(v)}>
                  <SelectTrigger id="gender" className="text-xs">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bloodGroup" className="text-xs font-semibold">
                  Blood Group
                </Label>
                <Select value={bloodGroup} onValueChange={(v: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-") => setBloodGroup(v)}>
                  <SelectTrigger id="bloodGroup" className="text-xs">
                    <SelectValue placeholder="Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="allergies" className="text-xs font-semibold">
                  Known Allergies (Comma separated)
                </Label>
                <Input
                  id="allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Egg, Lactose"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medicalNotes" className="text-xs font-semibold">
                Permanent Clinical Notes &amp; History
              </Label>
              <Textarea
                id="medicalNotes"
                rows={2}
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="e.g. Born premature at 34 weeks, history of mild febrile seizures in 2024, regular inhaler user."
                className="text-xs resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: INITIAL VISIT & CLINICAL VITALS */}
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Step 3: Initial Outpatient Visit &amp; Pediatric Vitals
              </CardTitle>
              <Badge variant="coral" className="text-[10px]">
                OPD Entry
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Every return visit creates a new row in visits timeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="chiefComplaint" className="text-xs font-semibold">
                  Chief Complaint / Reason for Visit *
                </Label>
                <Input
                  id="chiefComplaint"
                  required
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. High fever for 2 days, persistent cough, vaccination"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="doctorName" className="text-xs font-semibold">
                  Attending Pediatrician
                </Label>
                <Select value={doctorName} onValueChange={setDoctorName}>
                  <SelectTrigger id="doctorName" className="text-xs">
                    <SelectValue placeholder="Doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Ananya Roy">Dr. Ananya Roy (Chief Neonatologist)</SelectItem>
                    <SelectItem value="Dr. Rahul Deshpande">Dr. Rahul Deshpande (Pulmonology)</SelectItem>
                    <SelectItem value="Dr. Meenakshi Sundaram">Dr. Meenakshi Sundaram (Developmental)</SelectItem>
                    <SelectItem value="Dr. Tanvi Shah">Dr. Tanvi Shah (Pediatric Surgery)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/80 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Pediatric Vitals (Measured at Nurse Station)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="weightKg" className="text-[11px] text-muted-foreground">
                    Weight (kg) *
                  </Label>
                  <Input
                    id="weightKg"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="heightCm" className="text-[11px] text-muted-foreground">
                    Height (cm)
                  </Label>
                  <Input
                    id="heightCm"
                    type="number"
                    step="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tempC" className="text-[11px] text-muted-foreground">
                    Temp (°C)
                  </Label>
                  <Input
                    id="tempC"
                    type="number"
                    step="0.1"
                    value={tempC}
                    onChange={(e) => setTempC(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="spo2" className="text-[11px] text-muted-foreground">
                    SpO2 (%)
                  </Label>
                  <Input
                    id="spo2"
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pulseBpm" className="text-[11px] text-muted-foreground">
                    Pulse (BPM)
                  </Label>
                  <Input
                    id="pulseBpm"
                    type="number"
                    value={pulseBpm}
                    onChange={(e) => setPulseBpm(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prescription" className="text-xs font-semibold">
                Initial Treatment / Prescription Notes
              </Label>
              <Textarea
                id="prescription"
                rows={2}
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="e.g. Syrup Paracetamol 250mg/5ml - 3.5ml TDS x 3 days, Nasal Saline drops SOS."
                className="text-xs resize-none"
              />
            </div>

            {/* WhatsApp Consent */}
            <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/50 dark:bg-teal-950/20 dark:border-teal-900/60 flex items-start gap-2.5">
              <Checkbox
                id="whatsappConsent"
                checked={whatsappConsent}
                onCheckedChange={(checked) => setWhatsappConsent(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="whatsappConsent"
                  className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 inline" />
                  Opt-in for Automated WhatsApp Reminders &amp; Medication Notices
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Guardian will receive reminders for upcoming appointments and booster vaccines. Recorded in consents table.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/patients">Cancel</Link>
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-md font-semibold px-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Screening Duplicates &amp; Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Register Patient &amp; Open Profile
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* DUPLICATE DETECTION MODAL DIALOG */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader className="text-left space-y-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Possible Existing Patient Found
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Our clinical safety screen detected that a patient with this matching name and date of birth is already registered under guardian phone{" "}
              <strong className="text-foreground">{duplicateResult?.matchedGuardian?.phone}</strong>.
            </DialogDescription>
          </DialogHeader>

          {duplicateResult?.matchedPatient && (
            <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50/70 dark:bg-amber-950/40 dark:border-amber-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">
                  {duplicateResult.matchedPatient.patientName}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {duplicateResult.matchedPatient.patientCode}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px]">
                <div>
                  <span className="block font-medium text-foreground">Date of Birth:</span>
                  {duplicateResult.matchedPatient.dateOfBirth} ({duplicateResult.matchedPatient.gender})
                </div>
                <div>
                  <span className="block font-medium text-foreground">Guardian:</span>
                  {duplicateResult.matchedPatient.guardianName} ({duplicateResult.matchedPatient.guardianPhone})
                </div>
              </div>

              <div className="pt-1 text-[11px] font-semibold text-primary flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                Previous Visits on Record: {duplicateResult.matchedPatient.visitCount || 1}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Per MediConnect Clinical Safety rules, records are never silently merged. Choose whether to record this new visit under the existing chart or create a brand new separate profile:
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (pendingFormData) {
                  finalizeRegistration(pendingFormData); // creates new anyway
                }
              }}
            >
              <FilePlus2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Create New Anyway (Sibling/Duplicate)
            </Button>

            <Button
              type="button"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-md font-semibold"
              onClick={() => {
                if (pendingFormData && duplicateResult?.matchedPatient) {
                  finalizeRegistration(pendingFormData, {
                    useExistingPatientId: duplicateResult.matchedPatient.id,
                  });
                }
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-accent" />
              Use Existing Patient (Record New Visit)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
