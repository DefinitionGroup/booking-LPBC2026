"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

const buildingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(300).optional(),
});

const floorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  level_number: z.coerce.number().int().min(-10).max(100),
  building_id: z.string().uuid(),
});

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "errors.unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return { supabase, error: "errors.adminsOnly" };
  }

  return { supabase, error: null };
}

export async function deleteBuilding(id: string) {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { success: false, message: "errors.invalidFields" };

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("buildings").delete().eq("id", parsedId.data);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  return { success: true, message: "Building deleted" };
}

export async function createBuilding(values: z.input<typeof buildingSchema>) {
  const parsed = buildingSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("buildings").insert({
    name: parsed.data.name,
    address: parsed.data.address || null,
  });

  if (error) return { success: false, message: "errors.generic" };

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/floors");
  return { success: true, message: "admin.buildingCreated" };
}

export async function updateBuilding(
  id: string,
  values: z.input<typeof buildingSchema>
) {
  const [parsedId, parsedValues] = [
    idSchema.safeParse(id),
    buildingSchema.safeParse(values),
  ];
  if (!parsedId.success || !parsedValues.success) {
    return { success: false, message: "errors.invalidFields" };
  }

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase
    .from("buildings")
    .update({
      name: parsedValues.data.name,
      address: parsedValues.data.address || null,
    })
    .eq("id", parsedId.data);

  if (error) return { success: false, message: "errors.generic" };

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true, message: "admin.buildingUpdated" };
}

export async function deleteFloor(id: string) {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { success: false, message: "errors.invalidFields" };

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("floors").delete().eq("id", parsedId.data);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  return { success: true, message: "Floor deleted" };
}

export async function createFloor(values: z.input<typeof floorSchema>) {
  const parsed = floorSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("floors").insert(parsed.data);
  if (error) return { success: false, message: "errors.generic" };

  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  return { success: true, message: "admin.floorCreated" };
}

export async function updateFloor(
  id: string,
  values: z.input<typeof floorSchema>
) {
  const [parsedId, parsedValues] = [
    idSchema.safeParse(id),
    floorSchema.safeParse(values),
  ];
  if (!parsedId.success || !parsedValues.success) {
    return { success: false, message: "errors.invalidFields" };
  }

  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase
    .from("floors")
    .update(parsedValues.data)
    .eq("id", parsedId.data);

  if (error) return { success: false, message: "errors.generic" };

  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true, message: "admin.floorUpdated" };
}

export async function deleteRoom(id: string) {
  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("rooms").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true, message: "Room deleted" };
}

export async function toggleRoomActive(id: string, isActive: boolean) {
  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase
    .from("rooms")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true, message: !isActive ? "Room activated" : "Room deactivated" };
}

export async function updateRoom(
  id: string,
  data: {
    name: string;
    capacity: number;
    amenities: string[];
    image_url: string | null;
  }
) {
  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase
    .from("rooms")
    .update({
      name: data.name,
      capacity: data.capacity,
      amenities: data.amenities,
      image_url: data.image_url,
    })
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  return { success: true };
}
