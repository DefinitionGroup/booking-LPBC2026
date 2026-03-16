"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

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
    const email = formData.get("email") as string;

    if (!email) {
        redirect("/login/forgot-password?error=Please+enter+your+email+address.");
    }

    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const origin = headersList.get("origin") || `${proto}://${host}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/login/reset-password`,
    });

    if (error) {
        redirect(`/login/forgot-password?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/login/forgot-password?success=true");
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || password.length < 6) {
        redirect("/login/reset-password?error=Password+must+be+at+least+6+characters.");
    }

    if (password !== confirmPassword) {
        redirect("/login/reset-password?error=Passwords+do+not+match.");
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        redirect(`/login/reset-password?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/", "layout");
    redirect("/login?success=passwordUpdated");
}
