"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SessionUser } from "@/lib/auth";
import { logoutStaffAction } from "@/app/(auth)/login/actions";
import { isWhatsAppMock, isRazorpayMock, isSupabaseConfigured } from "@/lib/env";

interface TopbarProps {
  user: SessionUser;
  onOpenMobileMenu?: () => void;
}

export function Topbar({ user, onOpenMobileMenu }: TopbarProps) {
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isTestMode = isWhatsAppMock || isRazorpayMock || !isSupabaseConfigured;

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="lg:hidden h-9 w-9 text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Hospital badge / title */}
        <div className="hidden sm:flex flex-col">
          <span className="text-xs font-bold text-foreground">
            MediConnect Children&apos;s Hospital
          </span>
          <span className="text-[10px] text-muted-foreground">
            Pediatric Ward &amp; Outpatient CRM • Mumbai, India
          </span>
        </div>
      </div>

      {/* Right Actions: Test Mode Badge, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Test Mode Badge */}
        {isTestMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Test Mode Active</span>
            <span className="sm:hidden">Test</span>
          </div>
        )}

        {/* Quick Notifications Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-2 hover:bg-secondary/80 rounded-full"
            >
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {user.fullName.includes("(") ? user.fullName.split("(")[0].trim() : user.fullName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {user.fullName.includes("(")
                    ? user.fullName.split("(")[1].replace(")", "").trim()
                    : user.role === "doctor"
                    ? "Senior Pediatrician"
                    : user.role}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-xs font-semibold">{user.fullName}</p>
              <p className="text-[11px] text-muted-foreground font-normal">
                {user.email}
              </p>
              <div className="mt-1">
                <Badge variant="secondary" className="capitalize text-[10px]">
                  Role: {user.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer text-xs">
                Clinical Dashboard
              </Link>
            </DropdownMenuItem>
            {user.role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer text-xs">
                  Hospital Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <form action={logoutStaffAction}>
              <button
                type="submit"
                className="w-full text-left px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
