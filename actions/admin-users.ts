"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const companySchema = z.object({
  name: z.string().min(2),
  domain: z.string().trim().optional(),
});

const inviteUserSchema = z.object({
  email: z.email(),
  fullName: z.string().min(2),
  companyId: z.string().uuid(),
  role: z.enum(["admin", "user"]).default("user"),
});

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, error: "errors.unauthorized" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { user: null, error: "errors.adminsOnly" as const };
  }

  return { user, error: null };
}

export async function createCompany(values: z.input<typeof companySchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = companySchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "errors.invalidFields" };
  }

  try {
    const adminClient = await createAdminClient();
    const { error } = await adminClient.from("companies").insert({
      name: parsed.data.name,
      domain: parsed.data.domain || null,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "admin.companyCreated" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "admin.serviceRoleRequired" };
  }
}

export async function inviteUserToCompany(values: z.input<typeof inviteUserSchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = inviteUserSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, message: "errors.invalidFields" };
  }

  try {
    const adminClient = await createAdminClient();
    const { email, fullName, companyId, role } = parsed.data;
    const redirectTo = `${getAppUrl(await headers())}/login`;

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
      },
      redirectTo,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user?.id) {
      return { success: false, message: "admin.inviteFailed" };
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      company_id: companyId,
    });

    if (profileError) {
      return { success: false, message: profileError.message };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "admin.inviteSent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "admin.serviceRoleRequired" };
  }
}
