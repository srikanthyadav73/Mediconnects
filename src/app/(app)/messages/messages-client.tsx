"use client";

import React, { useState, useTransition } from "react";
import {
  MessageSquare,
  Send,
  RotateCw,
  Search,
  CheckCircle2,
  CheckCheck,
  Clock,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Play,
  Check,
  PhoneCall,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPROVED_TEMPLATES,
  type MessageLogEntry,
  type MessageTemplateItem,
} from "@/types/messaging";
import type { PatientDetailed } from "@/lib/patients-data";
import {
  sendDirectWhatsAppAction,
  retryFailedMessageAction,
  triggerManualReminderCronAction,
} from "@/app/actions/messaging";

interface MessagesClientProps {
  initialMessages: MessageLogEntry[];
  patients: PatientDetailed[];
  isWhatsAppMock: boolean;
}

export function MessagesClient({
  initialMessages,
  patients,
  isWhatsAppMock,
}: MessagesClientProps) {
  const [messages, setMessages] = useState<MessageLogEntry[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<"logs" | "templates">("logs");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Send Composer state
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(
    APPROVED_TEMPLATES[0].name
  );
  const [doctorName, setDoctorName] = useState("Dr. Ananya Roy");
  const [scheduledDate, setScheduledDate] = useState("Tomorrow");
  const [scheduledTime, setScheduledTime] = useState("10:30 AM");
  const [medicationName, setMedicationName] = useState("Amoxicillin 250mg Suspension");

  // Template Manager Preview state
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplateItem>(
    APPROVED_TEMPLATES[0]
  );
  const [previewGuardian, setPreviewGuardian] = useState("Sunita Sharma");
  const [previewChild, setPreviewChild] = useState("Aarav");

  const [isPending, startTransition] = useTransition();
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selected patient details for composer
  const currentComposerPatient = patients.find((p) => p.id === selectedPatientId);
  const hasConsent =
    currentComposerPatient?.guardian.whatsappConsent === "opted_in";

  // Filtered messages
  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.guardianName.toLowerCase().includes(search.toLowerCase()) ||
      m.patientName.toLowerCase().includes(search.toLowerCase()) ||
      m.guardianPhone.includes(search) ||
      m.templateName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return m.status === statusFilter;
  });

  // KPI aggregates
  const totalSent = messages.length;
  const deliveredCount = messages.filter((m) => m.status === "delivered" || m.status === "read").length;
  const readCount = messages.filter((m) => m.status === "read").length;
  const failedCount = messages.filter((m) => m.status === "failed").length;

  const deliveryRate = totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100;
  const readRate = deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;

  // Handle direct message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!currentComposerPatient) {
      setActionError("Please select a valid patient.");
      return;
    }

    startTransition(async () => {
      const res = await sendDirectWhatsAppAction({
        guardianId: currentComposerPatient.guardian.id,
        guardianName: currentComposerPatient.guardian.name,
        guardianPhone: currentComposerPatient.guardian.phone,
        patientName: currentComposerPatient.fullName,
        templateName: selectedTemplateName,
        parameters: {
          doctor_name: doctorName,
          date: scheduledDate,
          time: scheduledTime,
          medication_name: medicationName,
        },
      });

      if (res.success) {
        setActionSuccess("WhatsApp message successfully dispatched!");
        setComposeOpen(false);
        // Refresh local messages state
        const newEntry: MessageLogEntry = {
          id: `msg-${Date.now()}`,
          guardianId: currentComposerPatient.guardian.id,
          guardianName: currentComposerPatient.guardian.name,
          guardianPhone: currentComposerPatient.guardian.phone,
          patientName: currentComposerPatient.fullName,
          templateName: selectedTemplateName,
          messageBody: `WhatsApp Notification: ${selectedTemplateName}`,
          status: "sent",
          providerMessageId: res.messageId || "wamid.mock",
          isMock: isWhatsAppMock,
          sentAt: new Date().toISOString(),
        };
        setMessages([newEntry, ...messages]);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.error || "Failed to send message.");
      }
    });
  };

  // Handle retry
  const handleRetry = (msgId: string) => {
    setActionError(null);
    startTransition(async () => {
      const res = await retryFailedMessageAction(msgId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, status: "sent", errorMessage: undefined } : m
          )
        );
        setActionSuccess("Message re-queued and sent successfully!");
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError(res.error || "Retry attempt failed.");
      }
    });
  };

  // Handle manual cron job trigger
  const handleTriggerCron = () => {
    setActionError(null);
    startTransition(async () => {
      const res = await triggerManualReminderCronAction();
      if (res.success) {
        setActionSuccess("Reminder job executed! Checked appointments & dispatched alerts.");
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(res.error || "Cron trigger failed.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Test Mode Banner */}
      {isWhatsAppMock && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-teal-300/60 bg-teal-50/70 text-teal-950 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-7 px-2.5 items-center justify-center rounded-md bg-teal-700 text-white text-xs font-bold uppercase tracking-wider">
              Test Mode
            </span>
            <div>
              <p className="text-xs font-semibold">
                Meta WhatsApp Mock Provider Active
              </p>
              <p className="text-xs text-teal-800/90">
                All template alerts, appointment reminders, and consent checks run locally without incurring Meta API fees.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerCron}
            disabled={isPending}
            className="text-xs gap-1.5 border-teal-600/30 text-teal-900 bg-white hover:bg-teal-100"
          >
            <Play className="w-3.5 h-3.5 fill-teal-800" />
            Run Reminders Job Now
          </Button>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            WhatsApp Pediatric Messaging Center
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated 24h & 2h appointment reminders, prescription alerts, Meta template previews, and consent-guarded delivery log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setComposeOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Send className="w-4 h-4" />
            Compose Message
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Dispatched
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Utility & reminder alerts</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Delivery Success Rate
            </CardTitle>
            <CheckCheck className="w-4 h-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{deliveredCount} delivered to mobile</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Parent Read Rate
            </CardTitle>
            <Check className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{readRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{readCount} read receipts acknowledged</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Failed / Retried
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{failedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Retryable carrier errors</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Message Delivery Logs ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Meta Approved Template Manager ({APPROVED_TEMPLATES.length})
        </button>
      </div>

      {/* TAB 1: MESSAGE LOGS */}
      {activeTab === "logs" && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipient, patient, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Status:</span>
                <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
                  {["all", "read", "delivered", "sent", "failed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        statusFilter === st
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Recipient & Patient</th>
                    <th className="py-3 px-4">Template & Preview</th>
                    <th className="py-3 px-4">Sent Timestamp</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredMessages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No messages found matching search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMessages.map((msg) => (
                      <tr key={msg.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{msg.guardianName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Child: {msg.patientName} • {msg.guardianPhone}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-md">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground">
                              {msg.templateName}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {msg.messageBody}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-foreground">
                            {new Date(msg.sentAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(msg.sentAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              msg.status === "read"
                                ? "default"
                                : msg.status === "delivered"
                                ? "outline"
                                : msg.status === "sent"
                                ? "secondary"
                                : "destructive"
                            }
                            className="capitalize text-[10px]"
                          >
                            {msg.status}
                          </Badge>
                          {msg.errorMessage && (
                            <div className="text-[9px] text-rose-500 mt-0.5 truncate max-w-xs">
                              {msg.errorMessage}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {msg.status === "failed" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(msg.id)}
                              disabled={isPending}
                              className="h-7 px-2 text-xs gap-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              Retry Send
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {msg.providerMessageId ? msg.providerMessageId.slice(0, 14) + "..." : "Simulated"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TEMPLATE MANAGER & INTERACTIVE PHONE PREVIEW */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Templates Catalog */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Official Pediatric Meta Approved Templates
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select a registered template to test live parameter substitution and view WhatsApp chat rendering.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {APPROVED_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setPreviewTemplate(tpl)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    previewTemplate.id === tpl.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-xs text-foreground">
                        {tpl.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50">
                        {tpl.category}
                      </Badge>
                    </div>
                    <Badge variant="default" className="text-[10px] bg-emerald-600 text-white">
                      {tpl.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {tpl.bodyText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Mobile WhatsApp Frame Preview */}
          <div className="lg:col-span-5 sticky top-20">
            <Card className="border-border shadow-md overflow-hidden bg-slate-900 text-white rounded-2xl">
              {/* WhatsApp App Bar */}
              <div className="bg-emerald-800 p-3 flex items-center justify-between text-white border-b border-emerald-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs">
                    CB
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-bold text-xs">
                      CareBridge Children&apos;s Hospital
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div className="text-[10px] text-emerald-100">Official Business Account</div>
                  </div>
                </div>
                <PhoneCall className="w-4 h-4 text-emerald-200" />
              </div>

              {/* Chat Bubble Canvas */}
              <div className="p-4 bg-zinc-100 text-zinc-900 min-h-[340px] flex flex-col justify-end space-y-2 font-sans">
                {/* Notice Bubble */}
                <div className="text-[10px] text-center text-zinc-500 bg-amber-50/90 border border-amber-200/60 p-1.5 rounded-lg">
                  Messages are end-to-end encrypted. Healthcare diagnosis terms are strictly scrubbed.
                </div>

                {/* WhatsApp Message Bubble */}
                <div className="bg-white rounded-xl p-3 shadow-xs border border-zinc-200 space-y-2 text-xs max-w-sm self-start">
                  {previewTemplate.headerText && (
                    <div className="font-bold text-teal-800 text-[11px] uppercase tracking-wide border-b border-zinc-100 pb-1">
                      {previewTemplate.headerText}
                    </div>
                  )}

                  <p className="text-zinc-800 text-xs leading-relaxed">
                    {previewTemplate.bodyText
                      .replace("{{guardian_name}}", previewGuardian)
                      .replace("{{patient_name}}", previewChild)
                      .replace("{{doctor_name}}", "Dr. Ananya Roy")
                      .replace("{{date}}", "Tomorrow, 10:30 AM")
                      .replace("{{time}}", "10:30 AM")
                      .replace("{{medication_name}}", "Amoxicillin Oral Suspension")
                      .replace("{{vaccine_name}}", "MMR Booster Dose")}
                  </p>

                  {previewTemplate.footerText && (
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-100">
                      {previewTemplate.footerText}
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-1 text-[9px] text-zinc-400">
                    <span>10:45 AM</span>
                    <CheckCheck className="w-3 h-3 text-sky-500" />
                  </div>
                </div>

                {/* Quick Reply Buttons */}
                {previewTemplate.buttons && previewTemplate.buttons.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {previewTemplate.buttons.map((btn, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white border border-teal-200 text-center font-semibold text-xs text-teal-700 shadow-xs"
                      >
                        {btn.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Param Live Tweak Toolbar */}
              <div className="p-3 bg-slate-800 border-t border-slate-700 space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live Preview Inputs:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Guardian Name</label>
                    <Input
                      value={previewGuardian}
                      onChange={(e) => setPreviewGuardian(e.target.value)}
                      className="h-7 text-xs bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Child Name</label>
                    <Input
                      value={previewChild}
                      onChange={(e) => setPreviewChild(e.target.value)}
                      className="h-7 text-xs bg-slate-900 border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Compose Pediatric WhatsApp Notification</DialogTitle>
            <DialogDescription>
              Select patient, choose approved template, and dispatch. Consent is strictly verified before send.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendMessage} className="space-y-4 pt-2">
            {/* Patient Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Select Patient & Guardian <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedPatientId}
                onValueChange={(val) => setSelectedPatientId(val)}
                required
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.fullName} ({p.patientCode}) — {p.guardian.name} ({p.guardian.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consent Status Indicator */}
            {currentComposerPatient && (
              <div
                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                  hasConsent
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {hasConsent ? (
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <UserX className="w-4 h-4 text-rose-600" />
                  )}
                  <span className="font-semibold">
                    WhatsApp Consent: {hasConsent ? "ACTIVE (Opted-in)" : "BLOCKED (No Consent)"}
                  </span>
                </div>
                <span className="text-[11px] opacity-80">
                  {hasConsent ? "Ready to dispatch" : "Messages cannot be sent"}
                </span>
              </div>
            )}

            {/* Template Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                WhatsApp Template <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedTemplateName}
                onValueChange={(val) => setSelectedTemplateName(val)}
                required
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {APPROVED_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.name} className="text-xs">
                      {t.name} ({t.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Template Parameters */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Doctor Name</label>
                <Input
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Date / Day</label>
                <Input
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Time Slot</label>
                <Input
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Medication (if applicable)</label>
                <Input
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !hasConsent}>
                {isPending ? "Sending..." : "Dispatch WhatsApp Alert"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
