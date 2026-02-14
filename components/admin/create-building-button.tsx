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
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  address: z.string().optional(),
});

export function CreateBuildingButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const { error } = await supabase.from('buildings').insert({
        name: values.name,
        address: values.address
      });

      if (error) throw error;

      toast.success("Building created successfully");
      setOpen(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error("Failed to create building");
      console.error(error);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Building
      </Button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Building"
        description="Add a new building to the system."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
            <Input
              id="name"
              placeholder="Headquarters"
              {...register("name")}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Address (Optional)</label>
            <Input
              id="address"
              placeholder="123 Innovation Dr"
              {...register("address")}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
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
