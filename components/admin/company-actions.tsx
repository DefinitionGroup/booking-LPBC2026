"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { changeCompanyStatus, purgeCompany, updateCompany } from "@/actions/lifecycle";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface CompanyActionsProps {
  company: {
    id: string;
    name: string;
    domain: string | null;
    status: "active" | "inactive";
    bookingCount: number;
    userCount: number;
  };
}

export function CompanyActions({ company }: CompanyActionsProps) {
  const [dialog, setDialog] = useState<"edit" | "status" | "purge" | null>(null);
  const [name, setName] = useState(company.name);
  const [domain, setDomain] = useState(company.domain || "");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const closeDialog = () => {
    setDialog(null);
    setReason("");
    setConfirmation("");
  };

  const openEdit = () => {
    setName(company.name);
    setDomain(company.domain || "");
    setDialog("edit");
  };

  const runUpdate = async () => {
    setPending(true);
    try {
      const result = await updateCompany({
        companyId: company.id,
        name,
        domain: domain || null,
      });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      toast.success(t(result.message || "admin.companyUpdated"));
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false);
    }
  };

  const updateStatus = async () => {
    const nextStatus = company.status === "active" ? "inactive" : "active";
    setPending(true);
    try {
      const result = await changeCompanyStatus({
        companyId: company.id,
        status: nextStatus,
        reason: reason || undefined,
      });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      toast.success(t(result.message || "errors.generic"));
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false);
    }
  };

  const runPurge = async () => {
    setPending(true);
    try {
      const result = await purgeCompany({ companyId: company.id, confirmation });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      toast.success(t("admin.companyPurgedSummary", {
        bookings: result.deletedBookings || 0,
        users: result.detachedUsers || 0,
      }));
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false);
    }
  };

  const deactivating = company.status === "active";

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={openEdit}>
          <Pencil />
          {t("common.edit")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDialog("status")}>
          <Power />
          {deactivating ? t("common.deactivate") : t("common.activate")}
        </Button>
        {company.status === "inactive" && (
          <Button size="icon-sm" variant="destructive" onClick={() => setDialog("purge")} title={t("admin.purgeCompany")}>
            <Trash2 />
          </Button>
        )}
      </div>

      <Modal
        isOpen={dialog === "edit"}
        onClose={closeDialog}
        title={t("admin.editCompany")}
        description={t("admin.editCompanyDescription")}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor={`company-name-${company.id}`} className="text-xs">{t("admin.companyName")}</label>
            <Input id={`company-name-${company.id}`} value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={200} required />
          </div>
          <div className="space-y-2">
            <label htmlFor={`company-domain-${company.id}`} className="text-xs">{t("admin.companyDomain")}</label>
            <Input id={`company-domain-${company.id}`} value={domain} onChange={(event) => setDomain(event.target.value)} maxLength={255} placeholder={t("admin.placeholderCompanyDomain")} />
          </div>
          <p className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">{t("admin.companyEditHistoryNote")}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button onClick={runUpdate} disabled={pending || name.trim().length < 2}>
              {pending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialog === "status"}
        onClose={closeDialog}
        title={deactivating ? t("admin.deactivateCompany") : t("admin.activateCompany")}
        description={deactivating ? t("admin.deactivateCompanyDescription") : t("admin.activateCompanyDescription")}
      >
        <div className="space-y-4">
          {deactivating && (
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("admin.deactivationReason")}
              maxLength={500}
              className="min-h-24 w-full resize-y rounded-md border border-border/60 bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button
              variant={deactivating ? "destructive" : "default"}
              onClick={updateStatus}
              disabled={pending || (deactivating && reason.trim().length < 3)}
            >
              {pending ? <Loader2 className="animate-spin" /> : deactivating ? t("common.deactivate") : t("common.activate")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={dialog === "purge"}
        onClose={closeDialog}
        title={t("admin.purgeCompany")}
        description={t("admin.purgeCompanyDescription", {
          name: company.name,
          bookings: company.bookingCount,
          users: company.userCount,
        })}
      >
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {t("admin.purgeCompanyWarning")}
          </div>
          <div className="space-y-2">
            <label htmlFor={`purge-company-${company.id}`} className="text-xs text-muted-foreground">
              {t("admin.typeCompanyName")}
            </label>
            <Input
              id={`purge-company-${company.id}`}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={runPurge} disabled={pending || confirmation !== company.name}>
              {pending ? <Loader2 className="animate-spin" /> : t("admin.purgeCompany")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
