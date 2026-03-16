"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";

const formSchema = z.object({
  name: z.string().min(2, { message: "admin.validationNameMin" }),
  capacity: z.coerce
    .number({ error: "admin.validationCapacityRequired" })
    .min(1, { message: "admin.validationCapacityMin" }),
  building_id: z.string().uuid({ message: "admin.validationBuildingRequired" }),
  floor_id: z.string().uuid({ message: "admin.validationFloorRequired" }),
});

type CreateRoomFormInput = z.input<typeof formSchema>;
type CreateRoomFormValues = z.output<typeof formSchema>;

interface CreateRoomButtonProps {
  buildings: { id: string; name: string }[];
  floors: { id: string; name: string; building_id: string }[];
}

export function CreateRoomButton({ buildings, floors }: CreateRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { t } = useI18n();
  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CreateRoomFormInput, unknown, CreateRoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      capacity: 4,
      building_id: "",
      floor_id: "",
    },
  });

  const selectedBuildingId = watch("building_id");

  const filteredFloors = useMemo(() => {
    return floors.filter(f => f.building_id === selectedBuildingId);
  }, [floors, selectedBuildingId]);

  async function onSubmit(values: CreateRoomFormValues) {
    try {
      const { error } = await supabase.from('rooms').insert({
        name: values.name,
        capacity: values.capacity,
        floor_id: values.floor_id,
        // building_id is inferred via floor, so we don't store it in rooms table directly (schema check: rooms -> floor_id)
        amenities: [] // Default empty for now
      });

      if (error) throw error;

      toast.success(t("admin.createRoom"));
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
        {t("admin.newRoom")}
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("admin.createRoom")}
        description={t("admin.roomsTitle")}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs">{t("admin.building")}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("building_id")}
              onChange={(e) => {
                register("building_id").onChange(e); // Maintain hook form state
                setValue("floor_id", ""); // Reset floor when building changes
              }}
            >
              <option value="">{t("admin.selectBuilding")}</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.building_id && <p className="text-xs text-red-500">{getErrorMessage(errors.building_id.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs">{t("admin.floor")}</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("floor_id")}
              disabled={!selectedBuildingId}
            >
              <option value="">{t("admin.selectFloor")}</option>
              {filteredFloors.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.floor_id && <p className="text-xs text-red-500">{getErrorMessage(errors.floor_id.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs">{t("admin.name")}</label>
            <Input
              placeholder={t("admin.placeholderRoomName")}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{getErrorMessage(errors.name.message)}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs">{t("admin.capacity")}</label>
            <Input
              type="number"
              placeholder={t("admin.placeholderCapacity")}
              {...register("capacity")}
            />
            {errors.capacity && <p className="text-xs text-red-500">{getErrorMessage(errors.capacity.message)}</p>}
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
