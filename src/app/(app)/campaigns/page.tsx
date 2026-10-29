import Link from "next/link";
import {
  Megaphone,
  Plus,
  Send,
  CheckCheck,
  Users,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchAllCampaigns } from "@/lib/campaigns-store";

export const metadata = {
  title: "WhatsApp Campaigns | CareBridge Children's Hospital",
};

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            WhatsApp Health Campaigns & Outreach
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Launch targeted pediatric screening camps, immunization booster alerts, and health drives with guardian-level deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/campaigns/new">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Plus className="w-4 h-4" />
              New Campaign Wizard
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Campaigns
            </CardTitle>
            <Megaphone className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCampaigns}</div>
            <p className="text-xs text-muted-foreground mt-1">Health drives & seasonal camps</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Messages Sent
            </CardTitle>
            <Send className="w-4 h-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Deduplicated guardian recipients</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Delivery Success
            </CardTitle>
            <CheckCheck className="w-4 h-4 text-teal-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700">{overallDeliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{totalDelivered} delivered</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Guardian Engagement
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{overallReadRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{totalRead} read receipts</p>
          </CardContent>
        </Card>
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
    </div>
  );
}
