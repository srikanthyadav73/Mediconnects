import Link from "next/link";
import {
  UserCheck,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const sampleEnquiries = [
  {
    id: "enq-1",
    child_name: "Tanmay Verma",
    child_dob: "2023-05-15",
    parent_name: "Amitabh Verma",
    phone: "+919820011003",
    email: "amitabh.v@example.com",
    preferred_date: "2026-11-02",
    department_or_reason: "Night cough, restless breathing, mild fever for 2 days",
    whatsapp_consent: true,
    status: "pending",
    created_at: "2026-10-29T08:15:00Z",
  },
  {
    id: "enq-2",
    child_name: "Siya Somani",
    child_dob: "2019-07-12",
    parent_name: "Archana Somani",
    phone: "+919820011028",
    email: "archana.s@example.com",
    preferred_date: "2026-11-03",
    department_or_reason: "Vision screening and eye allergy consultation",
    whatsapp_consent: true,
    status: "contacted",
    created_at: "2026-10-28T16:40:00Z",
  },
  {
    id: "enq-3",
    child_name: "Ojas Deshmukh",
    child_dob: "2024-03-10",
    parent_name: "Ananya Deshmukh",
    phone: "+919820011006",
    email: "ananya.d@example.com",
    preferred_date: "2026-11-01",
    department_or_reason: "7-month milestone checkup and weaning nutrition advice",
    whatsapp_consent: true,
    status: "converted",
    created_at: "2026-10-27T11:20:00Z",
  },
];

export default async function EnquiriesManagementPage() {
  let enquiries = sampleEnquiries;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("website_enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        enquiries = data as unknown as typeof sampleEnquiries;
      }
    } catch {
      // fallback
    }
  }

  const pendingCount = enquiries.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Website Appointment Enquiries
            {pendingCount > 0 && (
              <Badge variant="coral" className="text-xs">
                {pendingCount} Pending Response
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Public inquiries submitted by parents via the website booking portal.
          </p>
        </div>
      </div>

      {/* Enquiries Table */}
      <Card className="shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">Received Date</TableHead>
              <TableHead className="text-xs font-semibold">Child Patient</TableHead>
              <TableHead className="text-xs font-semibold">Parent &amp; Mobile</TableHead>
              <TableHead className="text-xs font-semibold">Preferred Date</TableHead>
              <TableHead className="text-xs font-semibold">Symptoms / Purpose</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Convert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                  No incoming website inquiries recorded.
                </TableCell>
              </TableRow>
            ) : (
              enquiries.map((enq) => {
                const convertParams = new URLSearchParams({
                  childName: enq.child_name,
                  parentName: enq.parent_name,
                  phone: enq.phone,
                  reason: enq.department_or_reason || "",
                  enquiryId: enq.id,
                });

                return (
                  <TableRow key={enq.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">
                        {new Date(enq.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(enq.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-bold text-xs text-foreground block">
                        {enq.child_name}
                      </span>
                      {enq.child_dob && (
                        <span className="text-[11px] text-muted-foreground">
                          DOB: {enq.child_dob}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <span className="font-medium text-foreground block">
                        {enq.parent_name}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 text-primary" />
                        {enq.phone}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-primary">
                      {enq.preferred_date || "Earliest available"}
                    </TableCell>

                    <TableCell className="max-w-xs text-xs text-muted-foreground">
                      <p className="line-clamp-2">{enq.department_or_reason}</p>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          enq.status === "pending"
                            ? "coral"
                            : enq.status === "converted"
                            ? "success"
                            : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {enq.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      {enq.status === "converted" ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Registered
                        </Badge>
                      ) : (
                        <Button
                          asChild
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-7 px-2.5 shadow-2xs font-semibold"
                        >
                          <Link href={`/patients/new?${convertParams.toString()}`}>
                            <UserCheck className="h-3.5 w-3.5 mr-1 text-accent" />
                            Register
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
