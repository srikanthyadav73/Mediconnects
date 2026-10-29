"use server";

import { z } from "zod";
import { normalizeIndianPhone, isValidIndianMobile } from "@/lib/validators/phone";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

// In-memory rate limiting map: phone -> timestamps[]
const rateLimitMap = new Map<string, number[]>();

const enquirySchema = z.object({
  childName: z.string().min(2, "Child's full name is required (min 2 letters)"),
  childDob: z.string().optional(),
  parentName: z.string().min(2, "Parent/Guardian name is required"),
  phone: z
    .string()
    .refine((val) => isValidIndianMobile(val), {
      message: "Please enter a valid 10-digit Indian mobile number (e.g. 98200 11001)",
    }),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  preferredDate: z.string().min(1, "Please choose your preferred appointment date"),
  departmentOrReason: z.string().min(3, "Please describe the symptoms or consultation purpose"),
  whatsappConsent: z.boolean().refine((val) => val === true, {
    message: "Consent to receive appointment updates on WhatsApp is required",
  }),
});

export type EnquiryFormData = z.infer<typeof enquirySchema>;

export async function submitEnquiryAction(data: EnquiryFormData) {
  const result = enquirySchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Please check the form for errors.",
    };
  }

  const {
    childName,
    childDob,
    parentName,
    phone,
    email,
    preferredDate,
    departmentOrReason,
    whatsappConsent,
  } = result.data;

  const normalizedPhone = normalizeIndianPhone(phone);
  if (!normalizedPhone) {
    return {
      success: false,
      error: "Invalid Indian mobile number format.",
    };
  }

  // Rate limiting: Max 4 submissions per phone per 10 minutes
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const timestamps = rateLimitMap.get(normalizedPhone) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= 4) {
    return {
      success: false,
      error: "Too many appointment requests from this number. Please wait a few minutes or call our desk directly at +91 22 2654 8900.",
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(normalizedPhone, validTimestamps);

  const referenceCode = `ENQ-${Math.floor(100000 + Math.random() * 900000)}`;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { error: dbError } = await supabase.from("website_enquiries").insert({
        child_name: childName,
        child_dob: childDob || null,
        parent_name: parentName,
        phone: normalizedPhone,
        email: email || null,
        preferred_date: preferredDate || null,
        department_or_reason: departmentOrReason,
        whatsapp_consent: whatsappConsent,
        status: "pending",
      });

      if (dbError) {
        console.error("Database error saving enquiry:", dbError);
        // Do not crash for user, continue with reference
      }
    } catch (err) {
      console.error("Error creating enquiry:", err);
    }
  }

  return {
    success: true,
    referenceCode,
    message: `Thank you, ${parentName}. Your appointment request for ${childName} has been received. Our clinical coordinator will WhatsApp you at ${normalizedPhone} within 30 minutes to confirm your slot.`,
  };
}

