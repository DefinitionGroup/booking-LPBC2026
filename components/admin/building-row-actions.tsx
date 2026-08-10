"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { deleteBuilding, updateBuilding } from "@/actions/admin";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export function BuildingRowActions({
  id,
  name,
  address,
}: {
  id: string;
  name: string;
  address: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [editedAddress, setEditedAddress] = useState(address || "");
  const { t } = useI18n();

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateBuilding(id, {
        name: editedName,
        address: editedAddress,
      });
      if (!result.success) {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
        return;
      }

      toast.success(t(result.message || "admin.buildingUpdated"));
      setIsOpen(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(t("admin.deleteBuildingConfirm", { name }));
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteBuilding(id);
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
        title={t("admin.editBuilding")}
        description={t("admin.editBuildingDescription")}
      >
        <form className="space-y-4" onSubmit={handleUpdate}>
          <div className="space-y-2">
            <label htmlFor={`building-name-${id}`} className="text-xs">{t("admin.name")}</label>
            <Input id={`building-name-${id}`} value={editedName} onChange={(event) => setEditedName(event.target.value)} minLength={2} maxLength={100} required />
          </div>
          <div className="space-y-2">
            <label htmlFor={`building-address-${id}`} className="text-xs">{t("admin.address")}</label>
            <Input id={`building-address-${id}`} value={editedAddress} onChange={(event) => setEditedAddress(event.target.value)} maxLength={300} />
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
