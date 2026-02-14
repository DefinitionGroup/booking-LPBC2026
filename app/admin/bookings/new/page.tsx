import { createClient } from "@/lib/supabase/server";
import { NewBookingShell } from "@/components/bookings/new-booking-shell";

export default async function AdminNewBookingPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase.from("rooms").select("id, name");

  return <NewBookingShell rooms={rooms || []} mode="admin" />;
}
