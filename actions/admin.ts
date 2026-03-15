"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase, error: "errors.adminsOnly" };
  }

  return { supabase, error: null };
}

export async function deleteBuilding(id: string) {
  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("buildings").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/buildings");
  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  return { success: true, message: "Building deleted" };
}

export async function deleteFloor(id: string) {
  const { supabase, error: authError } = await assertAdmin();
  if (authError) return { success: false, message: authError };

  const { error } = await supabase.from("floors").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/floors");
  revalidatePath("/admin/rooms");
  return { success: true, message: "Floor deleted" };
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
