"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCompany } from "@/actions/admin-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

const formSchema = z.object({
  name: z.string().min(2, { message: "admin.validationNameMin" }),
  domain: z.string().optional(),
});

type CreateCompanyValues = z.infer<typeof formSchema>;

export function CreateCompanyButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCompanyValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      domain: "",
    },
  });

  const onSubmit = async (values: CreateCompanyValues) => {
    const result = await createCompany(values);

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
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("admin.createCompany")}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("admin.createCompany")}
        description={t("admin.createCompanyDescription")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs" htmlFor="company-name">
              {t("admin.companyName")}
            </label>
            <Input
              id="company-name"
              placeholder={t("admin.placeholderCompanyName")}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{getErrorMessage(errors.name.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs" htmlFor="company-domain">
              {t("admin.companyDomain")}
            </label>
            <Input
              id="company-domain"
              placeholder={t("admin.placeholderCompanyDomain")}
              {...register("domain")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
