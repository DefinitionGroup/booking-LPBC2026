import { createClient } from "@/lib/supabase/server";
import { UserNavClient } from "./user-nav-client";

export async function UserNav() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("auth_user_id", user.id)
        .single();

    return <UserNavClient user={user} role={profile?.status === "active" ? profile.role : undefined} />;
}
