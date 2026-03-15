"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { deleteBuilding } from "@/actions/admin";
import { useI18n } from "@/components/i18n-provider";

export function BuildingRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

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
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      {t("common.delete")}
    </button>
  );
}
