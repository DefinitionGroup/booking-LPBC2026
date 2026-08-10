import { createClient } from "@/lib/supabase/server";
import { CreateBuildingButton } from "@/components/admin/create-building-button";
import { BuildingRowActions } from "@/components/admin/building-row-actions";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminBuildingsPage() {
  const { t } = await getServerI18n();
  const supabase = await createClient();
  const { data: buildings } = await supabase.from('buildings').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl tracking-tight">{t("admin.buildingsTitle")}</h1>
        <CreateBuildingButton />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-4">{t("admin.name")}</th>
                <th className="p-4">{t("admin.address")}</th>
                <th className="p-4 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {(buildings || []).map((building) => (
                <tr key={building.id} className="border-t">
                  <td className="p-4">{building.name}</td>
                  <td className="p-4 text-muted-foreground">{building.address}</td>
                  <td className="p-4 text-right">
                    <BuildingRowActions id={building.id} name={building.name} address={building.address} />
                  </td>
                </tr>
              ))}
              {(!buildings || buildings.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    {t("admin.noBuildingsFound")}
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
