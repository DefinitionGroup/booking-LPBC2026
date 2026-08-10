import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { ScheduleShell } from "@/components/schedule/schedule-shell";
import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { getBookingAvailability } from "@/lib/bookings/availability";
import { getServerI18n } from "@/lib/i18n/server";

export default async function SchedulePage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const { t } = await getServerI18n();
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

    const { data: bookings } = await getBookingAvailability(
        supabase,
        dayStart.toISOString(),
        dayEnd.toISOString()
    );

    // Fetch busy days for the visible month (for mini calendar dots)
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    const { data: monthBookings } = await getBookingAvailability(
        supabase,
        monthStart.toISOString(),
        monthEnd.toISOString()
    );

    const bookingCounts: Record<string, number> = {};
    for (const b of monthBookings || []) {
        const key = format(parseISO(b.start_time), "yyyy-MM-dd");
        bookingCounts[key] = (bookingCounts[key] ?? 0) + 1;
    }

    // Transform for component
    const transformedBookings =
        bookings.map((b, index) => {
            return {
                id: `${b.room_id}:${b.start_time}:${index}`,
                title: t("schedule.reserved"),
                start_time: b.start_time,
                end_time: b.end_time,
                status: "approved",
                room: { name: b.room_name },
            };
        });

    return (
        <ShellWrapper>
            <ScheduleShell
                bookings={transformedBookings}
                currentDate={dateStr}
                bookingCounts={bookingCounts}
            />
        </ShellWrapper>
    );
}
