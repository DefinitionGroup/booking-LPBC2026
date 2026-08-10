"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const companySchema = z.object({
  name: z.string().trim().min(2).max(200),
  domain: z.string().trim().max(255).optional(),
});

const inviteUserSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(2).max(200),
  companyId: z.string().uuid(),
  role: z.enum(["admin", "user"]).default("user"),
});

const updateUserSchema = z.object({
  profileId: z.string().uuid(),
  email: z.email(),
  fullName: z.string().trim().min(2).max(200),
  companyId: z.string().uuid().nullable(),
  role: z.enum(["admin", "user"]),
  replacementProfileId: z.string().uuid().nullable(),
});

const userStatusSchema = z.object({
  profileId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
  reason: z.string().trim().max(500).nullable(),
  replacementProfileId: z.string().uuid().nullable(),
});

const anonymizeUserSchema = z.object({
  profileId: z.string().uuid(),
  confirmation: z.string().min(1).max(320),
});

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, supabase, error: "errors.unauthorized" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return { user: null, supabase, error: "errors.adminsOnly" as const };
  }

  return { user, profile, supabase, error: null };
}

function userLifecycleError(code?: string) {
  if (code === "42501") return "errors.adminsOnly";
  if (code === "P0002") return "errors.notFound";
  if (code === "22023") return "admin.userLifecycleConflict";
  return "errors.generic";
}

export async function createCompany(values: z.input<typeof companySchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const { error } = await auth.supabase.from("companies").insert({
    name: parsed.data.name,
    domain: parsed.data.domain || null,
  });

  if (error) {
    console.error("Company creation failed:", error.code);
    return { success: false, message: "errors.generic" };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "admin.companyCreated" };
}

export async function inviteUserToCompany(values: z.input<typeof inviteUserSchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = inviteUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  try {
    const adminClient = await createAdminClient();
    const { email, fullName, companyId, role } = parsed.data;
    const redirectTo = `${getAppUrl(await headers())}/login`;

    const { data: company } = await auth.supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .eq("status", "active")
      .single();

    if (!company) return { success: false, message: "admin.activeCompanyRequired" };

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    });

    if (error) return { success: false, message: error.message };
    if (!data.user?.id) return { success: false, message: "admin.inviteFailed" };

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: data.user.id,
      auth_user_id: data.user.id,
      email,
      full_name: fullName,
      role,
      company_id: companyId,
      status: "active",
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return { success: false, message: profileError.message };
    }

    revalidatePath("/admin/users");
    return { success: true, message: "admin.inviteSent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "admin.serviceRoleRequired" };
  }
}

export async function updateAdminUser(values: z.input<typeof updateUserSchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = updateUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const { data: target, error: targetError } = await auth.supabase
    .from("profiles")
    .select("email, auth_user_id, status")
    .eq("id", parsed.data.profileId)
    .single();

  if (targetError || !target) return { success: false, message: "errors.notFound" };
  if (target.status === "anonymized") {
    return { success: false, message: "admin.userLifecycleConflict" };
  }

  let adminClient: Awaited<ReturnType<typeof createAdminClient>> | null = null;
  const emailChanged = target.email.toLowerCase() !== parsed.data.email.toLowerCase();

  try {
    if (emailChanged) {
      if (!target.auth_user_id) return { success: false, message: "admin.authAccountMissing" };
      adminClient = await createAdminClient();
      const { error } = await adminClient.auth.admin.updateUserById(target.auth_user_id, {
        email: parsed.data.email,
        email_confirm: true,
      });
      if (error) return { success: false, message: error.message };
    }

    const { data: transferred, error } = await auth.supabase.rpc("update_user_admin", {
      p_profile_id: parsed.data.profileId,
      p_full_name: parsed.data.fullName,
      p_email: parsed.data.email,
      p_role: parsed.data.role,
      p_company_id: parsed.data.companyId,
      p_replacement_profile_id: parsed.data.replacementProfileId,
    });

    if (error) {
      if (emailChanged && adminClient && target.auth_user_id) {
        await adminClient.auth.admin.updateUserById(target.auth_user_id, {
          email: target.email,
          email_confirm: true,
        });
      }
      return { success: false, message: userLifecycleError(error.code) };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/bookings");
    return {
      success: true,
      message: "admin.userUpdated",
      transferredBookings: Number(transferred || 0),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "admin.serviceRoleRequired" };
  }
}

export async function changeUserStatus(values: z.input<typeof userStatusSchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = userStatusSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };
  if (parsed.data.status === "inactive" && (!parsed.data.reason || parsed.data.reason.length < 3)) {
    return { success: false, message: "admin.deactivationReasonRequired" };
  }

  const { data: target } = await auth.supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", parsed.data.profileId)
    .single();
  if (!target) return { success: false, message: "errors.notFound" };

  try {
    const adminClient = target.auth_user_id ? await createAdminClient() : null;

    if (parsed.data.status === "active" && adminClient && target.auth_user_id) {
      const { error } = await adminClient.auth.admin.updateUserById(target.auth_user_id, {
        ban_duration: "none",
      });
      if (error) return { success: false, message: error.message };
    }

    const { data: transferred, error } = await auth.supabase.rpc("set_user_status", {
      p_profile_id: parsed.data.profileId,
      p_status: parsed.data.status,
      p_reason: parsed.data.reason,
      p_replacement_profile_id: parsed.data.replacementProfileId,
    });

    if (error) {
      if (parsed.data.status === "active" && adminClient && target.auth_user_id) {
        await adminClient.auth.admin.updateUserById(target.auth_user_id, {
          ban_duration: "876000h",
        });
      }
      return { success: false, message: userLifecycleError(error.code) };
    }

    if (parsed.data.status === "inactive" && adminClient && target.auth_user_id) {
      const { error: banError } = await adminClient.auth.admin.updateUserById(target.auth_user_id, {
        ban_duration: "876000h",
      });
      if (banError) {
        console.error("Auth account ban failed after profile deactivation:", banError.message);
        return { success: false, message: "admin.authDeactivationPending" };
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/bookings");
    return {
      success: true,
      message: parsed.data.status === "inactive" ? "admin.userDeactivated" : "admin.userReactivated",
      transferredBookings: Number(transferred || 0),
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "admin.serviceRoleRequired" };
  }
}

export async function anonymizeAdminUser(values: z.input<typeof anonymizeUserSchema>) {
  const auth = await assertAdmin();
  if (auth.error) return { success: false, message: auth.error };

  const parsed = anonymizeUserSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "errors.invalidFields" };

  const { data: authUserId, error } = await auth.supabase.rpc("anonymize_user", {
    p_profile_id: parsed.data.profileId,
    p_confirmation: parsed.data.confirmation,
  });

  if (error) return { success: false, message: userLifecycleError(error.code) };

  if (authUserId) {
    try {
      const adminClient = await createAdminClient();
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUserId);
      if (deleteError) {
        console.error("Auth account deletion pending:", deleteError.message);
        return { success: false, message: "admin.authDeletionPending" };
      }
    } catch (error) {
      console.error(error);
      return { success: false, message: "admin.authDeletionPending" };
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/bookings");
  return { success: true, message: "admin.userAnonymized" };
}
