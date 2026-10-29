import Link from "next/link";
import {
  Plus,
  ArrowUpRight,
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
import { fetchAllPatients } from "@/lib/patients-data";

export default async function VisitsManagementPage() {
  const patients = await fetchAllPatients();

  // Flatten all visits with patient context
  const allVisits = patients
    .flatMap((p) =>
      p.visits.map((v) => ({
        ...v,
        patientId: p.id,
        patientName: p.fullName,
        patientCode: p.patientCode,
        guardianName: p.guardian.name,
        guardianPhone: p.guardian.phone,
      }))
    )
    .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Visits &amp; Clinical Encounters
            <Badge variant="secondary" className="text-xs">
              {allVisits.length} Recorded
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log of pediatric consultations, symptom triage, vitals observations, and prescriptions.
          </p>
        </div>

        <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm font-semibold">
          <Link href="/patients/new">
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Patient &amp; Visit
          </Link>
        </Button>
      </div>

      {/* Visits Table */}
      <Card className="shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">Date &amp; Time</TableHead>
              <TableHead className="text-xs font-semibold">Patient</TableHead>
              <TableHead className="text-xs font-semibold">Chief Complaint &amp; Diagnosis</TableHead>
              <TableHead className="text-xs font-semibold">Vitals Observation</TableHead>
              <TableHead className="text-xs font-semibold">Doctor</TableHead>
              <TableHead className="text-xs font-semibold text-right">Chart</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No visits recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              allVisits.map((visit) => (
                <TableRow key={visit.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs">
                    <span className="font-semibold text-foreground block">
                      {new Date(visit.visitDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(visit.visitDate).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/patients/${visit.patientId}`}
                        className="font-semibold text-xs text-primary hover:underline"
                      >
                        {visit.patientName}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {visit.patientCode}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-xs">
                    <span className="font-medium text-xs text-foreground block line-clamp-1">
                      {visit.chiefComplaint}
                    </span>
                    <span className="text-[11px] text-muted-foreground block line-clamp-1">
                      {visit.diagnosis || "Under clinical observation"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground">
                      {visit.vitals.weight_kg && <span>Wt: {visit.vitals.weight_kg}kg</span>}
                      {visit.vitals.temp_c && <span>Temp: {visit.vitals.temp_c}°C</span>}
                      {visit.vitals.spo2 && <span>SpO2: {visit.vitals.spo2}%</span>}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs">
                    <span className="font-medium text-foreground">
                      {visit.doctorName || "Dr. Ananya Roy"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                      <Link href={`/patients/${visit.patientId}`}>
                        View Chart
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
