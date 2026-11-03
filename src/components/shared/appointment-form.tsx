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
  Mail,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
      <div className="rounded-3xl border border-emerald-300 bg-white shadow-xl p-7 text-center space-y-5">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Appointment Request Received!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Reference Tracking ID:{" "}
            <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {successData.referenceCode}
            </span>
          </p>
        </div>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {successData.message}
        </p>

        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 text-left mx-auto max-w-md">
          <MessageSquare className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>
            You will receive an instant WhatsApp confirmation with doctor slot details and automated queue token updates.
          </span>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuccessData(null)}
            className="text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50"
          >
            Submit Another Appointment Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-teal-900/5 p-6 sm:p-7 overflow-hidden">
      {/* Form Card Header matching Target Image 1 */}
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff0ea] text-[#f1592a] font-bold text-[11px] shadow-2xs">
            Instant Clinic Booking
          </span>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            ~30 min response time
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-3">
          Request a Pediatric Appointment
        </h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Fill in child and parent details. Receive automated confirmation and queue tokens directly on WhatsApp.
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Child Details Grid (2 Cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="childName" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Baby className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Child&apos;s Full Name *</span>
            </Label>
            <Input
              id="childName"
              placeholder="e.g. Aarav Sharma"
              {...register("childName")}
              className="text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
            />
            {errors.childName && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.childName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="childDob" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Date of Birth (Optional)</span>
            </Label>
            <Input
              id="childDob"
              type="date"
              {...register("childDob")}
              className="text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
            />
          </div>
        </div>

        {/* Parent Details Grid (2 Cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="parentName" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Parent / Guardian Name *</span>
            </Label>
            <Input
              id="parentName"
              placeholder="e.g. Rajesh Sharma"
              {...register("parentName")}
              className="text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
            />
            {errors.parentName && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.parentName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Indian Mobile Number *</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 select-none">
                +91
              </span>
              <Input
                id="phone"
                placeholder="98200 11001"
                {...register("phone")}
                className="pl-11 text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>

        {/* Consultation Date & Email Grid (2 Cols) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="preferredDate" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Preferred Consultation Date *</span>
            </Label>
            <Input
              id="preferredDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              {...register("preferredDate")}
              className="text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
            />
            {errors.preferredDate && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.preferredDate.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#00796b]" />
              <span>Parent Email (Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="rajesh@example.com"
              {...register("email")}
              className="text-xs rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20 h-10"
            />
            {errors.email && (
              <p className="text-[11px] text-destructive font-medium">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Reason for Visit / Symptoms */}
        <div className="space-y-1.5">
          <Label htmlFor="departmentOrReason" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#00796b]" />
            <span>Reason for Visit / Symptoms *</span>
          </Label>
          <Textarea
            id="departmentOrReason"
            rows={2}
            placeholder="e.g. High fever for 2 days, persistent cold, scheduled MMR vaccination, or general developmental checkup."
            {...register("departmentOrReason")}
            className="text-xs resize-none rounded-xl border-slate-200 bg-white/90 focus:border-teal-600 focus:ring-teal-500/20"
          />
          {errors.departmentOrReason && (
            <p className="text-[11px] text-destructive font-medium">
              {errors.departmentOrReason.message}
            </p>
          )}
        </div>

        {/* WhatsApp Consent Checkbox Card matching Target Image 1 */}
        <div className="p-3.5 rounded-2xl border border-teal-200/90 bg-[#f0faf7] flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="whatsappConsent"
              checked={whatsappConsent}
              onCheckedChange={(checked) =>
                setValue("whatsappConsent", checked === true, { shouldValidate: true })
              }
              className="mt-0.5 rounded-md border-teal-400 data-[state=checked]:bg-[#00796b] data-[state=checked]:border-[#00796b]"
            />
            <div className="space-y-0.5">
              <label
                htmlFor="whatsappConsent"
                className="text-xs font-bold text-slate-900 cursor-pointer block leading-tight"
              >
                Receive instant WhatsApp reminders and doctor updates
              </label>
              <p className="text-[11px] text-slate-500 leading-tight">
                MediConnect sends appointment reminders 24h &amp; 2h before the slot. You can opt out anytime by replying STOP.
              </p>
            </div>
          </div>

          {/* WhatsApp Logo badge on right */}
          <div className="h-9 w-9 rounded-xl bg-teal-100/70 text-[#25d366] flex items-center justify-center shrink-0 border border-teal-200/50">
            <MessageSquare className="h-5 w-5 fill-current" />
          </div>
        </div>
        {errors.whatsappConsent && (
          <p className="text-[11px] text-destructive font-medium">
            {errors.whatsappConsent.message}
          </p>
        )}

        {/* Submit Button matching Target Image 1 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#00796b] hover:bg-[#00695c] text-white font-bold text-sm py-3.5 px-6 shadow-md shadow-teal-900/15 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting Request...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 w-full">
              <Send className="h-4 w-4" />
              <span>Confirm &amp; Request Consultation Slot</span>
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </span>
          )}
        </button>

        {/* Clinical Confidentiality Footer */}
        <p className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="h-4 w-4 text-[#00796b] shrink-0" />
          <span>Your medical information is encrypted and handled under strict clinical confidentiality.</span>
        </p>
      </form>
    </div>
  );
}
