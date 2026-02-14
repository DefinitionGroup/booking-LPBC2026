import { createClient } from "@/lib/supabase/server";
import { CreateRoomButton } from "@/components/admin/create-room-button";

export default async function AdminRoomsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <CreateRoomButton buildings={buildings || []} floors={floors || []} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Capacity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
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
                      {room.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs text-muted-foreground">Manage</span>
                  </td>
                </tr>
              ))}
              {(!rooms || rooms.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No rooms found.
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
