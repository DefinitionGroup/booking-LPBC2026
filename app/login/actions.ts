"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
