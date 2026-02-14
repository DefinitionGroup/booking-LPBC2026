import { createClient } from "@/lib/supabase/server";
import { CreateFloorButton } from "@/components/admin/create-floor-button";

export default async function AdminFloorsPage() {
  const supabase = await createClient();
  const { data: floors } = await supabase
    .from('floors')
    .select('*, buildings(name)')
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase
    .from('buildings')
    .select('id, name')
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Floors</h1>
        <CreateFloorButton buildings={buildings || []} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Building</th>
                <th className="p-4 font-medium">Level</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(floors || []).map((floor) => (
                <tr key={floor.id} className="border-t">
                  <td className="p-4">{floor.name}</td>
                  <td className="p-4 text-muted-foreground">{floor.buildings?.name || 'Unknown'}</td>
                  <td className="p-4 text-muted-foreground">{floor.level_number}</td>
                  <td className="p-4 text-right">
                    <span className="text-xs text-muted-foreground">Manage</span>
                  </td>
                </tr>
              ))}
              {(!floors || floors.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No floors found.
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
