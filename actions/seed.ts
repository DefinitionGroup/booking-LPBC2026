"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function seedDatabase() {
  let supabase;

  // Strategy 1: Try Admin Client (Service Role) - Bypasses RLS
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = await createAdminClient();
  } else {
    // Strategy 2: Fallback to User Session - Subject to RLS
    supabase = await createClient();
  }

  // 1. Create a dummy Company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name: "Phantom Corp" })
    .select()
    .single();

  if (companyError) {
    // Enhance error message if it helps
    if (companyError.code === "42501") { // RLS violation
      return {
        success: false,
        message: "Permission denied. Add 'SUPABASE_SERVICE_ROLE_KEY' to .env OR run the 'db/rls_fix.sql' script."
      };
    }
    return { success: false, message: "Failed to create company: " + companyError.message };
  }

  // 2. Create a Building
  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .insert({
      name: "Headquarters",
      address: "123 Innovation Drive, Tech City",
      company_id: company.id
    })
    .select()
    .single();

  if (buildingError) return { success: false, message: "Failed to create building: " + buildingError.message };

  // 3. Create a Floor
  const { data: floor, error: floorError } = await supabase
    .from("floors")
    .insert({
      name: "Executive Floor",
      level: 10,
      building_id: building.id
    })
    .select()
    .single();

  if (floorError) return { success: false, message: "Failed to create floor: " + floorError.message };

  // 4. Create Rooms
  const rooms = [
    { name: "Nebula", capacity: 8, amenities: ["Wifi", "TV"], floor_id: floor.id },
    { name: "Pulsar", capacity: 4, amenities: ["Wifi", "Whiteboard"], floor_id: floor.id },
    { name: "Quasar", capacity: 12, amenities: ["Wifi", "TV", "Video Conf"], floor_id: floor.id },
    { name: "Vortex", capacity: 6, amenities: ["Wifi"], floor_id: floor.id },
    { name: "Eclipse", capacity: 20, amenities: ["Wifi", "Projector", "Catering"], floor_id: floor.id },
  ];

  const { error: roomsError } = await supabase
    .from("rooms")
    .insert(rooms);

  if (roomsError) return { success: false, message: "Failed to create rooms: " + roomsError.message };

  revalidatePath("/rooms");
  revalidatePath("/admin");
  revalidatePath("/bookings/new");

  return { success: true, message: "Database seeded successfully!" };
}
