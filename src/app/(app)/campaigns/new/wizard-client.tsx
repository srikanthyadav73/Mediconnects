"use client";

import React, { useState, useTransition, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "@/lib/campaign-audience";
import { createCampaignAction } from "@/app/actions/campaigns";

interface WizardClientProps {
  candidates: AudienceCandidate[];
}

export function WizardClient({ candidates }: WizardClientProps) {
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

  const selectedTemplate = useMemo(
    () =>
      APPROVED_TEMPLATES.find((t) => t.name === selectedTemplateName) ||
      APPROVED_TEMPLATES[0],
    [selectedTemplateName]
  );

  // Step 4: Submission
  const handleLaunchCampaign = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await createCampaignAction({
        title,
        templateName: selectedTemplateName,
        category,
        criteria,
        audienceRecipients: audienceResult.deliverableRecipients,
        stats: {
          totalTargeted: audienceResult.totalMatchingChildren,
          dedupedCount: audienceResult.dedupedCount,
          excludedNoConsentCount: audienceResult.excludedNoConsentCount,
        },
      });

      if (res.success && res.campaign) {
        router.push(`/campaigns/${res.campaign.id}`);
      } else {
        setActionError(res.error || "Failed to launch campaign");
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
            4-step setup with automatic sibling deduplication and strict WhatsApp consent guardrails.
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
                  {selectedTemplate.headerText || "CareBridge Children's Hospital"}
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

      {/* STEP 3: AUDIENCE BUILDER & LIVE DEDUPLICATION */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Step 3: Audience Filters & Guardian Deduplication
              </CardTitle>
              <CardDescription className="text-xs">
                Filter by child age, gender, visit date, or balance. Sibling deduplication ensures one message per parent.
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

              {/* LIVE AUDIENCE BREAKDOWN STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-950">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                    Total Matching Children
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
                    Deliverable Guardians
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    ={audienceResult.finalDeliverableCount}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Net Recipients</div>
                </div>
              </div>

              {/* Deliverable Recipients Preview Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Audience Recipient Preview ({audienceResult.finalDeliverableCount} guardians)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    One message per parent phone number
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Guardian Name</th>
                        <th className="py-2 px-3">Phone Number</th>
                        <th className="py-2 px-3">Child Name</th>
                        <th className="py-2 px-3 text-right">Consent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {audienceResult.deliverableRecipients.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No guardians match current criteria.
                          </td>
                        </tr>
                      ) : (
                        audienceResult.deliverableRecipients.map((r, i) => (
                          <tr key={i} className="hover:bg-muted/30">
                            <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                            <td className="py-2 px-3 font-semibold text-foreground">{r.guardianName}</td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">{r.guardianPhone}</td>
                            <td className="py-2 px-3 text-foreground">{r.childName}</td>
                            <td className="py-2 px-3 text-right">
                              <Badge variant="default" className="text-[9px] bg-emerald-600">
                                Opted In
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={audienceResult.finalDeliverableCount === 0}
                  className="gap-2"
                >
                  Review & Confirm Launch
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM LAUNCH */}
      {currentStep === 4 && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 4: Review & Confirm Launch</CardTitle>
            <CardDescription className="text-xs">
              Confirm campaign details before dispatching WhatsApp notifications to {audienceResult.finalDeliverableCount} parents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Campaign Title:</span>
                <span className="font-bold text-foreground text-sm">{title}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Category:</span>
                <span className="capitalize font-semibold text-foreground">{category}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Approved Meta Template:</span>
                <span className="font-mono font-semibold text-teal-800">{selectedTemplateName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Age Filter:</span>
                <span>{minAge} to {maxAge} years</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Target Recency:</span>
                <span>{visitedDays > 0 ? `Visited within ${visitedDays} days` : "Any visit date"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Deduped Sibling Children:</span>
                <span className="font-semibold text-teal-700">
                  {audienceResult.dedupedCount} siblings deduplicated
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-border">
                <span className="text-muted-foreground">Excluded for No Consent:</span>
                <span className="font-semibold text-rose-600">
                  {audienceResult.excludedNoConsentCount} guardians skipped
                </span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-emerald-800">
                <span>Final Deliverable Guardians:</span>
                <span>{audienceResult.finalDeliverableCount} Recipients</span>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isPending}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Audience
              </Button>
              <Button
                onClick={handleLaunchCampaign}
                disabled={isPending || audienceResult.finalDeliverableCount === 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Dispatching Campaign...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Launch Campaign ({audienceResult.finalDeliverableCount})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
