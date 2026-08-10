"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createBuilding } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "admin.validationNameMin",
  }),
  address: z.string().optional(),
});

export function CreateBuildingButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t } = useI18n();
  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await createBuilding(values);
    if (!result.success) {
      toast.error(result.message ? t(result.message) : t("errors.generic"));
      return;
    }

    toast.success(t(result.message || "admin.buildingCreated"));
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("admin.newBuilding")}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("admin.createBuilding")}
        description={t("admin.buildingsTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t("admin.name")}</label>
            <Input
              id="name"
              placeholder={t("admin.placeholderBuildingName")}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{getErrorMessage(errors.name.message)}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t("admin.address")}</label>
            <Input
              id="address"
              placeholder={t("admin.placeholderAddress")}
              {...register("address")}
            />
            {errors.address && <p className="text-xs text-red-500">{getErrorMessage(errors.address.message)}</p>}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
