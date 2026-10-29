"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  Stethoscope,
  Receipt,
  MessageCircle,
  Download,
  Baby,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsSummary } from "@/lib/analytics-data";
import { downloadCSV } from "@/lib/csv-export";
import type { SessionUser } from "@/lib/auth";

interface DashboardClientProps {
  user: SessionUser | null;
  analytics: AnalyticsSummary;
}

export function DashboardClient({ user, analytics }: DashboardClientProps) {
  const [dateRange, setDateRange] = useState<string>("30d");

  // CSV Export Handlers
  const handleExportVisits = () => {
    const headers = ["Date", "Total Visits", "Unique Children (Distinct Patients)"];
    const rows = analytics.dailyVisitsChart.map((d) => [
      d.date,
      d.totalVisits,
      d.uniquePatients,
    ]);
    downloadCSV("CareBridge_Daily_Visits_Report", headers, rows);
  };

  const handleExportRevenue = () => {
    const headers = ["Date", "Cash (INR)", "UPI (INR)", "Card (INR)", "Razorpay (INR)", "Total Collected (INR)"];
    const rows = analytics.revenueOverTimeChart.map((r) => [
      r.date,
      r.cash,
      r.upi,
      r.card,
      r.razorpay,
      r.total,
    ]);
    downloadCSV("CareBridge_Revenue_Breakdown", headers, rows);
  };

  const handleExportServices = () => {
    const headers = ["Service / Procedure Name", "Procedures Performed", "Total Revenue (INR)"];
    const rows = analytics.topServicesChart.map((s) => [s.name, s.count, s.revenue]);
    downloadCSV("CareBridge_Top_Services_Tariff", headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header & Date Range Filter & CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {user?.fullName.split(" ")[0] || "Doctor"}!
            <Badge variant="secondary" className="capitalize text-xs font-semibold">
              {user?.role || "Staff"} Mode
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            CareBridge Pediatric Care Console • Department of Child Health &amp; Neonatology
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date-range selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border">
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "Quarter" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  dateRange === r.id
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* CSV Export Dropdown Button */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportVisits}
              className="text-xs h-8 gap-1.5 border-border"
              title="Download Outpatient Encounters as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>

            <Button asChild size="sm" className="text-xs h-8 gap-1.5 shadow-sm">
              <Link href="/patients/new">
                <Stethoscope className="w-3.5 h-3.5" />
                Register Visit
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Visitors Card (DISTINGUISHING UNIQUE PATIENTS FROM TOTAL VISITS) */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today&apos;s Outpatient Volume
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center">
              <Users className="h-4 w-4 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {analytics.todayTotalVisits} <span className="text-sm font-normal text-muted-foreground">Visits</span>
            </div>
            <div className="text-xs font-semibold text-teal-800 flex items-center gap-1">
              <Baby className="w-3.5 h-3.5" />
              {analytics.todayUniquePatients} Unique Children
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              {analytics.newPatientsCount} New ({Math.round((analytics.newPatientsCount / analytics.todayTotalVisits) * 100)}%) • {analytics.returningPatientsCount} Returning
            </p>
          </CardContent>
        </Card>

        {/* Appointments Card */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Scheduled Appointments
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {analytics.todayAppointmentsCount} <span className="text-sm font-normal text-muted-foreground">Slots</span>
            </div>
            <p className="text-xs font-medium text-sky-700">
              {analytics.appointmentsConfirmed} Confirmed • {analytics.appointmentsCompleted} Completed
            </p>
            <p className="text-[11px] text-amber-600 font-medium pt-1">
              {analytics.appointmentsNoShow} No-Show ({Math.round((analytics.appointmentsNoShow / (analytics.todayAppointmentsCount || 1)) * 100)}%)
            </p>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Hospital Collections (INR)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              ₹{analytics.revenueToday.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">Today</span>
            </div>
            <p className="text-xs font-semibold text-emerald-700">
              ₹{analytics.revenueThisMonth.toLocaleString("en-IN")} This Month
            </p>
            <p className="text-[11px] text-rose-600 font-medium pt-1">
              ₹{analytics.totalOutstandingBalance.toLocaleString("en-IN")} Outstanding Due
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Reminders Card */}
        <Card className="shadow-xs border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              WhatsApp Notifications
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-emerald-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {analytics.messagesSentCount} <span className="text-sm font-normal text-muted-foreground">Sent</span>
            </div>
            <p className="text-xs font-semibold text-teal-800">
              {analytics.messagesDeliveredRate}% Delivery Success
            </p>
            <p className="text-[11px] text-muted-foreground pt-1">
              {analytics.messagesReadRate}% Parent Read Receipts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 1: Daily Visits vs Unique Patients + New vs Returning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Visits (Total vs Unique) */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Daily Outpatient Volume Trends
              </CardTitle>
              <CardDescription className="text-xs">
                Total clinical visits vs unique pediatric patients seen
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-teal-800 bg-teal-50">
              1 Child, 3 Visits = 1 Unique
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyVisitsChart}>
                  <defs>
                    <linearGradient id="totalVisitsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="uniquePatientsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="totalVisits"
                    name="Total Visits Recorded"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#totalVisitsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniquePatients"
                    name="Unique Children"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#uniquePatientsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: New vs Returning Patients */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                New vs Returning Outpatients
              </CardTitle>
              <CardDescription className="text-xs">
                First-time pediatric registrations compared to follow-up visits
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-sky-800 bg-sky-50">
              Retention Cohort
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.newVsReturningChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    dataKey="newPatients"
                    name="New First-Time Patients"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="returningPatients"
                    name="Returning Follow-Up Visits"
                    fill="#f97316"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 2: Revenue Over Time + Appointment Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Revenue by Payment Method */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Revenue Collection by Payment Channel
              </CardTitle>
              <CardDescription className="text-xs">
                Daily collection across Cash, UPI (GooglePay/PhonePe), and Razorpay
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportRevenue}
              className="text-xs h-7 text-primary gap-1"
            >
              <Download className="w-3 h-3" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.revenueOverTimeChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Area
                    type="monotone"
                    dataKey="upi"
                    name="UPI / QR Payments"
                    stackId="1"
                    stroke="#0d9488"
                    fill="#0d9488"
                  />
                  <Area
                    type="monotone"
                    dataKey="razorpay"
                    name="Razorpay Online Links"
                    stackId="1"
                    stroke="#0284c7"
                    fill="#0284c7"
                  />
                  <Area
                    type="monotone"
                    dataKey="cash"
                    name="Cash Counter"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                  />
                  <Area
                    type="monotone"
                    dataKey="card"
                    name="Debit/Credit Card"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Appointment Status Distribution */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Appointment Lifecycle Distribution
              </CardTitle>
              <CardDescription className="text-xs">
                Breakdown of completed visits, active bookings, and no-shows
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50">
              OPD Utilization
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.appointmentStatusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {analytics.appointmentStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW 3: Top Clinical Services + Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 5: Top Clinical Services */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                Top Services &amp; Tariff Revenue
              </CardTitle>
              <CardDescription className="text-xs">
                Highest revenue-generating pediatric consultations and clinical procedures
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportServices}
              className="text-xs h-7 text-primary gap-1"
            >
              <Download className="w-3 h-3" />
              CSV
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={analytics.topServicesChart}
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={120}
                  />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue (INR)"
                    fill="#0d9488"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 6: Campaign Performance */}
        <Card className="border-border shadow-sm">
          <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">
                WhatsApp Campaign Funnel Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Delivery rate and guardian read receipts across health drives
              </CardDescription>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="text-xs h-7 text-primary gap-1">
                View All
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.campaignPerformanceChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="sent" name="Sent" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delivered" name="Delivered" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="read" name="Read" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
