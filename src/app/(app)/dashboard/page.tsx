import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  TrendingUp,
  Receipt,
  MessageCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const stats = [
    {
      title: "Today's Patient Visits",
      value: "28",
      subtext: "19 Unique Children (9 returning)",
      change: "+12% from yesterday",
      icon: Users,
    },
    {
      title: "Scheduled Appointments",
      value: "16",
      subtext: "11 Confirmed • 5 Pending",
      change: "Next in 15 mins",
      icon: CalendarCheck,
    },
    {
      title: "Revenue Today (INR)",
      value: "₹24,800",
      subtext: "₹18,200 UPI/Razorpay • ₹6,600 Cash",
      change: "+8.4% this week",
      icon: Receipt,
    },
    {
      title: "WhatsApp Reminders",
      value: "42 Sent",
      subtext: "97.6% Delivery rate (0 opt-outs)",
      change: "24h reminders queued",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {user?.fullName.split(" ")[0]}!
            <Badge variant="secondary" className="capitalize text-xs font-semibold">
              {user?.role} Mode
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            CareBridge Pediatric Care Console • Department of Child Health &amp; Neonatology
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/appointments">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Today&apos;s Schedule
            </Link>
          </Button>

          <Button asChild size="sm" className="text-xs gap-1.5 shadow-sm">
            <Link href="/patients/new">
              <Stethoscope className="h-3.5 w-3.5" />
              Register Patient &amp; Visit
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-xs hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs font-medium text-muted-foreground">{stat.subtext}</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 pt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Clinical Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Recent Outpatient Consultations
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time stream of OPD visits and pediatric vitals recorded today
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/visits" className="flex items-center gap-1 text-primary">
                View All Visits
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                patient: "Aarav Sharma",
                code: "PT-2026-000001",
                age: "5y (Male)",
                complaint: "Acute Bronchitis & wheezing",
                doctor: "Dr. Ananya Roy",
                time: "10:30 AM",
                vitals: "Wt: 18.2kg • Temp: 38.1°C • SpO2: 98%",
              },
              {
                patient: "Rudra Patel",
                code: "PT-2026-000003",
                age: "4y (Male)",
                complaint: "Scheduled MMR Booster Vaccination",
                doctor: "Dr. Rahul Deshpande",
                time: "11:15 AM",
                vitals: "Wt: 16.5kg • Temp: 36.9°C • SpO2: 99%",
              },
              {
                patient: "Aditi Kulkarni",
                code: "PT-2026-000006",
                age: "6y (Female)",
                complaint: "Pediatric Gastroenteritis follow-up",
                doctor: "Dr. Ananya Roy",
                time: "11:45 AM",
                vitals: "Wt: 21.0kg • Temp: 37.0°C • SpO2: 99%",
              },
            ].map((visit) => (
              <div
                key={visit.code}
                className="p-3 rounded-lg border border-border/70 bg-card hover:bg-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">
                      {visit.patient}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                      {visit.code}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{visit.age}</span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1">{visit.complaint}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {visit.vitals}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-semibold text-primary block">
                    {visit.time}
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    {visit.doctor}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Help & Clinical Standards */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Pediatric Clinical Protocols
            </CardTitle>
            <CardDescription className="text-xs">
              Quality standards and patient safety rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="p-2.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-foreground">
              <p className="font-semibold text-xs text-primary mb-1">
                Zero Silent Merges
              </p>
              Guardian phone and child name/DOB must always be screened before saving new patient records.
            </div>

            <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20 text-foreground">
              <p className="font-semibold text-xs text-accent mb-1">
                WhatsApp Privacy Protection
              </p>
              Diagnosis details and clinical notes are never dispatched over WhatsApp utility reminders. Only general timings and doctor names are sent.
            </div>

            <div className="p-2.5 rounded-lg bg-muted/60 border border-border text-foreground">
              <p className="font-semibold text-xs text-foreground mb-1">
                Weight-Based Dosages
              </p>
              Always check patient weight in vitals before prescribing antibiotic suspensions or fever antipyretics.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

