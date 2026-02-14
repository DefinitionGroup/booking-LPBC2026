import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    );
}

export async function createAdminClient() {
    const cookieStore = await cookies();

    // Only create if key exists to avoid runtime crashes without check
    // Usage sites should handle the possibly null return or we enforce it here.
    // For now we assume env check happens at usage site or we return standard client as fallback (bad idea for security).
    // Let's just create it.

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || "", // Allow empty string to not crash immediately, but calls will fail
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // Admin client often doesn't need to set cookies for auth, but good to keep structure
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Ignored
                    }
                },
            },
        }
    );
}
