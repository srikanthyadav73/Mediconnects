"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCw,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CampaignDetail } from "@/types/campaigns";
import { retryFailedRecipientsAction } from "@/app/actions/campaigns";

interface CampaignResultsClientProps {
  initialCampaign: CampaignDetail;
}

export function CampaignResultsClient({ initialCampaign }: CampaignResultsClientProps) {
  const [campaign, setCampaign] = useState<CampaignDetail>(initialCampaign);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const deliveryRate =
    campaign.sentCount > 0
      ? Math.round((campaign.deliveredCount / campaign.sentCount) * 100)
      : 100;
  const readRate =
    campaign.deliveredCount > 0
      ? Math.round((campaign.readCount / campaign.deliveredCount) * 100)
      : 0;

  const handleRetryFailed = () => {
    startTransition(async () => {
      const res = await retryFailedRecipientsAction(campaign.id);
      if (res.success) {
        setStatusMessage(`Successfully retried ${res.retriedCount} recipient(s)!`);
        setCampaign((prev) => ({
          ...prev,
          failedCount: Math.max(0, prev.failedCount - res.retriedCount),
          deliveredCount: prev.deliveredCount + res.retriedCount,
          sentCount: prev.sentCount + res.retriedCount,
          recipients: prev.recipients.map((r) =>
            r.status === "failed"
              ? {
                  ...r,
                  status: "delivered",
                  deliveredAt: new Date().toISOString(),
                  errorMessage: undefined,
                }
              : r
          ),
        }));
        setTimeout(() => setStatusMessage(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/campaigns"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Campaigns Directory
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {campaign.title}
            </h1>
            <Badge variant="default" className="text-xs capitalize bg-emerald-600 text-white">
              {campaign.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Dispatched on{" "}
            {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            • Meta Approved Template:{" "}
            <span className="font-mono font-semibold text-teal-800">{campaign.templateName}</span>
          </p>
        </div>

        {campaign.failedCount > 0 && (
          <Button
            onClick={handleRetryFailed}
            disabled={isPending}
            className="gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {isPending ? "Retrying..." : `Retry ${campaign.failedCount} Failed Recipient(s)`}
          </Button>
        )}
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Targeted Children
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-foreground">{campaign.totalTargeted}</div>
            <p className="text-[10px] text-muted-foreground">Demographic match</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              Deduped Siblings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-teal-700">-{campaign.dedupedCount}</div>
            <p className="text-[10px] text-teal-700">1 msg / guardian</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              No Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-rose-600">-{campaign.excludedNoConsentCount}</div>
            <p className="text-[10px] text-rose-600">Opt-out guard</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-foreground uppercase tracking-wider">
              Dispatched
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-foreground">{campaign.sentCount}</div>
            <p className="text-[10px] text-muted-foreground">Net guardians</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-teal-700">{campaign.deliveredCount}</div>
            <p className="text-[10px] text-teal-700 font-semibold">{deliveryRate}% success</p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Parent Reads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold text-emerald-600">{campaign.readCount}</div>
            <p className="text-[10px] text-emerald-600 font-semibold">{readRate}% opened</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground">
            WhatsApp Delivery Funnel & Conversion
          </CardTitle>
          <CardDescription className="text-xs">
            Tracking lifecycle from initial target selection down to guardian read receipts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-foreground">Audience Deduplication Funnel</span>
              <span className="text-muted-foreground">
                {campaign.totalTargeted} children → {campaign.sentCount} unique consented guardians
              </span>
            </div>

            <div className="w-full bg-muted/60 h-4 rounded-full overflow-hidden flex">
              <div
                className="bg-primary h-full flex items-center justify-center text-[9px] text-white font-bold"
                style={{ width: `${Math.min(100, Math.round((campaign.sentCount / (campaign.totalTargeted || 1)) * 100))}%` }}
              >
                Deliverable
              </div>
              <div
                className="bg-amber-400 h-full flex items-center justify-center text-[9px] text-amber-950 font-bold"
                style={{ width: `${Math.min(100, Math.round((campaign.dedupedCount / (campaign.totalTargeted || 1)) * 100))}%` }}
              >
                Deduped
              </div>
              <div
                className="bg-rose-400 h-full flex items-center justify-center text-[9px] text-rose-950 font-bold"
                style={{ width: `${Math.min(100, Math.round((campaign.excludedNoConsentCount / (campaign.totalTargeted || 1)) * 100))}%` }}
              >
                No Consent
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                Net Dispatched ({campaign.sentCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Deduped Siblings ({campaign.dedupedCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                Excluded No Consent ({campaign.excludedNoConsentCount})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipient Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-sm font-bold text-foreground">
            Recipient Delivery Log ({campaign.recipients.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Individual delivery status and read receipt confirmations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Guardian Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">Child Name</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4">Timestamps</th>
                  <th className="py-2.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaign.recipients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No recipients recorded for this campaign.
                    </td>
                  </tr>
                ) : (
                  campaign.recipients.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 font-semibold text-foreground">{r.guardianName}</td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">{r.guardianPhone}</td>
                      <td className="py-2.5 px-4 text-foreground">{r.childName}</td>
                      <td className="py-2.5 px-4 text-center">
                        <Badge
                          variant={
                            r.status === "read"
                              ? "default"
                              : r.status === "delivered"
                              ? "outline"
                              : r.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize text-[10px]"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-muted-foreground">
                        {r.readAt
                          ? `Read at ${new Date(r.readAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                          : r.deliveredAt
                          ? `Delivered at ${new Date(r.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                          : r.sentAt
                          ? `Sent at ${new Date(r.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                          : "Queued"}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {r.errorMessage ? (
                          <span className="text-[11px] text-rose-600 font-medium">
                            {r.errorMessage}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium">
                            Confirmed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
