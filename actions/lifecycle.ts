"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBookingStatusEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

const transitionSchema = z.object({
  bookingId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "cancelled"]),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.status === "cancelled" && (!value.reason || value.reason.length < 3)) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "bookings.cancellationReasonRequired",
    });
  }
});

const purgeBookingSchema = z.object({
  bookingId: z.string().uuid(),
  confirmation: z.string().min(1).max(200),
});

const companyStatusSchema = z.object({
  companyId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.status === "inactive" && (!value.reason || value.reason.length < 3)) {
    context.addIssue({
      code: "custom",
      path: ["reason"],
      message: "admin.deactivationReasonRequired",
    });
  }
});

const updateCompanySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  domain: z.string().trim().max(255).nullable(),
});

const purgeCompanySchema = z.object({
  companyId: z.string().uuid(),
  confirmation: z.string().min(1).max(200),
});

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function getAdminContext() {
  const context = await getAuthenticatedContext();
  if (!context.user) return { ...context, isAdmin: false };

  const { data: profile } = await context.supabase
    .from("profiles")
    .select("role, status")
    .eq("auth_user_id", context.user.id)
    .single();

  return { ...context, isAdmin: profile?.role === "admin" && profile.status === "active" };
}

function lifecycleError(code?: string) {
  if (code === "23P01") return "bookings.roomAlreadyBooked";
  if (code === "42501") return "errors.unauthorized";
  if (code === "P0002") return "errors.notFound";
  if (code === "22023") return "errors.invalidTransition";
  return "errors.generic";
}

function revalidateBookingPaths() {
  revalidatePath("/");
  revalidatePath("/bookings");
  revalidatePath("/schedule");
  revalidatePath("/rooms");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
}

export async function transitionBooking(values: z.input<typeof transitionSchema>) {
  const parsed = transitionSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const context = await getAuthenticatedContext();
  if (!context.user) return { success: false, message: "errors.unauthorized" };

  const { error } = await context.supabase.rpc("transition_booking", {
    p_booking_id: parsed.data.bookingId,
    p_target_status: parsed.data.status,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    console.error("Booking transition failed:", error.code);
    return { success: false, message: lifecycleError(error.code) };
  }

  const { data: booking } = await context.supabase
    .from("bookings")
    .select("title, start_time, end_time, rooms(name), responsible:profiles!bookings_responsible_profile_id_fkey(email)")
    .eq("id", parsed.data.bookingId)
    .single();

  const profile = Array.isArray(booking?.responsible) ? booking.responsible[0] : booking?.responsible;
  const room = Array.isArray(booking?.rooms) ? booking.rooms[0] : booking?.rooms;

  if (booking && profile?.email) {
    await sendBookingStatusEmail(profile.email, parsed.data.status, {
      title: booking.title,
      startTime: booking.start_time,
      endTime: booking.end_time,
      roomName: room?.name || "Unknown Room",
    });
  }

  revalidateBookingPaths();
  return { success: true, message: `status.${parsed.data.status}` };
}

export async function purgeBooking(values: z.input<typeof purgeBookingSchema>) {
  const parsed = purgeBookingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const context = await getAdminContext();
  if (!context.user) return { success: false, message: "errors.unauthorized" };
  if (!context.isAdmin) return { success: false, message: "errors.adminsOnly" };

  const { error } = await context.supabase.rpc("purge_booking", {
    p_booking_id: parsed.data.bookingId,
    p_confirmation: parsed.data.confirmation,
  });

  if (error) {
    console.error("Booking purge failed:", error.code);
    return { success: false, message: lifecycleError(error.code) };
  }

  revalidateBookingPaths();
  return { success: true, message: "bookings.bookingPurged" };
}

export async function changeCompanyStatus(values: z.input<typeof companyStatusSchema>) {
  const parsed = companyStatusSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const context = await getAdminContext();
  if (!context.user) return { success: false, message: "errors.unauthorized" };
  if (!context.isAdmin) return { success: false, message: "errors.adminsOnly" };

  const { error } = await context.supabase.rpc("set_company_status", {
    p_company_id: parsed.data.companyId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    console.error("Company status change failed:", error.code);
    return { success: false, message: lifecycleError(error.code) };
  }

  revalidatePath("/admin/users");
  revalidatePath("/bookings/new");
  return {
    success: true,
    message: parsed.data.status === "active" ? "admin.companyActivated" : "admin.companyDeactivated",
  };
}

export async function updateCompany(values: z.input<typeof updateCompanySchema>) {
  const parsed = updateCompanySchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const context = await getAdminContext();
  if (!context.user) return { success: false, message: "errors.unauthorized" };
  if (!context.isAdmin) return { success: false, message: "errors.adminsOnly" };

  const { error } = await context.supabase.rpc("update_company_admin", {
    p_company_id: parsed.data.companyId,
    p_name: parsed.data.name,
    p_domain: parsed.data.domain || null,
  });

  if (error) {
    console.error("Company update failed:", error.code);
    return { success: false, message: lifecycleError(error.code) };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");
  return { success: true, message: "admin.companyUpdated" };
}

export async function purgeCompany(values: z.input<typeof purgeCompanySchema>) {
  const parsed = purgeCompanySchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const context = await getAdminContext();
  if (!context.user) return { success: false, message: "errors.unauthorized" };
  if (!context.isAdmin) return { success: false, message: "errors.adminsOnly" };

  const { data, error } = await context.supabase.rpc("purge_company", {
    p_company_id: parsed.data.companyId,
    p_confirmation: parsed.data.confirmation,
  });

  if (error) {
    console.error("Company purge failed:", error.code);
    return { success: false, message: lifecycleError(error.code) };
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  revalidatePath("/bookings");

  const result = Array.isArray(data) ? data[0] : null;
  return {
    success: true,
    message: "admin.companyPurged",
    deletedBookings: Number(result?.deleted_bookings || 0),
    detachedUsers: Number(result?.detached_users || 0),
  };
}
