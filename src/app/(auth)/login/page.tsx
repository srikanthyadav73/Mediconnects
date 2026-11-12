"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  HeartHandshake,
  ShieldCheck,
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Sparkles,
  Eye,
  EyeOff,
  Activity,
  MessageSquare,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loginStaffAction, loginDemoRoleAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [roleLoading, setRoleLoading] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await loginStaffAction(null, formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleDemoLogin(role: "admin" | "doctor" | "receptionist") {
    setRoleLoading(role);
    await loginDemoRoleAction(role);
  }

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
      {/* ============================================================ */}
      {/* LEFT COLUMN: HERO SHOWCASE (Visible on Desktop / Large Screens) */}
      {/* ============================================================ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 text-white overflow-hidden border-r border-teal-800/40">
        {/* Ambient Animated Blurred Glow Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, 30, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.15, 1],
                  }
            }
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-500/25 blur-3xl"
          />
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    x: [0, -35, 0],
                    y: [0, 35, 0],
                    scale: [1, 1.1, 1],
                  }
            }
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-10 right-0 w-[32rem] h-[32rem] rounded-full bg-orange-500/20 blur-3xl"
          />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-emerald-400/15 blur-3xl" />

          {/* SVG Tech Grid Texture */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* Top Header: Brand & Live Hospital Status */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-300 flex items-center justify-center text-teal-950 shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
              <HeartHandshake className="h-7 w-7 text-teal-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">
                  MediConnect
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  Pediatric CRM
                </span>
              </div>
              <p className="text-xs text-teal-200/80 font-medium">
                Children&apos;s Hospital Clinical &amp; Operations
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-teal-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span>Hospital Node #1 Online</span>
          </div>
        </div>

        {/* Center Content: Inspiring Pediatric Headline & Live Cards */}
        <div className="relative z-10 my-auto py-8 space-y-7 max-w-xl">
          {/* Section Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-600/40 text-teal-200 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>NABH Accredited Pediatric Center of Excellence</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] text-white">
            Where Gentle Care Meets{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-emerald-300 to-amber-200">
              Clinical Precision.
            </span>
          </h1>

          <p className="text-sm xl:text-base text-teal-100/80 leading-relaxed font-normal">
            Unified outpatient clinic scheduling, conflict-free doctor slots, automated WhatsApp queue updates, and DPDP-compliant parent communication built for pediatric workflows.
          </p>

          {/* 3 Interactive Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* Card 1: Fast-Track Triage */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Live Active
                </span>
              </div>
              <div className="text-xl font-extrabold text-white">~15 Min</div>
              <div className="text-xs text-teal-200/90 font-medium">Fast-Track OPD Triage</div>
              <div className="text-[11px] text-teal-300/70 mt-1">Zero wait time for fever emergencies</div>
            </div>

            {/* Card 2: WhatsApp Reminders */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg hover:bg-white/15 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-300/20 text-teal-200 border border-teal-300/30">
                  99.4% Rate
                </span>
              </div>
              <div className="text-xl font-extrabold text-white">WhatsApp Synced</div>
              <div className="text-xs text-teal-200/90 font-medium">Automated Parent Updates</div>
              <div className="text-[11px] text-teal-300/70 mt-1">24h &amp; 2h reminders with token queues</div>
            </div>
          </div>

          {/* Pediatric Care Trust Banner */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-teal-800/40 via-white/10 to-transparent border border-white/15">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-white/30 shadow-md">
              <Image
                src="/images/child-teddy-banner.jpg"
                alt="Happy Child"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>45,000+ Pediatric Consultations</span>
                <span className="text-amber-300">★ 4.9</span>
              </div>
              <p className="text-teal-200/80 text-[11px] mt-0.5">
                Protected by strict DPDP privacy, zero diagnosis scrubbing, and role-based staff guardrails.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Clinical Compliance Badges */}
        <div className="relative z-10 pt-6 border-t border-teal-800/50 flex items-center justify-between text-xs text-teal-200/70">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>NABH Hospital Grade</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-teal-300" />
              <span>DPDP Act (2023) Encrypted</span>
            </span>
          </div>
          <span>v2.6 Enterprise</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: INTERACTIVE STAFF LOGIN CONSOLE */}
      {/* ============================================================ */}
      <div className="w-full lg:w-1/2 xl:w-5/12 relative flex flex-col justify-center items-center p-6 sm:p-10 md:p-12 bg-gradient-to-b from-slate-50 via-white to-teal-50/30 dark:from-slate-950 dark:via-background dark:to-teal-950/20 overflow-y-auto">
        {/* Soft Background Accent Circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-200/20 dark:bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-orange-200/20 dark:bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Mobile-Only Header Brand Logo */}
          <div className="text-center lg:hidden space-y-2 mb-2">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md transition-transform group-hover:scale-105">
                <HeartHandshake className="h-6 w-6 text-accent" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
                  MediConnect
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Pediatric CRM
                  </span>
                </span>
                <p className="text-xs text-muted-foreground font-medium">
                  Children&apos;s Hospital Clinical &amp; Operations
                </p>
              </div>
            </Link>
          </div>

          {/* Main Login Card */}
          <Card className="shadow-2xl shadow-teal-900/5 border-slate-200/80 dark:border-slate-800 backdrop-blur-xl bg-white/95 dark:bg-slate-900/90 rounded-3xl overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6 px-6 sm:px-8 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Staff Portal Login
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in to your authorized hospital operations desk
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 text-[11px] font-semibold py-1 px-2.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Restricted Access</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6 sm:p-8">
              {error && (
                <div className="p-3.5 text-xs rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2.5 animate-in fade-in-50 duration-200">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Authentication failed: </span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Standard Credentials Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Staff Hospital Email
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="name@carebridge.in"
                      className="pl-10 h-11 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-2 focus:ring-teal-600 font-medium"
                      defaultValue="admin@carebridge.in"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Security Password
                    </Label>
                    <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                      Confidential
                    </span>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 transition-all focus:ring-2 focus:ring-teal-600 font-medium"
                      defaultValue="Admin@CareBridge2026!"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || Boolean(roleLoading)}
                  className="w-full h-11 rounded-xl gap-2 font-bold text-xs bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 text-white shadow-lg shadow-teal-900/15 hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Staff Console</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              {/* 1-Click Testing Profiles Showcase */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>1-Click Testing Profiles</span>
                  </span>
                  <Badge variant="test" className="text-[10px] py-0.5 px-2 rounded-full font-bold">
                    Instant Demo Login
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Profile 1: Admin */}
                  <button
                    type="button"
                    disabled={Boolean(roleLoading) || loading}
                    onClick={() => handleDemoLogin("admin")}
                    className="p-3 rounded-2xl border border-teal-200/90 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/70 dark:hover:bg-teal-900/50 text-left transition-all hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-7 w-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                        {roleLoading === "admin" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-200/60 dark:bg-teal-800 text-teal-800 dark:text-teal-200">
                        Full
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Admin</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dr. Ananya Roy</div>
                    </div>
                  </button>

                  {/* Profile 2: Doctor */}
                  <button
                    type="button"
                    disabled={Boolean(roleLoading) || loading}
                    onClick={() => handleDemoLogin("doctor")}
                    className="p-3 rounded-2xl border border-sky-200/90 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/70 dark:hover:bg-sky-900/50 text-left transition-all hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-7 w-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                        {roleLoading === "doctor" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Stethoscope className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-200/60 dark:bg-sky-800 text-sky-800 dark:text-sky-200">
                        Clinical
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Doctor</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dr. Rahul Desh.</div>
                    </div>
                  </button>

                  {/* Profile 3: Receptionist */}
                  <button
                    type="button"
                    disabled={Boolean(roleLoading) || loading}
                    onClick={() => handleDemoLogin("receptionist")}
                    className="p-3 rounded-2xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 text-left transition-all hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-7 w-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        {roleLoading === "receptionist" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                        Desk Ops
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">Reception</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Kavita S.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Public Portal Notice */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="text-amber-500 text-xs">🔒</span>
                <div>
                  Public patient registrations are restricted to hospital staff. Parents and guardians can submit appointment requests via the{" "}
                  <Link
                    href="/#appointment-form"
                    className="text-teal-700 dark:text-teal-400 font-bold hover:underline underline-offset-2"
                  >
                    public appointment portal
                  </Link>
                  .
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Return Link */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400 font-semibold transition-colors"
            >
              <span>← Return to Public Hospital Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
