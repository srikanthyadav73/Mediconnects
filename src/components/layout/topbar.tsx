"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Menu,
  Bell,
  LogOut,
  Sparkles,
  Phone,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SearchResult {
  id: string;
  code: string;
  name: string;
  age: string;
  phone: string;
  guardianName: string;
}

// Sample fallback searchable patient records for global search
const MOCK_PATIENTS: SearchResult[] = [
  { id: "44444444-4444-4444-4444-444444444401", code: "PT-2026-000001", name: "Aarav Sharma", age: "5y", phone: "+919820011001", guardianName: "Rajesh Sharma (Father)" },
  { id: "44444444-4444-4444-4444-444444444402", code: "PT-2026-000002", name: "Ananya Sharma", age: "3y", phone: "+919820011001", guardianName: "Rajesh Sharma (Father)" },
  { id: "44444444-4444-4444-4444-444444444403", code: "PT-2026-000003", name: "Rudra Patel", age: "4y", phone: "+919820011002", guardianName: "Priya Patel (Mother)" },
  { id: "44444444-4444-4444-4444-444444444405", code: "PT-2026-000005", name: "Vihaan Verma", age: "6y", phone: "+919820011003", guardianName: "Amitabh Verma (Father)" },
  { id: "44444444-4444-4444-4444-444444444408", code: "PT-2026-000008", name: "Kabir Malhotra", age: "8y", phone: "+919820011005", guardianName: "Vikram Malhotra (Father)" },
  { id: "44444444-4444-4444-4444-444444444409", code: "PT-2026-000009", name: "Myra Deshmukh", age: "5y", phone: "+919820011006", guardianName: "Ananya Deshmukh (Mother)" },
  { id: "44444444-4444-4444-4444-444444444410", code: "PT-2026-000010", name: "Sai Karthik Iyer", age: "6y", phone: "+919820011007", guardianName: "Karthik Iyer (Father)" },
  { id: "44444444-4444-4444-4444-444444444413", code: "PT-2026-000013", name: "Ishaan Gupta", age: "4y", phone: "+919820011009", guardianName: "Sanjay Gupta (Father)" },
];

export function Topbar({ user, onOpenMobileMenu }: TopbarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return MOCK_PATIENTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.guardianName.toLowerCase().includes(q)
    );
  }, [query]);

  // Click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            CareBridge Children&apos;s Hospital
          </span>
          <span className="text-[10px] text-muted-foreground">
            Pediatric Ward &amp; Outpatient CRM • Mumbai, India
          </span>
        </div>
      </div>

      {/* Global Patient Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-2 sm:mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder="Global search: Child name, code (PT-2026-...), or phone..."
            className="pl-9 pr-8 text-xs h-9 bg-background/80"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-popover text-popover-foreground rounded-lg border border-border shadow-xl z-50 max-h-80 overflow-y-auto">
            <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider flex items-center justify-between">
              <span>Patient Directory Search</span>
              <span>{results.length} found</span>
            </div>
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No patient matching &quot;{query}&quot;
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      router.push(`/patients/${patient.id}`);
                    }}
                    className="w-full text-left p-2 rounded-md hover:bg-secondary/70 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {patient.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                          {patient.code}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          ({patient.age})
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>{patient.guardianName}</span>
                        <span className="flex items-center gap-0.5">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                      </div>
                    </div>
                    <FileText className="h-4 w-4 text-primary shrink-0 opacity-70" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground line-clamp-1">
                  {user.fullName}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {user.role}
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
