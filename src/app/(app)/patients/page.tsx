import Link from "next/link";
import {
  Search,
  UserPlus,
  Phone,
  AlertCircle,
  FileText,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { calculateAge } from "@/lib/utils";

export default async function PatientsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await fetchAllPatients(q);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Patient Directory
            <Badge variant="secondary" className="text-xs">
              {patients.length} Registered
            </Badge>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Centralized pediatric medical charts, guardian linkages, and visit histories.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shadow-sm font-semibold">
            <Link href="/patients/new">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Register New Patient
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="shadow-2xs">
        <CardContent className="p-3">
          <form method="GET" className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q || ""}
                placeholder="Search patient name, code (PT-2026-...), or guardian mobile..."
                className="pl-9 text-xs h-9"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="text-xs h-9 px-4">
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filter
            </Button>
            {q && (
              <Button asChild variant="ghost" size="sm" className="text-xs h-9">
                <Link href="/patients">Reset</Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="shadow-2xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-semibold">Patient Code &amp; Child</TableHead>
              <TableHead className="text-xs font-semibold">Age / Gender</TableHead>
              <TableHead className="text-xs font-semibold">Guardian / Contact</TableHead>
              <TableHead className="text-xs font-semibold">Blood &amp; Allergies</TableHead>
              <TableHead className="text-xs font-semibold">WhatsApp Consent</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No patients found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => {
                const age = calculateAge(patient.dateOfBirth);
                return (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="font-semibold text-xs text-primary hover:underline"
                        >
                          {patient.fullName}
                        </Link>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {patient.patientCode}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-foreground">{age}</span>
                        <span className="text-[11px] text-muted-foreground capitalize block">
                          {patient.gender}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs">
                        <span className="font-medium text-foreground">
                          {patient.guardian.name}
                        </span>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3" />
                          {patient.guardian.phone}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {patient.bloodGroup && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 font-semibold">
                            {patient.bloodGroup}
                          </Badge>
                        )}
                        {patient.allergies.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px] py-0 px-1 flex items-center gap-0.5">
                            <AlertCircle className="h-2.5 w-2.5" />
                            {patient.allergies[0]}
                            {patient.allergies.length > 1 && ` +${patient.allergies.length - 1}`}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={patient.guardian.whatsappConsent === "opted_in" ? "success" : "warning"}
                        className="text-[10px] capitalize"
                      >
                        {patient.guardian.whatsappConsent === "opted_in" ? "Opted In" : "Opted Out"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          <Link href={`/patients/${patient.id}`}>
                            <FileText className="h-3.5 w-3.5 mr-1 text-primary" />
                            Profile
                          </Link>
                        </Button>
                      </div>
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
