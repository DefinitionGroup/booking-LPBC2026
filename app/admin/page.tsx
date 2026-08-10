import { AdminBookingTable } from "@/components/admin/admin-booking-table";
import { createClient } from "@/lib/supabase/server";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminPage() {
    const { t } = await getServerI18n();
    const supabase = await createClient();

    // Fetch Pending Bookings
    const { data: bookings } = await supabase
        .from("bookings")
        .select("*, rooms(name), creator:profiles!bookings_user_id_fkey(email), responsible:profiles!bookings_responsible_profile_id_fkey(email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    // Transform for component (handle array/object inference quirks if needed)
    const transformedBookings = bookings?.map(b => {
        const roomData = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
        const creatorData = Array.isArray(b.creator) ? b.creator[0] : b.creator;
        const responsibleData = Array.isArray(b.responsible) ? b.responsible[0] : b.responsible;
        return {
            ...b,
            rooms: roomData ? { name: roomData.name } : null,
            creator: creatorData ? { email: creatorData.email } : null,
            responsible: responsibleData ? { email: responsibleData.email } : null,
        };
    }) || [];

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl tracking-tight">{t("admin.dashboardTitle")}</h1>
                <p className="text-muted-foreground">{t("admin.dashboardSubtitle")}</p>
            </div>

            <AdminBookingTable bookings={transformedBookings} />
        </div>
    );
}
