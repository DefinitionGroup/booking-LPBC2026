"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

const resetPasswordSchema = z.object({
    email: z.email("Please enter a valid email address."),
});

const updatePasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters."),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function signup(formData: FormData) {
    const email = formData.get("email");
    const fallback = typeof email === "string" && email.length > 0
        ? `auth.accessManagedError:${email}`
        : "auth.accessManagedError";

    revalidatePath("/login", "page");
    redirect(`/login?error=${encodeURIComponent(fallback)}`);
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();
    const parsed = resetPasswordSchema.safeParse({
        email: formData.get("email"),
    });

    if (!parsed.success) {
        redirect(`/login/forgot-password?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Please enter your email address.")}`);
    }

    const origin = getAppUrl(await headers());

    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${origin}/auth/callback?flow=recovery&next=/login/reset-password`,
    });

    if (error) {
        redirect(`/login/forgot-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/login/forgot-password?success=true");
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const parsed = updatePasswordSchema.safeParse({
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
        redirect(`/login/reset-password?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Could not update password.")}`);
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        redirect(`/login/forgot-password?error=${encodeURIComponent("Your reset session is invalid or has expired. Please request a new password reset email.")}`);
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
        redirect(`/login/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/", "layout");
    redirect("/login?success=passwordUpdated");
}
