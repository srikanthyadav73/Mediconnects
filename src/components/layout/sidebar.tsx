"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  MessageSquare,
  Megaphone,
  Inbox,
  Settings,
  Stethoscope,
  HeartHandshake,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";
import { logoutStaffAction } from "@/app/(auth)/login/actions";

interface SidebarProps {
  user: SessionUser;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ user, className, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Patients",
      href: "/patients",
      icon: Users,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Visits & Clinical",
      href: "/visits",
      icon: Stethoscope,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Appointments",
      href: "/appointments",
      icon: CalendarDays,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Billing & Invoices",
      href: "/billing",
      icon: Receipt,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "WhatsApp Messages",
      href: "/messages",
      icon: MessageSquare,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Campaigns",
      href: "/campaigns",
      icon: Megaphone,
      roles: ["admin"], // Admin only
      badge: "Admin",
    },
    {
      title: "Website Enquiries",
      href: "/enquiries",
      icon: Inbox,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Hospital Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin"], // Admin only
      badge: "Admin",
    },
  ];

  // Filter based on user role
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "w-64 border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between shrink-0 select-none",
        className
      )}
    >
      {/* Hospital Logo & Brand */}
      <div>
        <div className="h-16 px-5 border-b border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <HeartHandshake className="h-5 w-5 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5">
              CareBridge
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              Children&apos;s Hospital CRM
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Hospital Operations
          </div>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-accent"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && !isActive && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {item.badge}
                  </Badge>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Staff profile summary & logout footer */}
      <div className="p-3 border-t border-border bg-muted/20">
        <div className="p-2.5 rounded-lg bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.fullName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <Badge
              variant={
                user.role === "admin"
                  ? "default"
                  : user.role === "doctor"
                  ? "secondary"
                  : "outline"
              }
              className="capitalize text-[10px] shrink-0"
            >
              {user.role}
            </Badge>
          </div>

          <form action={logoutStaffAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2"
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </aside>
  );
}

