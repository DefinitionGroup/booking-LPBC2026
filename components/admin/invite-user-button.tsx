"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { inviteUserToCompany } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

const formSchema = z.object({
  email: z.email({ message: "admin.validationEmailRequired" }),
  fullName: z.string().min(2, { message: "admin.validationFullNameMin" }),
  companyId: z.string().uuid({ message: "admin.validationCompanyRequired" }),
  role: z.enum(["admin", "user"]),
});

type InviteUserValues = z.infer<typeof formSchema>;

interface InviteUserButtonProps {
  companies: { id: string; name: string }[];
}

export function InviteUserButton({ companies }: InviteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteUserValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullName: "",
      companyId: "",
      role: "user",
    },
  });

  const onSubmit = async (values: InviteUserValues) => {
    const result = await inviteUserToCompany(values);

    if (result.success) {
      toast.success(t(result.message));
      setOpen(false);
      reset();
      router.refresh();
      return;
    }

    toast.error(result.message ? t(result.message) : t("errors.generic"));
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={companies.length === 0}>
        <UserPlus className="mr-2 h-4 w-4" />
        {t("admin.inviteUser")}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("admin.inviteUser")}
        description={t("admin.inviteUserDescription")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs" htmlFor="invite-full-name">
              {t("admin.fullName")}
            </label>
            <Input
              id="invite-full-name"
              placeholder={t("admin.placeholderFullName")}
              {...register("fullName")}
            />
            {errors.fullName && <p className="text-xs text-red-500">{getErrorMessage(errors.fullName.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs" htmlFor="invite-email">
              {t("auth.email")}
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{getErrorMessage(errors.email.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs" htmlFor="invite-company">
              {t("admin.company")}
            </label>
            <select
              id="invite-company"
              className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("companyId")}
            >
              <option value="">{t("admin.selectCompany")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && <p className="text-xs text-red-500">{getErrorMessage(errors.companyId.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs" htmlFor="invite-role">
              {t("admin.userRole")}
            </label>
            <select
              id="invite-role"
              className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              {...register("role")}
            >
              <option value="user">{t("roles.user")}</option>
              <option value="admin">{t("roles.admin")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("admin.sendInvite")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
