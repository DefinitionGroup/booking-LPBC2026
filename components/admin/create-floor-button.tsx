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

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  level: z.coerce.number().min(-10).max(100),
  building_id: z.string().uuid({ message: "Please select a building." }),
});

interface CreateFloorButtonProps {
  buildings: { id: string; name: string }[];
}

export function CreateFloorButton({ buildings }: CreateFloorButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      level: 1,
      building_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Map 'level' to 'level_number' as per schema
      const { error } = await supabase.from('floors').insert({
        name: values.name,
        level_number: values.level,
        building_id: values.building_id
      });

      if (error) throw error;

      toast.success("Floor created successfully");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create floor: " + error.message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Floor
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Floor"
        description="Add a new floor to a building."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Building</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("building_id")}
            >
              <option value="">Select a building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errors.building_id && <p className="text-sm text-red-500">{errors.building_id.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Floor Name</label>
            <Input
              placeholder="e.g. Generated Floor"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Level Number</label>
            <Input
              type="number"
              placeholder="1"
              {...register("level")}
            />
            {errors.level && <p className="text-sm text-red-500">{errors.level.message}</p>}
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
