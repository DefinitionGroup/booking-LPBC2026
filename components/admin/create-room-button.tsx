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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  capacity: z.coerce.number().min(1),
  building_id: z.string().uuid({ message: "Please select a building." }),
  floor_id: z.string().uuid({ message: "Please select a floor." }),
});

interface CreateRoomButtonProps {
  buildings: { id: string; name: string }[];
  floors: { id: string; name: string; building_id: string }[];
}

export function CreateRoomButton({ buildings, floors }: CreateRoomButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase.from('rooms').insert({
        name: values.name,
        capacity: values.capacity,
        floor_id: values.floor_id,
        // building_id is inferred via floor, so we don't store it in rooms table directly (schema check: rooms -> floor_id)
        amenities: [] // Default empty for now
      });

      if (error) throw error;

      toast.success("Room created successfully");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create room: " + error.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Room
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Room"
        description="Add a new room to a floor."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Building</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("building_id")}
              onChange={(e) => {
                register("building_id").onChange(e); // Maintain hook form state
                setValue("floor_id", ""); // Reset floor when building changes
              }}
            >
              <option value="">Select a building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.building_id && <p className="text-sm text-red-500">{errors.building_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Floor</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("floor_id")}
              disabled={!selectedBuildingId}
            >
              <option value="">Select a floor</option>
              {filteredFloors.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            {errors.floor_id && <p className="text-sm text-red-500">{errors.floor_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <Input
              placeholder="e.g. Conference A"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Capacity</label>
            <Input
              type="number"
              placeholder="4"
              {...register("capacity")}
            />
            {errors.capacity && <p className="text-sm text-red-500">{errors.capacity.message}</p>}
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
