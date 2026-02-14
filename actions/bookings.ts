"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendBookingRequestEmail, sendBookingStatusEmail } from "@/lib/email";

const bookingSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    roomId: z.string(),
    recurrence: z.enum(["none", "daily", "weekly"]),
});

export async function createBooking(prevState: any, formData: FormData | any) {
    // Support both FormData (if used directly) or raw object (if used from client component via JS)
    const rawData = formData instanceof FormData ? Object.fromEntries(formData) : formData;

    const validatedFields = bookingSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Invalid fields",
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
        // For demo purposes, we might want to allow this or fail.
        // Given the requirements, we need a user. 
        // If testing without auth, we might fallback to a dummy user if configured, but let's be strict.
        return { success: false, message: "Unauthorized. Please login." };
    }

    // 2. Check overlap
    // This is a simplified check. A robust one would check for conflicting ranges.
    const { data: conflicts, error: conflictError } = await supabase
        .from("bookings")
        .select("id")
        .eq("status", "approved")
        .eq("room_id", roomId)
        .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`);

    if (conflictError) {
        console.error("Conflict check error:", conflictError);
        return { success: false, message: "Failed to check availability" };
    }

    if (conflicts && conflicts.length > 0) {
        return { success: false, message: "Room is already booked for this time slot." };
    }

    // 3. Insert Booking
    const { error } = await supabase.from("bookings").insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
        room_id: roomId,
        user_id: user.id, // In real app: user.id
        status: 'pending', // Default to pending
        recurrence_rule: recurrence === 'none' ? null : `FREQ=${recurrence.toUpperCase()}`,
    });

    if (error) {
        console.error("Insert error:", error);
        return { success: false, message: "Failed to create booking." };
    }

    // 4. Send Email to Admin
    // Fetch room name for the email
    const { data: room } = await supabase.from("rooms").select("name").eq("id", roomId).single();

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

    return { success: true, message: "Booking requested successfully!" };
}

export async function updateBookingStatus(bookingId: string, status: 'approved' | 'rejected') {
    const supabase = await createClient();

    // 1. Verify Admin (Quick check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    // Allow if role is missing (first user) or if admin
    if (profile && profile.role !== 'admin') {
        return { success: false, message: "Unauthorized: Admins only" };
    }

    // 2. Update Status
    const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

    // ... existing code ...
    if (error) {
        console.error("Update error:", error);
        return { success: false, message: "Failed to update booking" };
    }

    // 3. Send Email Notification
    // Fetch booking details to get user email and room name
    const { data: bookingData } = await supabase
        .from("bookings")
        .select("*, rooms(name), profiles(email)")
        .eq("id", bookingId)
        .single();

    if (bookingData && bookingData.profiles?.email) {
        await sendBookingStatusEmail(
            bookingData.profiles.email,
            status,
            {
                title: bookingData.title,
                startTime: bookingData.start_time,
                endTime: bookingData.end_time,
                roomName: bookingData.rooms?.name || "Unknown Room"
            }
        );
    }

    revalidatePath("/admin");
    revalidatePath("/bookings");
    revalidatePath("/schedule");

    return { success: true, message: `Booking ${status}` };
}
