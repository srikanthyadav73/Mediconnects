"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  CheckCircle2,
  Phone,
  User,
  Baby,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isValidIndianMobile } from "@/lib/validators/phone";
import { submitEnquiryAction } from "@/app/actions/enquiries";

const formSchema = z.object({
  childName: z.string().min(2, "Child's name must be at least 2 characters"),
  childDob: z.string().optional(),
  parentName: z.string().min(2, "Parent/Guardian name is required"),
  phone: z
    .string()
    .refine((val) => isValidIndianMobile(val), {
      message: "Enter a valid 10-digit Indian mobile number (e.g. 9820011001)",
    }),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  preferredDate: z.string().min(1, "Please choose a preferred consultation date"),
  departmentOrReason: z.string().min(3, "Please describe the reason for visit or symptoms"),
  whatsappConsent: z.boolean().refine((val) => val === true, {
    message: "Consent is required to receive appointment confirmation via WhatsApp",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function AppointmentRequestForm() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<{
    referenceCode: string;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      childName: "",
      childDob: "",
      parentName: "",
      phone: "",
      email: "",
      preferredDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      departmentOrReason: "",
      whatsappConsent: true,
    },
  });

  const whatsappConsent = watch("whatsappConsent");

  async function onSubmit(data: FormValues) {
    setServerError(null);
    try {
      const response = await submitEnquiryAction(data);
      if (response.success && response.referenceCode && response.message) {
        setSuccessData({
          referenceCode: response.referenceCode,
          message: response.message,
        });
        reset();
      } else {
        setServerError(response.error || "Submission failed. Please try again.");
      }
    } catch {
      setServerError("Network error. Please try again or call our 24/7 desk.");
    }
  }

  if (successData) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800 shadow-lg">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Appointment Request Received!
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Reference Tracking ID:{" "}
            <span className="font-mono font-bold text-foreground">
              {successData.referenceCode}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-foreground/90 max-w-md mx-auto leading-relaxed">
            {successData.message}
          </p>

          <div className="p-3 bg-card border border-border rounded-lg inline-flex items-center gap-2 text-xs text-muted-foreground text-left mx-auto">
            <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              You will receive an instant WhatsApp reminder with doctor slot details &amp; clinic directions.
            </span>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuccessData(null)}
              className="text-xs"
            >
              Submit Another Appointment Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="appointment-form" className="shadow-xl border-border/80 scroll-mt-24">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="coral" className="text-xs font-semibold">
            Instant Clinic Booking
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            ~30 min response time
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-foreground mt-1">
          Request a Pediatric Appointment
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Fill in child and parent details. Receive automated confirmation and queue tokens directly on WhatsApp.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Child Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="childName" className="text-xs font-semibold flex items-center gap-1.5">
                <Baby className="h-3.5 w-3.5 text-primary" />
                Child&apos;s Full Name *
              </Label>
              <Input
                id="childName"
                placeholder="e.g. Aarav Sharma"
                {...register("childName")}
                className="text-xs"
              />
              {errors.childName && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.childName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="childDob" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Date of Birth (Optional)
              </Label>
              <Input
                id="childDob"
                type="date"
                {...register("childDob")}
                className="text-xs"
              />
            </div>
          </div>

          {/* Parent Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="parentName" className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Parent / Guardian Name *
              </Label>
              <Input
                id="parentName"
                placeholder="e.g. Rajesh Sharma"
                {...register("parentName")}
                className="text-xs"
              />
              {errors.parentName && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.parentName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                Indian Mobile Number *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-muted-foreground">
                  +91
                </span>
                <Input
                  id="phone"
                  placeholder="98200 11001"
                  {...register("phone")}
                  className="pl-12 text-xs"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Date & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="preferredDate" className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Preferred Consultation Date *
              </Label>
              <Input
                id="preferredDate"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                {...register("preferredDate")}
                className="text-xs"
              />
              {errors.preferredDate && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.preferredDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">
                Parent Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="rajesh@example.com"
                {...register("email")}
                className="text-xs"
              />
              {errors.email && (
                <p className="text-[11px] text-destructive font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="departmentOrReason" className="text-xs font-semibold">
              Reason for Visit / Symptoms *
            </Label>
            <Textarea
              id="departmentOrReason"
              rows={2}
              placeholder="e.g. High fever for 2 days, persistent cold, scheduled MMR vaccination, or general developmental checkup."
              {...register("departmentOrReason")}
              className="text-xs resize-none"
            />
            {errors.departmentOrReason && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.departmentOrReason.message}
              </p>
            )}
          </div>

          {/* WhatsApp Consent Checkbox (Mandatory) */}
          <div className="p-3 rounded-lg border border-teal-200 bg-teal-50/60 dark:bg-teal-950/20 dark:border-teal-900/60 space-y-1">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="whatsappConsent"
                checked={whatsappConsent}
                onCheckedChange={(checked) =>
                  setValue("whatsappConsent", checked === true, { shouldValidate: true })
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <label
                  htmlFor="whatsappConsent"
                  className="text-xs font-medium text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600 inline" />
                  Receive instant WhatsApp reminders and doctor updates
                </label>
                <p className="text-[11px] text-muted-foreground">
                  CareBridge sends appointment reminders 24h &amp; 2h before the slot. You can opt out anytime by replying STOP.
                </p>
              </div>
            </div>
            {errors.whatsappConsent && (
              <p className="text-[11px] text-destructive font-medium pl-6">
                {errors.whatsappConsent.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md text-xs py-2.5 h-auto transition-transform active:scale-[0.99]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Request...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Confirm &amp; Request Consultation Slot
              </span>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Your medical information is encrypted and handled under strict clinical confidentiality.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

