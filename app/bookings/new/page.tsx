import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { BookingForm } from "@/components/bookings/booking-form";
import { createClient } from "@/lib/supabase/server";
import { createBooking } from "@/actions/bookings";
import { redirect } from "next/navigation";

export default async function NewBookingPage() {
    const supabase = await createClient();

    // Fetch Rooms for the dropdown
    const { data: rooms } = await supabase.from("rooms").select("id, name");

    return (
        <ShellWrapper>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight mb-8">New Booking Request</h1>
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <BookingForm
                        rooms={rooms || []}
                        onSubmit={async (data) => {
                            "use server";
                            const result = await createBooking(null, data);
                            if (result.success) {
                                redirect("/bookings");
                            } else {
                                throw new Error(result.message);
                            }
                        }}
                    />
                </div>
            </div>
        </ShellWrapper>
    );
}
