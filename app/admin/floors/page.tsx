import { createClient } from "@/lib/supabase/server";
import { CreateFloorButton } from "@/components/admin/create-floor-button";
import { FloorRowActions } from "@/components/admin/floor-row-actions";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminFloorsPage() {
  const { t } = await getServerI18n();
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
        <h1 className="text-3xl tracking-tight">{t("admin.floorsTitle")}</h1>
        <CreateFloorButton buildings={buildings || []} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4">{t("admin.name")}</th>
                <th className="p-4">{t("admin.building")}</th>
                <th className="p-4">{t("admin.level")}</th>
                <th className="p-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(floors || []).map((floor) => (
                <tr key={floor.id} className="border-t">
                  <td className="p-4">{floor.name}</td>
                  <td className="p-4 text-muted-foreground">{floor.buildings?.name || t("admin.building")}</td>
                  <td className="p-4 text-muted-foreground">{floor.level_number}</td>
                  <td className="p-4 text-right">
                    <FloorRowActions id={floor.id} name={floor.name} />
                  </td>
                </tr>
              ))}
              {(!floors || floors.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("admin.noFloorsFound")}
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
