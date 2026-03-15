import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import { NewBookingShell } from "@/components/bookings/new-booking-shell";
import { format } from "date-fns";

function normalizeDateTimeLocal(value: string | string[] | undefined) {
    if (typeof value !== "string" || value.length === 0) return undefined;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return undefined;
    return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

export default async function NewBookingPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: rooms } = await supabase.from("rooms").select("id, name");
    const prefilledStartTime = normalizeDateTimeLocal(searchParams.start);
    const prefilledEndTime = normalizeDateTimeLocal(searchParams.end);

    return (
        <ShellWrapper>
            <NewBookingShell
                rooms={rooms || []}
                mode="app"
                prefilledStartTime={prefilledStartTime}
                prefilledEndTime={prefilledEndTime}
            />
        </ShellWrapper>
    );
}
