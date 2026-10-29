"use client";

import * as React from "react";
import Link from "next/link";
import {
  HeartHandshake,
  ShieldCheck,
  Stethoscope,
  Lock,
  Mail,
  ArrowRight,
  UserCheck,
  Sparkles,
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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-teal-50/70 via-background to-orange-50/40 p-4 sm:p-6">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md transition-transform group-hover:scale-105">
            <HeartHandshake className="h-6 w-6 text-accent" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              CareBridge
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

      <Card className="w-full max-w-md shadow-xl border-border/70 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1.5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-foreground">
              Staff Portal Login
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3 w-3 text-primary" />
              Restricted Access
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Sign in with your authorized hospital staff email and password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Staff Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@carebridge.in"
                  className="pl-9 text-sm"
                  defaultValue="admin@carebridge.in"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="pl-9 text-sm"
                  defaultValue="Admin@CareBridge2026!"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || Boolean(roleLoading)}
              className="w-full gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? "Authenticating..." : "Sign In to Staff Console"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="pt-2 border-t border-border/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                1-Click Testing Profiles
              </span>
              <Badge variant="test" className="text-[10px] py-0 px-1.5">
                Test Mode
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(roleLoading) || loading}
                onClick={() => handleDemoLogin("admin")}
                className="text-xs flex flex-col items-center py-2 h-auto gap-0.5 border-primary/30 hover:bg-primary/5 hover:border-primary"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Admin</span>
                <span className="text-[10px] text-muted-foreground">Full Access</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(roleLoading) || loading}
                onClick={() => handleDemoLogin("doctor")}
                className="text-xs flex flex-col items-center py-2 h-auto gap-0.5 border-teal-300/40 hover:bg-teal-500/5 hover:border-teal-500"
              >
                <Stethoscope className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span className="font-semibold text-foreground">Doctor</span>
                <span className="text-[10px] text-muted-foreground">Clinical</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(roleLoading) || loading}
                onClick={() => handleDemoLogin("receptionist")}
                className="text-xs flex flex-col items-center py-2 h-auto gap-0.5 border-orange-300/40 hover:bg-orange-500/5 hover:border-orange-500"
              >
                <UserCheck className="h-4 w-4 text-accent" />
                <span className="font-semibold text-foreground">Reception</span>
                <span className="text-[10px] text-muted-foreground">Desk Ops</span>
              </Button>
            </div>
          </div>

          <div className="p-3 bg-muted/40 rounded-lg text-[11px] text-muted-foreground text-center">
            🔒 Public patient registrations are restricted to hospital staff. Parents and guardians can submit appointment requests via the{" "}
            <Link href="/#appointment-form" className="text-primary font-semibold underline underline-offset-2">
              public appointment portal
            </Link>
            .
          </div>
        </CardContent>
      </Card>

      {/* Footer Link */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          ← Return to Public Hospital Website
        </Link>
      </div>
    </div>
  );
}

