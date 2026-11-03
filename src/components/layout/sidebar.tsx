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
  BarChart3,
  LogOut,
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
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Website Enquiries",
      href: "/enquiries",
      icon: Inbox,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["admin", "doctor", "receptionist"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "doctor", "receptionist"],
    },
  ];

  // Filter based on user role
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        "w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 select-none",
        className
      )}
    >
      {/* Hospital Logo & Brand matching target design */}
      <div>
        <div className="h-18 px-5 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex items-center justify-center shrink-0 h-10 w-10">
            <svg viewBox="0 0 44 44" className="w-full h-full drop-shadow-xs" fill="none">
              <path
                d="M22 39C20.8 39 8.5 29 4.8 21.2C1.5 14.5 3.2 6.8 9.8 4.6C15.3 3 19.8 6.3 22 9C24.2 6.3 28.7 3 34.2 4.6C40.8 6.8 42.5 14.5 39.2 21.2C35.5 29 23.2 39 22 39Z"
                fill="#0c6961"
              />
              <rect x="19" y="13" width="6" height="18" rx="2" fill="#ff6738" />
              <rect x="13" y="19" width="18" height="6" rx="2" fill="#ff6738" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
              MediConnect
            </span>
            <span className="text-[11px] font-semibold text-teal-700 tracking-wide leading-none">
              Children&apos;s Hospital
            </span>
          </div>
        </div>

        {/* Navigation list matching target design */}
        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.title}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all",
                  isActive
                    ? "bg-[#00796b] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
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

