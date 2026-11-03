import Link from "next/link";
import {
  Megaphone,
  Plus,
  Send,
  CheckCheck,
  Users,
  ArrowRight,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAllCampaigns } from "@/lib/campaigns-store";

export const metadata = {
  title: "WhatsApp Campaigns | MediConnect Children's Hospital",
};

function MiniSparkline({ color }: { color: string }) {
  return (
    <div className="h-10 w-full mt-3 -mb-1 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 100 24" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,16 Q18,6 36,13 T72,11 T90,6 T100,9 L100,24 L0,24 Z"
          fill={`url(#grad-${color.replace("#", "")})`}
        />
        <path
          d="M0,16 Q18,6 36,13 T72,11 T90,6 T100,9"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default async function CampaignsPage() {
  const campaigns = await fetchAllCampaigns();

  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
  const totalRead = campaigns.reduce((acc, c) => acc + c.readCount, 0);

  const overallDeliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;
  const overallReadRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 1. TOP WELCOME BANNER MATCHING TARGET DESIGN */}
      <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#e0f2fe]/95 via-[#e2f8f5]/85 to-[#edf9f0]/75 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Heading & Subtitle */}
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              WhatsApp Health Campaigns
            </h1>
            <span className="bg-[#cbf1ea] text-[#0d6e64] text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
              {totalCampaigns} Campaigns
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
            Launch targeted pediatric screening camps, immunization booster alerts, and health drives with guardian-level deduplication.
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
              Community Outreach
            </span>
            <span className="text-sm font-extrabold text-[#00695c] tracking-tight flex items-center gap-1 leading-tight">
              Health Drives <span className="text-orange-500 font-normal">📢</span>
            </span>
          </div>
        </div>

        {/* Right: CTA Action */}
        <div className="relative z-10 flex items-center gap-3">
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-xs shadow-md shadow-teal-800/15 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Campaign Wizard</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Campaigns */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Total Drives</span>
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">{totalCampaigns}</span>
            </div>
          </div>
          <MiniSparkline color="#0d9488" />
        </div>

        {/* Card 2: Messages Sent */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#10b981]">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Dispatches</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Deduplicated
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-emerald-600">{totalSent}</span>
            </div>
          </div>
          <MiniSparkline color="#10b981" />
        </div>

        {/* Card 3: Delivery Success */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Delivery Rate</span>
              </div>
              <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
                {totalDelivered} recvd
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-sky-600">{overallDeliveryRate}%</span>
            </div>
          </div>
          <MiniSparkline color="#0284c7" />
        </div>

        {/* Card 4: Guardian Engagement */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700">Read Receipts</span>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                {totalRead} read
              </span>
            </div>
            <div className="mt-3.5">
              <span className="text-2xl lg:text-3xl font-extrabold text-slate-900">{overallReadRate}%</span>
            </div>
          </div>
          <MiniSparkline color="#f59e0b" />
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp) => {
          const deliveryPct =
            camp.sentCount > 0 ? Math.round((camp.deliveredCount / camp.sentCount) * 100) : 100;
          const readPct =
            camp.deliveredCount > 0 ? Math.round((camp.readCount / camp.deliveredCount) * 100) : 0;

          return (
            <Card key={camp.id} className="border-border shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-teal-700 bg-teal-50 mb-1.5">
                      {camp.templateName}
                    </Badge>
                    <CardTitle className="text-base font-bold text-foreground">
                      {camp.title}
                    </CardTitle>
                  </div>
                  <Badge variant="default" className="text-[10px] capitalize bg-emerald-600 text-white">
                    {camp.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Launched on{" "}
                  {new Date(camp.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Metrics pill */}
                <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-center text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Sent</div>
                    <div className="font-bold text-foreground text-sm">{camp.sentCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Delivered</div>
                    <div className="font-bold text-teal-700 text-sm">{camp.deliveredCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Read</div>
                    <div className="font-bold text-emerald-600 text-sm">{camp.readCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Failed</div>
                    <div className="font-bold text-rose-500 text-sm">{camp.failedCount}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Delivery: {deliveryPct}%</span>
                    <span>Read: {readPct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className="bg-teal-600 h-1.5 transition-all"
                      style={{ width: `${deliveryPct}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-1.5 transition-all"
                      style={{ width: `${readPct}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {camp.dedupedCount > 0 && `${camp.dedupedCount} siblings deduped • `}
                      {camp.excludedNoConsentCount > 0 && `${camp.excludedNoConsentCount} excluded (no consent)`}
                    </span>
                  </div>

                  <Link href={`/campaigns/${camp.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary font-semibold hover:text-primary">
                      View Results
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 5. BOTTOM CONFIDENTIALITY BANNER */}
      <div className="p-3 bg-[#e8f7f4] border border-[#b2e2d8] rounded-xl flex items-center gap-2.5 text-xs text-[#0f6055] font-medium">
        <Lock className="w-4 h-4 text-[#0f766e] shrink-0" />
        <span>WhatsApp health campaigns adhere strictly to guardian consent preferences and DPDP privacy guidelines.</span>
      </div>
    </div>
  );
}