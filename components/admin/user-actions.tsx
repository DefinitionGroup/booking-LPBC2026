"use client";

import { FormEvent, useState, useTransition } from "react";
import { Loader2, Pencil, Power, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  anonymizeAdminUser,
  changeUserStatus,
  updateAdminUser,
} from "@/actions/admin-users";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

type CompanyOption = { id: string; name: string; status: "active" | "inactive" };
type ReplacementOption = { id: string; name: string; companyId: string | null; companyName: string };

interface ManagedUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "user";
  companyId: string | null;
  status: "active" | "inactive" | "anonymized";
  futureResponsibilityCount: number;
  hasAuthAccount: boolean;
  isCurrentUser: boolean;
}

export function UserActions({
  profile,
  companies,
  replacementUsers,
}: {
  profile: ManagedUser;
  companies: CompanyOption[];
  replacementUsers: ReplacementOption[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [dialog, setDialog] = useState<"edit" | "status" | "anonymize" | null>(null);
  const [fullName, setFullName] = useState(profile.fullName || "");
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [companyId, setCompanyId] = useState(profile.companyId || "");
  const [replacementProfileId, setReplacementProfileId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  const closeDialog = () => {
    setDialog(null);
    setReplacementProfileId("");
    setReason("");
    setConfirmation("");
  };

  const openEdit = () => {
    setFullName(profile.fullName || "");
    setEmail(profile.email);
    setRole(profile.role);
    setCompanyId(profile.companyId || "");
    setReplacementProfileId("");
    setDialog("edit");
  };

  const replacementCandidates = replacementUsers.filter((candidate) => candidate.id !== profile.id);
  const companyChanging = companyId !== (profile.companyId || "");
  const editNeedsReplacement = companyChanging && profile.futureResponsibilityCount > 0;
  const deactivationNeedsReplacement = profile.status === "active" && profile.futureResponsibilityCount > 0;

  const reportSuccess = (message: string, transferredBookings?: number) => {
    toast.success(t(message));
    if (transferredBookings) {
      toast.info(t("admin.bookingsTransferred", { count: transferredBookings }));
    }
    closeDialog();
    router.refresh();
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateAdminUser({
        profileId: profile.id,
        fullName,
        email,
        role,
        companyId: companyId || null,
        replacementProfileId: replacementProfileId || null,
      });
      if (!result.success) {
        console.error(
          "[DEBUG-user-update-client-4e82] Update failed",
          "diagnosticCode" in result ? result.diagnosticCode : "pre-RPC",
        );
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      reportSuccess(result.message || "admin.userUpdated", result.transferredBookings);
    });
  };

  const submitStatus = () => {
    const nextStatus = profile.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await changeUserStatus({
        profileId: profile.id,
        status: nextStatus,
        reason: nextStatus === "inactive" ? reason : null,
        replacementProfileId: replacementProfileId || null,
      });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      reportSuccess(result.message || "admin.userUpdated", result.transferredBookings);
    });
  };

  const submitAnonymize = () => {
    startTransition(async () => {
      const result = await anonymizeAdminUser({
        profileId: profile.id,
        confirmation,
      });
      if (!result.success) {
        toast.error(t(result.message || "errors.generic"));
        return;
      }
      reportSuccess(result.message || "admin.userAnonymized");
    });
  };

  if (profile.status === "anonymized") {
    if (!profile.hasAuthAccount) {
      return <span className="text-xs text-muted-foreground">{t("admin.historyRetained")}</span>;
    }
    return (
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => startTransition(async () => {
          const result = await anonymizeAdminUser({ profileId: profile.id, confirmation: profile.email });
          if (!result.success) {
            toast.error(t(result.message || "errors.generic"));
            return;
          }
          reportSuccess(result.message || "admin.userAnonymized");
        })}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
        {t("admin.retryAuthDeletion")}
      </Button>
    );
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={openEdit}>
          <Pencil />
          {t("common.edit")}
        </Button>
        {!profile.isCurrentUser && (
          <Button type="button" size="icon-sm" variant="outline" onClick={() => setDialog("status")} title={profile.status === "active" ? t("admin.deactivateUser") : t("admin.reactivateUser")}>
            {profile.status === "active" ? <Power /> : <RotateCcw />}
          </Button>
        )}
        {profile.status === "inactive" && (
          <Button type="button" size="icon-sm" variant="destructive" onClick={() => setDialog("anonymize")} title={t("admin.anonymizeUser")}>
            <Trash2 />
          </Button>
        )}
      </div>

      <Modal isOpen={dialog === "edit"} onClose={closeDialog} title={t("admin.editUser")} description={t("admin.editUserDescription")}>
        <form className="space-y-4" onSubmit={submitEdit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`user-name-${profile.id}`} className="text-xs">{t("admin.fullName")}</label>
              <Input id={`user-name-${profile.id}`} value={fullName} onChange={(event) => setFullName(event.target.value)} minLength={2} maxLength={200} required />
            </div>
            <div className="space-y-2">
              <label htmlFor={`user-email-${profile.id}`} className="text-xs">{t("auth.email")}</label>
              <Input id={`user-email-${profile.id}`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={`user-company-${profile.id}`} className="text-xs">{t("admin.company")}</label>
              <select id={`user-company-${profile.id}`} value={companyId} onChange={(event) => setCompanyId(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-xs">
                <option value="">{t("admin.leaveUnassigned")}</option>
                {companies.map((company) => <option key={company.id} value={company.id} disabled={company.status !== "active"}>{company.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor={`user-role-${profile.id}`} className="text-xs">{t("admin.userRole")}</label>
              <select id={`user-role-${profile.id}`} value={role} onChange={(event) => setRole(event.target.value as "admin" | "user")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-xs">
                <option value="user">{t("roles.user")}</option>
                <option value="admin">{t("roles.admin")}</option>
              </select>
            </div>
          </div>
          {editNeedsReplacement && (
            <ReplacementField profileId={profile.id} candidates={replacementCandidates} value={replacementProfileId} onChange={setReplacementProfileId} />
          )}
          <p className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">{t("admin.creatorHistoryPreserved")}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isPending || (editNeedsReplacement && !replacementProfileId)}>{isPending && <Loader2 className="animate-spin" />}{t("common.save")}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={dialog === "status"}
        onClose={closeDialog}
        title={profile.status === "active" ? t("admin.deactivateUser") : t("admin.reactivateUser")}
        description={profile.status === "active" ? t("admin.deactivateUserDescription") : t("admin.reactivateUserDescription")}
      >
        <div className="space-y-4">
          {profile.status === "active" && (
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder={t("admin.deactivationReason")} className="min-h-24 w-full rounded-md border border-input bg-background p-3 text-xs" />
          )}
          {deactivationNeedsReplacement && (
            <ReplacementField profileId={profile.id} candidates={replacementCandidates} value={replacementProfileId} onChange={setReplacementProfileId} />
          )}
          <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            {t("admin.userBookingImpact", { count: profile.futureResponsibilityCount })}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button
              type="button"
              variant={profile.status === "active" ? "destructive" : "default"}
              onClick={submitStatus}
              disabled={isPending || (profile.status === "active" && reason.trim().length < 3) || (deactivationNeedsReplacement && !replacementProfileId)}
            >
              {isPending && <Loader2 className="animate-spin" />}
              {profile.status === "active" ? t("common.deactivate") : t("common.activate")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={dialog === "anonymize"} onClose={closeDialog} title={t("admin.anonymizeUser")} description={t("admin.anonymizeUserDescription")}>
        <div className="space-y-4">
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">{t("admin.anonymizeUserWarning")}</div>
          <div className="space-y-2">
            <label htmlFor={`anonymize-user-${profile.id}`} className="text-xs">{t("admin.typeUserEmail", { email: profile.email })}</label>
            <Input id={`anonymize-user-${profile.id}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button type="button" variant="destructive" onClick={submitAnonymize} disabled={isPending || confirmation !== profile.email}>{isPending && <Loader2 className="animate-spin" />}{t("admin.anonymizeUser")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ReplacementField({
  profileId,
  candidates,
  value,
  onChange,
}: {
  profileId: string;
  candidates: ReplacementOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <label htmlFor={`replacement-${profileId}`} className="text-xs">{t("admin.replacementUser")}</label>
      <select id={`replacement-${profileId}`} value={value} onChange={(event) => onChange(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-xs" required>
        <option value="">{t("admin.selectReplacementUser")}</option>
        {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.companyName}</option>)}
      </select>
      {candidates.length === 0 && <p className="text-xs text-destructive">{t("admin.noReplacementAvailable")}</p>}
    </div>
  );
}
