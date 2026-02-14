import { createClient } from "@/lib/supabase/server";
import { UserNavClient } from "./user-nav-client";

export async function UserNav() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    return <UserNavClient user={user} />;
}
