"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  Receipt,
  Users,
  ShieldCheck,
  FileText,
  Save,
  Plus,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
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
import type { SessionUser } from "@/lib/auth";
import type { HospitalProfile, AuditLogItem } from "@/lib/settings-store";
import type { HospitalServiceItem } from "@/types/billing";
import type { UserRole } from "@/types/database";
import {
  updateHospitalProfileAction,
  updateServiceTariffAction,
  addServiceTariffAction,
  updateStaffRoleAction,
  addStaffUserAction,
} from "@/app/actions/settings";
import { downloadCSV } from "@/lib/csv-export";

interface SettingsClientProps {
  currentUser: SessionUser | null;
  initialProfile: HospitalProfile;
  initialTariffs: HospitalServiceItem[];
  initialStaff: SessionUser[];
  auditLogs: AuditLogItem[];
}

export function SettingsClient({
  currentUser,
  initialProfile,
  initialTariffs,
  initialStaff,
  auditLogs,
}: SettingsClientProps) {
  const isAdmin = currentUser?.role === "admin";
  const [activeTab, setActiveTab] = useState<
    "profile" | "tariffs" | "staff" | "audit" | "privacy"
  >("profile");

  // Hospital Profile State
  const [profile, setProfile] = useState<HospitalProfile>(initialProfile);

  // Tariffs State
  const [tariffs, setTariffs] = useState<HospitalServiceItem[]>(initialTariffs);
  const [editingFee, setEditingFee] = useState<{ [id: string]: number }>({});
  const [newServiceOpen, setNewServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Consultation");
  const [newServiceFee, setNewServiceFee] = useState("750");

  // Staff State
  const [staff, setStaff] = useState<SessionUser[]>(initialStaff);
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<UserRole>("doctor");

  // Audit Logs State
  const [auditSearch, setAuditSearch] = useState("");

  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.actorName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.recordRef.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // 1. Save Hospital Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateHospitalProfileAction(profile);
      if (res.success && res.profile) {
        setProfile(res.profile);
        setSuccessMessage("Hospital profile successfully updated.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to update profile.");
      }
    });
  };

  // 2. Save Service Fee
  const handleSaveFee = (serviceId: string) => {
    const fee = editingFee[serviceId];
    if (fee === undefined || fee < 0) return;
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateServiceTariffAction(serviceId, fee);
      if (res.success && res.tariffs) {
        setTariffs(res.tariffs);
        setSuccessMessage("Tariff updated successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to update tariff.");
      }
    });
  };

  // 3. Add Service
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const feeNum = parseFloat(newServiceFee) || 0;
    startTransition(async () => {
      const res = await addServiceTariffAction({
        name: newServiceName,
        category: newServiceCategory,
        defaultFee: feeNum,
      });
      if (res.success && res.tariffs) {
        setTariffs(res.tariffs);
        setNewServiceOpen(false);
        setNewServiceName("");
        setSuccessMessage("Service added to hospital master catalog.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to add service.");
      }
    });
  };

  // 4. Update Staff Role
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await updateStaffRoleAction(userId, newRole);
      if (res.success && res.staff) {
        setStaff(res.staff);
        setSuccessMessage("Staff role updated.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to update role.");
      }
    });
  };

  // 5. Add Staff User
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await addStaffUserAction({
        email: newStaffEmail,
        fullName: newStaffName,
        role: newStaffRole,
      });
      if (res.success && res.staff) {
        setStaff(res.staff);
        setNewStaffOpen(false);
        setNewStaffEmail("");
        setNewStaffName("");
        setSuccessMessage("Staff account added successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || "Failed to add staff.");
      }
    });
  };

  // Export Audit Log CSV
  const handleExportAuditLogs = () => {
    const headers = ["Timestamp", "Staff Actor", "Role", "Action", "Table", "Record Ref", "IP Address", "Details"];
    const rows = filteredAuditLogs.map((l) => [
      l.timestamp,
      l.actorName,
      l.actorRole,
      l.action,
      l.tableName,
      l.recordRef,
      l.ipAddress,
      l.details,
    ]);
    downloadCSV("MediConnect_Audit_Compliance_Log", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Hospital Settings &amp; Administration
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
              Admin Console
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Hospital master profile, service tariffs, role-based access control, and compliance audit trail.
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
              Hospital Security
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Clinical Governance <span className="text-orange-500 font-normal">🛡️</span>
            </span>
          </div>
        </div>

        {/* Right: CTA Action */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setNewStaffOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Staff User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMessage}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-border space-x-6 overflow-x-auto">
        {[
          { id: "profile", label: "Hospital Profile", icon: Building2 },
          { id: "tariffs", label: "Tariff Master & Fees", icon: Receipt },
          { id: "staff", label: "Staff & Roles", icon: Users },
          { id: "audit", label: "Audit Log Trail", icon: ShieldCheck },
          { id: "privacy", label: "DPDP & Privacy Notice", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "profile" | "tariffs" | "staff" | "audit" | "privacy")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: HOSPITAL PROFILE */}
      {activeTab === "profile" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Hospital Entity Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Official clinical center identifiers, GSTIN, and pediatric contact helplines printed on tax receipts and reports.
                </CardDescription>
              </div>
              {!isAdmin && (
                <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-800 bg-amber-50">
                  <Lock className="w-3 h-3" /> Read Only (Admin Required)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hospital Name</label>
                  <Input
                    value={profile.hospitalName}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, hospitalName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tagline / Mission</label>
                  <Input
                    value={profile.tagline}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Registration / Clinical License</label>
                  <Input
                    value={profile.registrationNumber}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">GSTIN (India Tax ID)</label>
                  <Input
                    value={profile.gstin}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Accreditation Level</label>
                  <Input
                    value={profile.nabhAccreditation}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, nabhAccreditation: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">WhatsApp Sender Number</label>
                  <Input
                    value={profile.whatsappNumber}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, whatsappNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Premises Address</label>
                  <Input
                    value={profile.address}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">City & State</label>
                  <Input
                    value={`${profile.city}, ${profile.state}`}
                    disabled={!isAdmin}
                    onChange={(e) => {
                      const [city, state] = e.target.value.split(",");
                      setProfile({ ...profile, city: city?.trim() || "", state: state?.trim() || "" });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">PIN Code</label>
                  <Input
                    value={profile.pincode}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">24x7 Helpline Phone</label>
                  <Input
                    value={profile.helplinePhone}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, helplinePhone: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Operating Hours</label>
                  <Input
                    value={profile.operatingHours}
                    disabled={!isAdmin}
                    onChange={(e) => setProfile({ ...profile, operatingHours: e.target.value })}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-3">
                  <Button type="submit" disabled={isPending} className="gap-2">
                    <Save className="w-4 h-4" />
                    {isPending ? "Saving Profile..." : "Save Hospital Profile"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TARIFF MASTER & SERVICES */}
      {activeTab === "tariffs" && (
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Hospital Tariff &amp; Clinical Services Catalog
              </CardTitle>
              <CardDescription className="text-xs">
                Manage pediatric consultations, vaccination bundles, nebulization procedures, and standard fees.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setNewServiceOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Tariff Service
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Service Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Default Rate (₹)</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tariffs.map((srv) => (
                    <tr key={srv.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{srv.name}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {srv.category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            <span>₹</span>
                            <Input
                              type="number"
                              min="0"
                              defaultValue={srv.defaultFee}
                              onChange={(e) =>
                                setEditingFee({
                                  ...editingFee,
                                  [srv.id]: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-24 h-7 text-xs text-right"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-foreground">
                            ₹{srv.defaultFee.toFixed(2)}
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSaveFee(srv.id)}
                            disabled={editingFee[srv.id] === undefined || isPending}
                            className="h-7 px-2 text-xs"
                          >
                            Save
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: STAFF & ROLE MANAGEMENT (ADMIN ONLY) */}
      {activeTab === "staff" && (
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Staff Accounts &amp; Role-Based Access Control
              </CardTitle>
              <CardDescription className="text-xs">
                Manage roles (Admin, Doctor, Receptionist). Security policies are strictly enforced via RLS.
              </CardDescription>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setNewStaffOpen(true)}
                className="gap-1.5 text-xs h-8"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Staff User
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {!isAdmin ? (
              <div className="p-8 text-center space-y-2">
                <Lock className="w-8 h-8 mx-auto text-amber-600" />
                <h3 className="font-bold text-sm text-foreground">Admin Access Required</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Staff account creation and role elevation is restricted to Chief Medical Officers and Hospital Administrators.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Staff Member</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Assigned Role</th>
                      <th className="py-2.5 px-4 text-right">Elevate / Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {staff.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-4 font-semibold text-foreground">{u.fullName}</td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground">{u.email}</td>
                        <td className="py-2.5 px-4">
                          <Badge
                            variant={
                              u.role === "admin"
                                ? "default"
                                : u.role === "doctor"
                                ? "outline"
                                : "secondary"
                            }
                            className="capitalize text-[10px]"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Select
                            value={u.role}
                            onValueChange={(val: UserRole) => handleRoleChange(u.id, val)}
                            disabled={isPending || u.id === currentUser?.id}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                              <SelectItem value="doctor" className="text-xs">Doctor</SelectItem>
                              <SelectItem value="receptionist" className="text-xs">Receptionist</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: AUDIT LOG TRAIL */}
      {activeTab === "audit" && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter audit actions, staff, records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportAuditLogs}
                  className="text-xs h-8 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Audit CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Staff Actor</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Table &amp; Ref</th>
                    <th className="py-2.5 px-4">IP Address</th>
                    <th className="py-2.5 px-4">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No audit events matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-foreground">{log.actorName}</div>
                          <Badge variant="outline" className="text-[9px] capitalize py-0 px-1">
                            {log.actorRole}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-teal-800 text-[11px]">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">
                          {log.tableName} / {log.recordRef}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">
                          {log.ipAddress}
                        </td>
                        <td className="py-2.5 px-4 text-foreground/90 max-w-sm">
                          {log.details}
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

      {/* TAB 5: DPDP & PRIVACY COMPLIANCE NOTICE */}
      {activeTab === "privacy" && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Pediatric Data Protection &amp; WhatsApp Privacy Architecture
            </CardTitle>
            <CardDescription className="text-xs">
              Compliance standards adhering to India Digital Personal Data Protection (DPDP) Act 2023 and NABH guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 space-y-2">
              <h4 className="font-bold text-sm text-teal-900">
                1. Strict Clinical Diagnosis Scrubbing
              </h4>
              <p>
                To protect child confidentiality and prevent exposure on parental messaging lock screens,
                diagnoses and clinical condition keywords (such as asthma, pneumonia, or infectious markers) are
                <strong> strictly prohibited and scrubbed from all outbound WhatsApp notifications</strong>.
                Messages are limited to operational utility details (doctor name, appointment time, clinic desk).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
              <h4 className="font-bold text-sm text-amber-900">
                2. Explicit Consent Architecture &amp; 1-Click WhatsApp Opt-Out
              </h4>
              <p>
                WhatsApp communications require an explicit opt-in consent record. Parents can opt-out at any time
                by replying <strong>STOP</strong> or <strong>UNSUBSCRIBE</strong> to the WhatsApp sender.
                The inbound webhook immediately records an <code>opted_out</code> consent event, automatically blocking
                all future promotional and reminder broadcasts until re-authorized.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-950 space-y-2">
              <h4 className="font-bold text-sm text-sky-900">
                3. Immutable Guardian-Child Linking &amp; Zero Silent Merges
              </h4>
              <p>
                A child patient is registered once. Return visits are recorded as new rows in the <code>visits</code>
                table. When registering new patients, the duplicate detection engine screens guardian phone number
                and child name/DOB, presenting a confirmation dialog to prevent accidental record collisions or silent overwrites.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Tariff Dialog */}
      <Dialog open={newServiceOpen} onOpenChange={setNewServiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Clinical Tariff Service</DialogTitle>
            <DialogDescription>
              Register a pediatric consultation, procedure, or diagnostic charge in the billing master.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Service Name</label>
              <Input
                placeholder="e.g. Pediatric Echocardiography (Color Doppler)"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Category</label>
              <Select value={newServiceCategory} onValueChange={setNewServiceCategory}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation" className="text-xs">Consultation</SelectItem>
                  <SelectItem value="Immunization" className="text-xs">Immunization</SelectItem>
                  <SelectItem value="Procedure" className="text-xs">Procedure</SelectItem>
                  <SelectItem value="Laboratory" className="text-xs">Laboratory</SelectItem>
                  <SelectItem value="Emergency" className="text-xs">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Default Rate (INR ₹)</label>
              <Input
                type="number"
                min="0"
                value={newServiceFee}
                onChange={(e) => setNewServiceFee(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setNewServiceOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !newServiceName.trim()}>
                {isPending ? "Adding..." : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={newStaffOpen} onOpenChange={setNewStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Hospital Staff Account</DialogTitle>
            <DialogDescription>
              Provide staff email, name, and clinical access role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Staff Full Name</label>
              <Input
                placeholder="e.g. Dr. Priya Nair"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Hospital Email</label>
              <Input
                type="email"
                placeholder="e.g. priya.nair@mediconnect.in"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Role</label>
              <Select value={newStaffRole} onValueChange={(val: UserRole) => setNewStaffRole(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor" className="text-xs">Doctor (Clinical &amp; Prescriptions)</SelectItem>
                  <SelectItem value="receptionist" className="text-xs">Receptionist (Registration &amp; Billing)</SelectItem>
                  <SelectItem value="admin" className="text-xs">Admin (Chief Medical Officer &amp; All Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setNewStaffOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !newStaffName.trim() || !newStaffEmail.trim()}>
                {isPending ? "Registering..." : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. BOTTOM CONFIDENTIALITY BANNER */}
      <div className="p-3 bg-[#e8f7f4] border border-[#b2e2d8] rounded-xl flex items-center gap-2.5 text-xs text-[#0f6055] font-medium">
        <Lock className="w-4 h-4 text-[#0f766e] shrink-0" />
        <span>Administrative settings and credential logs are recorded in the immutable compliance audit trail.</span>
      </div>
    </div>
  );
}