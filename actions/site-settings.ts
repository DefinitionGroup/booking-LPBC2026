"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateSchema = z.object({
  project_name: z.string().min(1).max(100),
  // Accept relative paths (/uploads/…), absolute URLs, or empty/null
  hero_image_url: z.string().max(2048).nullable().or(z.literal("")),
});

export interface SiteSettings {
  project_name: string;
  hero_image_url: string | null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) {
      // Table may not exist yet — return defaults silently
      return { project_name: "Equinox", hero_image_url: null };
    }

    const map: Record<string, string | null> = {};
    for (const row of data ?? []) {
      map[row.key] = row.value ?? null;
    }

    return {
      project_name: map["project_name"] ?? "Equinox",
      hero_image_url: map["hero_image_url"] ?? null,
    };
  } catch {
    return { project_name: "Equinox", hero_image_url: null };
  }
}

export async function updateSiteSettings(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  const raw = {
    project_name: formData.get("project_name") as string,
    hero_image_url: (formData.get("hero_image_url") as string) || null,
  };

  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/admin/settings?error=" + encodeURIComponent("Invalid input."));
  }

  const upserts = [
    { key: "project_name", value: parsed.data.project_name, updated_at: new Date().toISOString() },
    { key: "hero_image_url", value: parsed.data.hero_image_url ?? null, updated_at: new Date().toISOString() },
  ];

  const { error } = await supabase
    .from("site_settings")
    .upsert(upserts, { onConflict: "key" });

  if (error) {
    redirect("/admin/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/admin/settings?success=true");
}
