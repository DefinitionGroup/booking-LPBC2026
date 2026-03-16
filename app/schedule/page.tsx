import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { ScheduleShell } from "@/components/schedule/schedule-shell";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

export default async function SchedulePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();

    // Determine the target date from search params or default to today
    const dateParam = typeof searchParams.date === "string" ? searchParams.date : null;
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const dateStr = format(targetDate, "yyyy-MM-dd");

    // Fetch bookings for the selected day
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: bookings } = await supabase
        .from("bookings")
        .select("id, title, start_time, end_time, status, rooms(name)")
        .gte("start_time", dayStart.toISOString())
        .lte("end_time", dayEnd.toISOString());

    // Fetch busy days for the visible month (for mini calendar dots)
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const { data: monthBookings } = await supabase
        .from("bookings")
        .select("start_time")
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString());

    const busyDays = [
        ...new Set(
            (monthBookings || []).map((b) =>
                format(parseISO(b.start_time), "yyyy-MM-dd")
            )
        ),
    ];

    // Transform for component
    const transformedBookings =
        bookings?.map((b) => {
            const roomData = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
            return {
                ...b,
                room: roomData ? { name: roomData.name } : undefined,
            };
        }) || [];

    return (
        <ShellWrapper>
            <ScheduleShell
                bookings={transformedBookings}
                currentDate={dateStr}
                busyDays={busyDays}
            />
        </ShellWrapper>
    );
}
