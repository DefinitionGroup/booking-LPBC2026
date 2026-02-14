"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export function UserNavClient({ user }: { user: User }) {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh(); // Refresh server components 
    };

    return (
        <div className="border-t border-border p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-medium uppercase">
                        {user.email?.[0]}
                    </div>
                    <div className="text-sm max-w-[120px]">
                        <p className="font-medium truncate">{user.email}</p>
                        {/* Optional Role fetching if we had profile data here */}
                    </div>
                </div>

                <button
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
