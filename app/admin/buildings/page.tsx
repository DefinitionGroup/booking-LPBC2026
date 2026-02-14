import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import { CreateBuildingButton } from "@/components/admin/create-building-button";

export default async function AdminBuildingsPage() {
  const supabase = await createClient();
  const { data: buildings } = await supabase.from('buildings').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
        <CreateBuildingButton />
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Address</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(buildings || []).map((building) => (
              <tr key={building.id} className="border-t">
                <td className="p-4">{building.name}</td>
                <td className="p-4 text-muted-foreground">{building.address}</td>
                <td className="p-4 text-right">
                  {/* Placeholder for Edit/Delete */}
                  <span className="text-xs text-muted-foreground">Manage</span>
                </td>
              </tr>
            ))}
            {(!buildings || buildings.length === 0) && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  No buildings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
