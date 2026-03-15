"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

const formSchema = z.object({
  name: z.string().min(2, { message: "admin.validationNameMin" }),
  level: z.coerce
    .number({ error: "admin.validationLevelRequired" })
    .min(-10, { message: "admin.validationLevelMin" })
    .max(100, { message: "admin.validationLevelMax" }),
  building_id: z.string().uuid({ message: "admin.validationBuildingRequired" }),
});

type CreateFloorFormInput = z.input<typeof formSchema>;
type CreateFloorFormValues = z.output<typeof formSchema>;

interface CreateFloorButtonProps {
  buildings: { id: string; name: string }[];
}

export function CreateFloorButton({ buildings }: CreateFloorButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateFloorFormInput, unknown, CreateFloorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      level: 1,
      building_id: "",
    },
  });

  async function onSubmit(values: CreateFloorFormValues) {
    try {
      // Map 'level' to 'level_number' as per schema
      const { error } = await supabase.from('floors').insert({
        name: values.name,
        level_number: values.level,
        building_id: values.building_id
      });

      if (error) throw error;

      toast.success(t("admin.createFloor"));
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.generic");
      toast.error(message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("admin.newFloor")}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("admin.createFloor")}
        description={t("admin.floorsTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.building")}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("building_id")}
            >
              <option value="">{t("admin.selectBuilding")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.building_id && <p className="text-sm text-red-500">{getErrorMessage(errors.building_id.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.name")}</label>
            <Input
              placeholder={t("admin.placeholderFloorName")}
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-500">{getErrorMessage(errors.name.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t("admin.level")}</label>
            <Input
              type="number"
              placeholder={t("admin.placeholderLevel")}
              {...register("level")}
            />
            {errors.level && <p className="text-sm text-red-500">{getErrorMessage(errors.level.message)}</p>}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit">{t("common.create")}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
