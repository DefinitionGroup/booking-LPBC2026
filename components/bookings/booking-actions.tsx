"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { purgeBooking, transitionBooking } from "@/actions/lifecycle";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";
type DialogType = "reject" | "cancel" | "purge" | null;

interface BookingActionsProps {
  booking: { id: string; title: string; status: BookingStatus };
  mode: "admin" | "user";
}

export function BookingActions({ booking, mode }: BookingActionsProps) {
  const [dialog, setDialog] = useState<DialogType>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useI18n();

  const closeDialog = () => {
    setDialog(null);
    setReason("");
    setConfirmation("");
  };

  const runTransition = async (status: "approved" | "rejected" | "cancelled") => {
    setPendingAction(status);
    try {
      const result = await transitionBooking({
        bookingId: booking.id,
        status,
        reason: reason || undefined,
      });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      toast.success(t("admin.bookingsUpdated", { status: t(`status.${status}`) }));
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPendingAction(null);
    }
  };

  const runPurge = async () => {
    setPendingAction("purge");
    try {
      const result = await purgeBooking({ bookingId: booking.id, confirmation });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      toast.success(t(result.message || "bookings.bookingPurged"));
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPendingAction(null);
    }
  };

  const canCancel = booking.status === "pending" || booking.status === "approved";
  const canPurge = mode === "admin" && (booking.status === "rejected" || booking.status === "cancelled");

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {mode === "admin" && booking.status === "pending" && (
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => runTransition("approved")}
            disabled={!!pendingAction}
            title={t("admin.approve")}
          >
            {pendingAction === "approved" ? <Loader2 className="animate-spin" /> : <Check className="text-emerald-600" />}
          </Button>
        )}

        {mode === "admin" && booking.status === "pending" && (
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setDialog("reject")}
            disabled={!!pendingAction}
            title={t("admin.reject")}
          >
            <X className="text-destructive" />
          </Button>
        )}

        {canCancel && (mode === "user" || booking.status === "approved") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog("cancel")}
            disabled={!!pendingAction}
          >
            {t("bookings.cancelBooking")}
          </Button>
        )}

        {canPurge && (
          <Button
            size="icon-sm"
            variant="destructive"
            onClick={() => setDialog("purge")}
            disabled={!!pendingAction}
            title={t("bookings.purgeBooking")}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <Modal
        isOpen={dialog === "reject"}
        onClose={closeDialog}
        title={t("bookings.rejectBooking")}
        description={t("bookings.rejectBookingDescription")}
      >
        <div className="space-y-4">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("bookings.optionalReason")}
            maxLength={500}
            className="min-h-24 w-full resize-y rounded-md border border-border/60 bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={() => runTransition("rejected")} disabled={!!pendingAction}>
              {pendingAction ? <Loader2 className="animate-spin" /> : t("admin.reject")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialog === "cancel"}
        onClose={closeDialog}
        title={t("bookings.cancelBooking")}
        description={t("bookings.cancelBookingDescription")}
      >
        <div className="space-y-4">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("bookings.cancellationReason")}
            maxLength={500}
            className="min-h-24 w-full resize-y rounded-md border border-border/60 bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => runTransition("cancelled")}
              disabled={!!pendingAction || reason.trim().length < 3}
            >
              {pendingAction ? <Loader2 className="animate-spin" /> : t("bookings.confirmCancellation")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialog === "purge"}
        onClose={closeDialog}
        title={t("bookings.purgeBooking")}
        description={t("bookings.purgeBookingDescription", { title: booking.title })}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`purge-booking-${booking.id}`} className="text-xs text-muted-foreground">
              {t("bookings.typeBookingTitle")}
            </label>
            <Input
              id={`purge-booking-${booking.id}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={runPurge} disabled={!!pendingAction || confirmation !== booking.title}>
              {pendingAction ? <Loader2 className="animate-spin" /> : t("bookings.purgeBooking")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
