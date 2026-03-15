"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Power, PowerOff, Trash2 } from "lucide-react";
import { deleteRoom, toggleRoomActive } from "@/actions/admin";
import { useI18n } from "@/components/i18n-provider";

interface RoomRowActionsProps {
  id: string;
  name: string;
  isActive: boolean;
}

export function RoomRowActions({ id, name, isActive }: RoomRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleRoomActive(id, isActive);
      if (result.success) {
        toast.success(isActive ? t("common.deactivate") : t("common.activate"));
        router.refresh();
      } else {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
      }
    });
  };

  const handleDelete = () => {
    const confirmed = window.confirm(t("admin.deleteRoomConfirm", { name }));
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteRoom(id);
      if (result.success) {
        toast.success(t("common.delete"));
        router.refresh();
      } else {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isActive ? (
          <PowerOff className="h-3 w-3" />
        ) : (
          <Power className="h-3 w-3" />
        )}
        {isActive ? t("common.deactivate") : t("common.activate")}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        {t("common.delete")}
      </button>
    </div>
  );
}
