"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteFloor, updateFloor } from "@/actions/admin";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type BuildingOption = { id: string; name: string };

export function FloorRowActions({
  id,
  name,
  levelNumber,
  buildingId,
  buildings,
}: {
  id: string;
  name: string;
  levelNumber: number;
  buildingId: string;
  buildings: BuildingOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedLevel, setEditedLevel] = useState(String(levelNumber));
  const [editedBuildingId, setEditedBuildingId] = useState(buildingId);
  const { t } = useI18n();

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateFloor(id, {
        name: editedName,
        level_number: editedLevel,
        building_id: editedBuildingId,
      });
      if (!result.success) {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
        return;
      }

      toast.success(t(result.message || "admin.floorUpdated"));
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(t("admin.deleteFloorConfirm", { name }));
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteFloor(id);
      if (result.success) {
        toast.success(t("common.delete"));
        router.refresh();
      } else {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
      }
    });
  };

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)} disabled={isPending}>
          <Pencil />
          {t("common.edit")}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          {t("common.delete")}
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("admin.editFloor")}
        description={t("admin.editFloorDescription")}
      >
        <form className="space-y-4" onSubmit={handleUpdate}>
          <div className="space-y-2">
            <label htmlFor={`floor-building-${id}`} className="text-xs">{t("admin.building")}</label>
            <select
              id={`floor-building-${id}`}
              value={editedBuildingId}
              onChange={(event) => setEditedBuildingId(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`floor-name-${id}`} className="text-xs">{t("admin.name")}</label>
            <Input id={`floor-name-${id}`} value={editedName} onChange={(event) => setEditedName(event.target.value)} minLength={2} maxLength={100} required />
          </div>
          <div className="space-y-2">
            <label htmlFor={`floor-level-${id}`} className="text-xs">{t("admin.level")}</label>
            <Input id={`floor-level-${id}`} type="number" value={editedLevel} onChange={(event) => setEditedLevel(event.target.value)} min={-10} max={100} required />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
