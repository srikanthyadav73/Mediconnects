"use client";

import React, { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Check,
  Send,
  Loader2,
  AlertCircle,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPROVED_TEMPLATES } from "@/types/messaging";
import {
  calculateCampaignAudience,
  type AudienceCandidate,
  type AudienceCriteria,
  type GuardianAudienceRow,
} from "@/lib/campaign-audience";
import {
  createCampaignAction,
  sendCampaignTestAction,
} from "@/app/actions/campaigns";
import { prepareAndSanitizeWhatsAppMessage } from "@/lib/whatsapp-consent";
import type { SessionUser } from "@/lib/auth";

interface WizardClientProps {
  candidates: AudienceCandidate[];
  currentUser?: SessionUser | null;
}

const PAGE_SIZE = 10;

export function WizardClient({ candidates, currentUser }: WizardClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Details
  const [title, setTitle] = useState("Seasonal Pediatric Asthma & Allergy Screening Camp");
  const [category, setCategory] = useState<"marketing" | "utility">("marketing");

  // Step 2: Template
  const [selectedTemplateName, setSelectedTemplateName] = useState("seasonal_pediatric_camp");

  // Step 3: Audience Criteria
  const [minAge, setMinAge] = useState<number>(0);
  const [maxAge, setMaxAge] = useState<number>(12);
  const [gender, setGender] = useState<"all" | "male" | "female">("all");
  const [visitedDays, setVisitedDays] = useState<number>(90);
  const [hasBalance, setHasBalance] = useState<boolean>(false);

  // Phase 6: Selection Table State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deselectedGuardianIds, setDeselectedGuardianIds] = useState<Set<string>>(new Set());

  // Phase 7: Send Options & Test Message State
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [sendMode, setSendMode] = useState<"now" | "later">("now");
  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [testPhone, setTestPhone] = useState<string>(currentUser?.email ? "+919820011000" : "+919820011000");
  const [testStatus, setTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestPending, setIsTestPending] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Compute live audience
  const criteria: AudienceCriteria = useMemo(
    () => ({
      minAgeYears: minAge,
      maxAgeYears: maxAge,
      gender,
      visitedWithinDays: visitedDays > 0 ? visitedDays : undefined,
      hasOutstandingBalance: hasBalance,
    }),
    [minAge, maxAge, gender, visitedDays, hasBalance]
  );

  const audienceResult = useMemo(
    () => calculateCampaignAudience(candidates, criteria),
    [candidates, criteria]
  );

  // Pure derived selected guardian IDs (consented minus deselected)
  const selectedGuardianIds = useMemo(() => {
    const set = new Set<string>();
    for (const row of audienceResult.guardianRows) {
      if (row.hasConsent && !deselectedGuardianIds.has(row.guardianId)) {
        set.add(row.guardianId);
      }
    }
    return set;
  }, [audienceResult.guardianRows, deselectedGuardianIds]);

  const selectedTemplate = useMemo(
    () =>
      APPROVED_TEMPLATES.find((t) => t.name === selectedTemplateName) ||
      APPROVED_TEMPLATES[0],
    [selectedTemplateName]
  );

  // Filtered rows by search term
  const filteredGuardianRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return audienceResult.guardianRows;
    return audienceResult.guardianRows.filter(
      (row) =>
        row.guardianName.toLowerCase().includes(query) ||
        row.guardianPhone.toLowerCase().includes(query) ||
        row.childrenNames.some((c) => c.toLowerCase().includes(query))
    );
  }, [audienceResult.guardianRows, searchTerm]);

  // Paginated rows
  const totalPages = Math.max(1, Math.ceil(filteredGuardianRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGuardianRows.slice(start, start + PAGE_SIZE);
  }, [filteredGuardianRows, currentPage]);

  // Header checkbox indeterminate logic
  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
  const eligibleConsentedInSearch = useMemo(
    () => filteredGuardianRows.filter((r) => r.hasConsent),
    [filteredGuardianRows]
  );
  const selectedCountInSearch = useMemo(
    () => eligibleConsentedInSearch.filter((r) => selectedGuardianIds.has(r.guardianId)).length,
    [eligibleConsentedInSearch, selectedGuardianIds]
  );

  const isAllSelected =
    eligibleConsentedInSearch.length > 0 &&
    selectedCountInSearch === eligibleConsentedInSearch.length;
  const isIndeterminate =
    selectedCountInSearch > 0 && selectedCountInSearch < eligibleConsentedInSearch.length;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleToggleSelectAll = () => {
    setDeselectedGuardianIds((prev) => {
      const next = new Set(prev);
      if (isAllSelected) {
        // Deselect all eligible in current search
        for (const row of eligibleConsentedInSearch) {
          next.add(row.guardianId);
        }
      } else {
        // Select all eligible in current search
        for (const row of eligibleConsentedInSearch) {
          next.delete(row.guardianId);
        }
      }
      return next;
    });
  };

  const handleToggleRow = (guardianId: string, hasConsent: boolean) => {
    if (!hasConsent) return;
    setDeselectedGuardianIds((prev) => {
      const next = new Set(prev);
      if (next.has(guardianId)) {
        next.delete(guardianId); // now selected
      } else {
        next.add(guardianId); // now deselected
      }
      return next;
    });
  };

  // Live deliverable count based on checkboxes
  const finalDeliverableCount = selectedGuardianIds.size;
  const costEstimateInRupees = (finalDeliverableCount * 0.8).toFixed(2);

  // Preview message for FIRST selected recipient
  const firstSelectedRecipient = useMemo(() => {
    const firstRow = audienceResult.guardianRows.find(
      (r) => r.hasConsent && selectedGuardianIds.has(r.guardianId)
    );
    if (firstRow) {
      return {
        guardianName: firstRow.guardianName,
        childName: firstRow.childrenNames[0] || "Child",
      };
    }
    return {
      guardianName: "Rajesh Sharma",
      childName: "Aarav",
    };
  }, [audienceResult.guardianRows, selectedGuardianIds]);

  const renderedPreviewText = useMemo(() => {
    const { sanitizedText } = prepareAndSanitizeWhatsAppMessage(
      selectedTemplate.bodyText,
      {
        guardian_name: firstSelectedRecipient.guardianName,
        patient_name: firstSelectedRecipient.childName,
        child_first_name: firstSelectedRecipient.childName,
        date: "Tomorrow at 10:00 AM",
        time_slot: "10:00 AM",
        hospital_address: "Plot 42, Sector 5, Medical Enclave, New Delhi - 110001",
      }
    );
    return sanitizedText;
  }, [selectedTemplate.bodyText, firstSelectedRecipient]);

  // Send Test Message
  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.trim().length < 8) {
      setTestStatus({ success: false, message: "Please enter a valid WhatsApp mobile number." });
      return;
    }
    setIsTestPending(true);
    setTestStatus(null);
    try {
      const res = await sendCampaignTestAction({
        templateName: selectedTemplateName,
        phone: testPhone,
        guardianName: firstSelectedRecipient.guardianName,
        childName: firstSelectedRecipient.childName,
      });
      if (res.success) {
        setTestStatus({ success: true, message: `Test message sent to ${testPhone}!` });
      } else {
        setTestStatus({ success: false, message: res.error || "Failed to dispatch test message." });
      }
    } catch (err: unknown) {
      setTestStatus({ success: false, message: (err as Error).message || "Test dispatch error." });
    } finally {
      setIsTestPending(false);
    }
  };

  // Launch Campaign
  const handleConfirmAndSend = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await createCampaignAction({
        title,
        templateName: selectedTemplateName,
        category,
        criteria,
        selectionMode: "custom",
        selectedGuardianIds: Array.from(selectedGuardianIds),
        scheduleFor: sendMode === "later" ? new Date(scheduledDateTime).toISOString() : null,
      });

      if (res.success && res.campaign) {
        setConfirmModalOpen(false);
        router.push(`/campaigns/${res.campaign.id}`);
      } else {
        setActionError(res.error || "Failed to launch campaign");
        setConfirmModalOpen(false);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            New Health Campaign Wizard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Targeted pediatric health outreach with sibling deduplication and guardian consent guardrails.
          </p>
        </div>
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="text-xs">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, title: "Details" },
          { num: 2, title: "Template" },
          { num: 3, title: "Audience Builder" },
          { num: 4, title: "Launch" },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2.5 rounded-lg border text-center transition-all ${
              currentStep === s.num
                ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                : currentStep > s.num
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold">
              Step {s.num}
            </div>
            <div className="text-xs truncate">{s.title}</div>
          </div>
        ))}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {actionError}
        </div>
      )}

      {/* STEP 1: CAMPAIGN DETAILS */}
      {currentStep === 1 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 1: Campaign Details</CardTitle>
            <CardDescription className="text-xs">
              Define the campaign objective, title, and healthcare classification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Campaign Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Pediatric Asthma & Pulmonary Screening Camp"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory("marketing")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === "marketing"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="font-bold text-xs">Marketing / Public Health Camp</div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Free screening camps, health drives, awareness advisories.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory("utility")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === "utility"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="font-bold text-xs">Clinical Utility Notice</div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Immunization reminders, vaccine booster updates, follow-up recalls.
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!title.trim()}
                className="gap-2"
              >
                Proceed to Template Selection
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: CHOOSE APPROVED META TEMPLATE */}
      {currentStep === 2 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 2: Choose Approved Meta Template</CardTitle>
            <CardDescription className="text-xs">
              Select from officially approved WhatsApp templates. Diagnoses are never included in message bodies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {APPROVED_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateName(tpl.name)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedTemplateName === tpl.name
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {tpl.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50">
                      {tpl.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {tpl.bodyText}
                  </p>
                </div>
              ))}
            </div>

            {/* Template Preview Card */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
              <div className="font-bold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-700" />
                Template Preview ({selectedTemplate.name})
              </div>
              <div className="p-3 bg-white rounded-lg border border-border shadow-2xs text-zinc-900">
                <div className="font-bold text-teal-800 text-xs mb-1">
                  {selectedTemplate.headerText || "MediConnect Children's Hospital"}
                </div>
                <div className="text-xs text-zinc-700 leading-relaxed">
                  {selectedTemplate.bodyText}
                </div>
                {selectedTemplate.footerText && (
                  <div className="text-[10px] text-zinc-500 mt-2 pt-1 border-t border-zinc-100">
                    {selectedTemplate.footerText}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} className="gap-2">
                Configure Target Audience
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: INTERACTIVE AUDIENCE BUILDER (PHASE 6) */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Step 3: Audience Filters & Guardian Selection
              </CardTitle>
              <CardDescription className="text-xs">
                Filter patients, deduplicate siblings to 1 parent message, and pick or deselect recipients individually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                {/* Age Range */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Child Age (0 to 18 yrs)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max={maxAge}
                      value={minAge}
                      onChange={(e) => setMinAge(parseInt(e.target.value) || 0)}
                      className="h-8 text-xs text-center"
                      title="Min Age"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <Input
                      type="number"
                      min={minAge}
                      max="18"
                      value={maxAge}
                      onChange={(e) => setMaxAge(parseInt(e.target.value) || 18)}
                      className="h-8 text-xs text-center"
                      title="Max Age"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Gender</label>
                  <Select
                    value={gender}
                    onValueChange={(val: "all" | "male" | "female") => setGender(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Children</SelectItem>
                      <SelectItem value="male" className="text-xs">Male</SelectItem>
                      <SelectItem value="female" className="text-xs">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Visited Within Days */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Visited Within
                  </label>
                  <Select
                    value={visitedDays.toString()}
                    onValueChange={(val) => setVisitedDays(parseInt(val))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select recency..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" className="text-xs">Any Time (All)</SelectItem>
                      <SelectItem value="30" className="text-xs">Last 30 Days</SelectItem>
                      <SelectItem value="60" className="text-xs">Last 60 Days</SelectItem>
                      <SelectItem value="90" className="text-xs">Last 90 Days</SelectItem>
                      <SelectItem value="180" className="text-xs">Last 180 Days (6m)</SelectItem>
                      <SelectItem value="365" className="text-xs">Last 365 Days (1 yr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Outstanding Balance */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">
                    Outstanding Balance
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasBalance(!hasBalance)}
                    className={`w-full h-8 px-3 rounded-md border text-xs font-medium flex items-center justify-between transition-colors ${
                      hasBalance
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{hasBalance ? "Unpaid Balance Only" : "Any Balance"}</span>
                    {hasBalance && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                </div>
              </div>

              {/* REAL-TIME STAT BAR (PHASE 6 REQUIREMENT) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-950">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Matched Children
                  </div>
                  <div className="text-2xl font-black text-teal-950">
                    {audienceResult.totalMatchingChildren}
                  </div>
                  <div className="text-[10px] text-teal-700">Satisfy age/visit criteria</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Deduped Siblings
                  </div>
                  <div className="text-2xl font-black text-teal-800">
                    -{audienceResult.dedupedCount}
                  </div>
                  <div className="text-[10px] text-teal-700">Parents with multiple kids</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    Excluded (No Consent)
                  </div>
                  <div className="text-2xl font-black text-rose-700">
                    -{audienceResult.excludedNoConsentCount}
                  </div>
                  <div className="text-[10px] text-rose-600">Opted out or unverified</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Final Recipients
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    ={finalDeliverableCount}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Net selected parents
                  </div>
                </div>
              </div>

              {/* INTERACTIVE GUARDIAN SELECTION TABLE (PHASE 6) */}
              <div className="space-y-3 pt-1">
                {/* Search Bar & Live Counter */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search guardian or child..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Selected <strong className="text-foreground">{finalDeliverableCount}</strong> of{" "}
                      {audienceResult.guardianRows.filter((r) => r.hasConsent).length} consented guardians
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            ref={selectAllCheckboxRef}
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                            title="Select all matching guardians with active consent"
                          />
                        </th>
                        <th className="py-2.5 px-3">Guardian Name</th>
                        <th className="py-2.5 px-3">Child Name(s)</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Consent Status</th>
                        <th className="py-2.5 px-3 text-right">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">
                            No guardians match current filter or search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row: GuardianAudienceRow) => {
                          const isSelected = selectedGuardianIds.has(row.guardianId);
                          return (
                            <tr
                              key={row.guardianId}
                              className={`transition-colors ${
                                !row.hasConsent
                                  ? "bg-muted/20 opacity-75"
                                  : isSelected
                                  ? "bg-primary/5 hover:bg-primary/10"
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  disabled={!row.hasConsent}
                                  checked={isSelected && row.hasConsent}
                                  onChange={() => handleToggleRow(row.guardianId, row.hasConsent)}
                                  className={`rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 ${
                                    !row.hasConsent ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                  }`}
                                  title={!row.hasConsent ? "Guardian has not given active consent" : "Toggle selection"}
                                />
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-foreground">
                                {row.guardianName}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-foreground">
                                    {row.childrenNames.join(", ")}
                                  </span>
                                  {row.childrenCount > 1 && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-teal-50 text-teal-800 border-teal-200">
                                      {row.childrenCount} siblings
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                {row.guardianPhone}
                              </td>
                              <td className="py-2.5 px-3">
                                {row.hasConsent ? (
                                  <Badge variant="default" className="text-[10px] bg-emerald-600 font-semibold">
                                    Opted In
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-rose-50 text-rose-700 border-rose-200 font-semibold gap-1"
                                    title="Consent required. Guardian cannot be selected."
                                  >
                                    <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                    Consent Required
                                  </Badge>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-muted-foreground">
                                {row.lastVisitDate
                                  ? new Date(row.lastVisitDate).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "Never"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <div>
                    Showing{" "}
                    <strong>
                      {filteredGuardianRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(currentPage * PAGE_SIZE, filteredGuardianRows.length)}
                    </strong>{" "}
                    of <strong>{filteredGuardianRows.length}</strong> matching guardians
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <span className="px-2 text-xs font-semibold text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={finalDeliverableCount === 0}
                  className="gap-2"
                >
                  Review & Confirm Launch ({finalDeliverableCount})
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 4: REVIEW & LAUNCH (PHASE 7) */}
      {currentStep === 4 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 4: Review & Confirm Launch</CardTitle>
            <CardDescription className="text-xs">
              Confirm audience, inspect real rendered WhatsApp preview, send a test message, and dispatch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Net Recipients
                </span>
                <span className="text-2xl font-black text-emerald-700">
                  {finalDeliverableCount}
                </span>
                <span className="text-[10px] text-muted-foreground block">One msg per parent</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Cost Estimate
                </span>
                <span className="text-2xl font-black text-teal-900">
                  ₹{costEstimateInRupees}
                </span>
                <span className="text-[10px] text-muted-foreground block">₹0.80 per WhatsApp message</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Template
                </span>
                <span className="text-xs font-mono font-bold text-teal-900 block truncate pt-1">
                  {selectedTemplateName}
                </span>
                <span className="text-[10px] uppercase font-semibold text-teal-700">{category}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                  Compliance
                </span>
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% Opted In
                </span>
                <span className="text-[10px] text-muted-foreground block">Zero clinical diagnosis</span>
              </div>
            </div>

            {/* Rendered Preview for FIRST Recipient */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                  WhatsApp Live Preview (First Recipient: {firstSelectedRecipient.guardianName})
                </span>
                <Badge variant="outline" className="text-[10px] font-mono bg-white">
                  Variables Populated
                </Badge>
              </div>

              <div className="p-3.5 bg-white rounded-lg border border-border shadow-2xs space-y-2 text-zinc-900 max-w-lg">
                <div className="font-bold text-teal-800 text-xs">
                  {selectedTemplate.headerText || "MediConnect Children's Hospital"}
                </div>
                <div className="text-xs text-zinc-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {renderedPreviewText}
                </div>
                {selectedTemplate.footerText && (
                  <div className="text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-100">
                    {selectedTemplate.footerText}
                  </div>
                )}
              </div>
            </div>

            {/* Test Send to Staff Number */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Send Test to My Number
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Verify formatting on your device before dispatching to parents. Exempt from campaign stats.
                  </span>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              <div className="flex items-center gap-2 max-w-md">
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+91 98200 11000"
                  className="h-8 text-xs font-mono bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSendTestMessage}
                  disabled={isTestPending}
                  className="h-8 text-xs shrink-0 font-semibold bg-white"
                >
                  {isTestPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                  Send Test
                </Button>
              </div>

              {testStatus && (
                <div
                  className={`flex items-center gap-2 p-2 rounded text-xs ${
                    testStatus.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>

            {/* Send Options: Now vs Schedule */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Dispatch Schedule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSendMode("now")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    sendMode === "now"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    Send Immediately
                  </div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Queue and dispatch to {finalDeliverableCount} parents right now.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSendMode("later")}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    sendMode === "later"
                      ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule for Later
                  </div>
                  <div className="text-[11px] opacity-80 mt-1">
                    Set a future date &amp; time for automatic dispatch.
                  </div>
                </button>
              </div>

              {sendMode === "later" && (
                <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center gap-3 mt-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-foreground block">
                      Scheduled Delivery Time (IST)
                    </span>
                    <Input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="h-8 text-xs bg-white w-60 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isPending}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Audience
              </Button>
              <Button
                onClick={() => setConfirmModalOpen(true)}
                disabled={isPending || finalDeliverableCount === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Send className="w-4 h-4" />
                {sendMode === "now"
                  ? `Send Campaign (${finalDeliverableCount})`
                  : `Schedule Campaign (${finalDeliverableCount})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASE 7: CONFIRMATION MODAL WITH COST ESTIMATE & EXPLICIT GREEN BUTTON */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {sendMode === "now" ? "Confirm Immediate Dispatch" : "Confirm Scheduled Campaign"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Please review your campaign dispatch parameters before launching.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-1.5 text-teal-950">
              <div className="flex justify-between">
                <span className="font-semibold text-teal-800">Campaign Title:</span>
                <span className="font-bold text-right truncate max-w-[200px]">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-teal-800">Meta Template:</span>
                <span className="font-mono">{selectedTemplateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-teal-800">Net Recipients:</span>
                <span className="font-bold text-emerald-800">{finalDeliverableCount} Parents</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-teal-200">
                <span className="font-bold text-teal-900">Estimated Cost:</span>
                <span className="font-black text-sm text-teal-900">₹{costEstimateInRupees}</span>
              </div>
            </div>

            {sendMode === "later" && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-[11px] flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Scheduled for:{" "}
                  <strong>{new Date(scheduledDateTime).toLocaleString("en-IN")}</strong>
                </span>
              </div>
            )}

            <div className="p-2.5 bg-muted/40 border border-border rounded-md text-[11px] text-muted-foreground">
              By confirming, WhatsApp messages will be queued with guardian-level deduplication and strict DPDP consent filtering.
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmAndSend}
              disabled={isPending || finalDeliverableCount === 0}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Dispatching...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {sendMode === "now"
                    ? `Confirm and Send ${finalDeliverableCount} Messages`
                    : `Confirm and Schedule ${finalDeliverableCount} Messages`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
