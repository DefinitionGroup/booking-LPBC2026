import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { Timeline } from "@/components/schedule/timeline";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export default async function SchedulePage() {
    const supabase = await createClient();

    // For demo: Fetch bookings for "today" (or just all for visual, filter in real app)
    // In a real app, we'd use searchParams to get the date.
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { data: bookings } = await supabase
        .from("bookings")
        .select("id, title, start_time, end_time, status, rooms(name)")
        .gte("start_time", startOfDay)
        .lte("end_time", endOfDay);

    // Transform for component
    const transformedBookings = bookings?.map(b => {
        // Handle Supabase returning array for relations sometimes
        const roomData = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
        return {
            ...b,
            room: roomData ? { name: roomData.name } : undefined
        };
    }) || [];

    return (
        <ShellWrapper>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
                        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Date Picker Placeholder */}
                        <button className="text-sm border border-border rounded-md px-3 py-1 bg-card hover:bg-secondary">
                            Today
                        </button>
                    </div>
                </div>

                <Timeline bookings={transformedBookings} />
            </div>
        </ShellWrapper>
    );
}
