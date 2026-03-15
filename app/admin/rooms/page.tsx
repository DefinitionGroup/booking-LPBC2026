import { createClient } from "@/lib/supabase/server";
import { CreateRoomButton } from "@/components/admin/create-room-button";
import { RoomRowActions } from "@/components/admin/room-row-actions";
import { getServerI18n } from "@/lib/i18n/server";

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
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.roomsTitle")}</h1>
        <CreateRoomButton buildings={buildings || []} floors={floors || []} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">{t("admin.name")}</th>
                <th className="p-4 font-medium">{t("admin.location")}</th>
                <th className="p-4 font-medium">{t("admin.capacity")}</th>
                <th className="p-4 font-medium">{t("common.status")}</th>
                <th className="p-4 font-medium text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(rooms || []).map((room) => (
                <tr key={room.id} className="border-t">
                  <td className="p-4 font-medium">{room.name}</td>
                  <td className="p-4 text-muted-foreground">
                    {room.floors?.buildings?.name} - {room.floors?.name}
                  </td>
                  <td className="p-4 text-muted-foreground">{room.capacity}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {room.is_active ? t("admin.active") : t("admin.inactive")}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <RoomRowActions id={room.id} name={room.name} isActive={room.is_active} />
                  </td>
                </tr>
              ))}
              {(!rooms || rooms.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
