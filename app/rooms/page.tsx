import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import { RoomCard } from "@/components/rooms/room-card";
import { getServerI18n } from "@/lib/i18n/server";

export default async function RoomsPage() {
  const { t } = await getServerI18n();
  const supabase = await createClient();

  // 1. Fetch all rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("name");

  // 2. Fetch currently active bookings (Approved and happening NOW)
  const now = new Date().toISOString();
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("status", "approved")
    .lte("start_time", now)
    .gt("end_time", now);

  const occupiedRoomIds = new Set(activeBookings?.map(b => b.room_id));

  return (
    <ShellWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("rooms.title")}</h1>
          <p className="text-muted-foreground">{t("rooms.subtitle")}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms?.map((room) => (
            <RoomCard
              key={room.id}
              room={{
                ...room,
                amenities: room.amenities || [],
                isAvailable: !occupiedRoomIds.has(room.id),
                imageUrl: undefined
              }}
            />
          ))}
          {(!rooms || rooms.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              {t("rooms.noRoomsFound")}
            </div>
          )}
        </div>
      </div>
    </ShellWrapper>
  );
}
