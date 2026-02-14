import { AdminBookingTable } from "@/components/admin/admin-booking-table";
import { createClient } from "@/lib/supabase/server";
import { SeedButton } from "@/components/admin/seed-button";

export default async function AdminPage() {
    const supabase = await createClient();

    // Fetch Pending Bookings
    const { data: bookings } = await supabase
        .from("bookings")
        .select("*, rooms(name), profiles(email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    // Transform for component (handle array/object inference quirks if needed)
    const transformedBookings = bookings?.map(b => {
        const roomData = Array.isArray(b.rooms) ? b.rooms[0] : b.rooms;
        const profileData = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
        return {
            ...b,
            rooms: roomData ? { name: roomData.name } : null,
            profiles: profileData ? { email: profileData.email } : null
        };
    }) || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Review and approve booking requests.</p>
                </div>

                {/* Seed Button (Dev Tool) */}
                <SeedButton />
            </div>

            <AdminBookingTable bookings={transformedBookings} />
        </div>
    );
}
