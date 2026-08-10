import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const availabilitySlotSchema = z.object({
  room_id: z.string().uuid(),
  room_name: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

export async function getBookingAvailability(
  supabase: SupabaseClient,
  rangeStart: string,
  rangeEnd: string,
  roomId?: string
) {
  const { data, error } = await supabase.rpc("get_booking_availability", {
    p_range_start: rangeStart,
    p_range_end: rangeEnd,
    p_room_id: roomId ?? null,
  });

  if (error) {
    console.error("Availability query failed:", error.code);
    return { data: [] as AvailabilitySlot[], error: "availability_query_failed" as const };
  }

  const parsed = z.array(availabilitySlotSchema).safeParse(data ?? []);
  if (!parsed.success) {
    console.error("Availability query returned an invalid shape");
    return { data: [] as AvailabilitySlot[], error: "availability_response_invalid" as const };
  }

  return { data: parsed.data, error: null };
}
