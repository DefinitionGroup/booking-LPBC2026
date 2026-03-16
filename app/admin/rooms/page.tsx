import { createClient } from "@/lib/supabase/server";
import { CreateRoomButton } from "@/components/admin/create-room-button";
import { RoomRowActions } from "@/components/admin/room-row-actions";
import { getServerI18n } from "@/lib/i18n/server";
import Image from "next/image";

export default async function AdminRoomsPage() {
  const { t } = await getServerI18n();
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*, floors(name, buildings(name))')
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name');

  const { data: floors } = await supabase
    .from('floors')
    .select('id, name, building_id')
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl tracking-tight">{t("admin.roomsTitle")}</h1>
        <CreateRoomButton buildings={buildings || []} floors={floors || []} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4">{t("admin.image")}</th>
                <th className="p-4">{t("admin.name")}</th>
                <th className="p-4">{t("admin.location")}</th>
                <th className="p-4">{t("admin.capacity")}</th>
                <th className="p-4">{t("admin.amenities")}</th>
                <th className="p-4">{t("common.status")}</th>
                <th className="p-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(rooms || []).map((room) => (
                <tr key={room.id} className="border-t">
                  <td className="p-4">
                    <div className="relative h-10 w-14 overflow-hidden rounded-md bg-secondary">
                      {room.image_url ? (
                        <Image
                          src={room.image_url}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40 text-[10px]">
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">{room.name}</td>
                  <td className="p-4 text-muted-foreground">
                    {room.floors?.buildings?.name} - {room.floors?.name}
                  </td>
                  <td className="p-4 text-muted-foreground">{room.capacity}</td>
                  <td className="p-4 text-muted-foreground">
                    {room.amenities && room.amenities.length > 0
                      ? room.amenities.join(", ")
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {room.is_active ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <RoomRowActions
                      id={room.id}
                      name={room.name}
                      isActive={room.is_active}
                      capacity={room.capacity}
                      amenities={room.amenities}
                      image_url={room.image_url}
                      floor_id={room.floor_id}
                    />
                  </td>
                </tr>
              ))}
              {(!rooms || rooms.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {t("admin.noRoomsFound")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
