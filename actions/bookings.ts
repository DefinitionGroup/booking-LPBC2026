"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBookingRequestEmail } from "@/lib/email";
import { getBookingAvailability } from "@/lib/bookings/availability";

const bookingSchema = z
    .object({
        title: z.string().trim().min(3).max(200),
        description: z.string().trim().max(2000).optional(),
        startTime: z.iso.datetime({ offset: true }),
        endTime: z.iso.datetime({ offset: true }),
        roomId: z.string().uuid(),
        recurrence: z.enum(["none", "daily", "weekly"]),
    })
    .refine((booking) => new Date(booking.startTime) < new Date(booking.endTime), {
        message: "End time must be after start time",
        path: ["endTime"],
    });

type CreateBookingInput = z.input<typeof bookingSchema>;

export async function createBooking(_prevState: unknown, formData: FormData | CreateBookingInput) {
    // Support both FormData (if used directly) or raw object (if used from client component via JS)
    const rawData = formData instanceof FormData ? Object.fromEntries(formData) : formData;

    const validatedFields = bookingSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "errors.invalidFields",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { title, description, startTime, endTime, roomId, recurrence } = validatedFields.data;

    const supabase = await createClient();

    // 1. Get current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "errors.unauthorized" };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_id, status")
        .eq("auth_user_id", user.id)
        .single();

    if (!profile?.company_id || profile.status !== "active") {
        return { success: false, message: "bookings.activeCompanyRequired" };
    }

    const { data: company } = await supabase
        .from("companies")
        .select("status")
        .eq("id", profile.company_id)
        .eq("status", "active")
        .single();

    if (!company) {
        return { success: false, message: "bookings.activeCompanyRequired" };
    }

    // 2. Check the room and its privacy-safe approved-booking availability.
    const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", roomId)
        .eq("is_active", true)
        .single();

    if (roomError || !room) {
        return { success: false, message: "bookings.availabilityCheckFailed" };
    }

    const { data: conflicts, error: conflictError } = await getBookingAvailability(
        supabase,
        startTime,
        endTime,
        roomId
    );

    if (conflictError) {
        return { success: false, message: "bookings.availabilityCheckFailed" };
    }

    if (conflicts && conflicts.length > 0) {
        return { success: false, message: "bookings.roomAlreadyBooked" };
    }

    // 3. Insert Booking
    const { error } = await supabase.from("bookings").insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        room_id: roomId,
        user_id: profile.id,
        responsible_profile_id: profile.id,
        company_id: profile.company_id,
        status: 'pending',
        recurrence_rule: recurrence === 'none' ? null : `FREQ=${recurrence.toUpperCase()}`,
    });

    if (error) {
        console.error("Insert error:", error);
        return { success: false, message: "bookings.bookingFailed" };
    }

    // 4. Send Email to Admin
    // Find an admin to email (just pick the first one for now)
    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("role", "admin")
        .limit(1)
        .single();

    if (adminProfile?.email) {
        await sendBookingRequestEmail(
            adminProfile.email,
            {
                title,
                userName: user.user_metadata?.full_name || "User",
                userEmail: user.email || "Unknown",
                startTime,
                endTime,
                roomName: room?.name || "Unknown Room"
            }
        );
    }

    revalidatePath("/bookings");
    revalidatePath("/schedule");

    return { success: true, message: "bookings.bookingSubmitted" };
}
