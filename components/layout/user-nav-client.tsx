"use client";

import { LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import Link from "next/link";

export function UserNavClient({ user, role }: { user: User; role?: string }) {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="flex items-center gap-4">
            {role === 'admin' && (
                <Link
                    href="/admin"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                </Link>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-border h-8">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium leading-none">{user.email}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{role || 'User'}</span>
                </div>

                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground uppercase">
                    {user.email?.[0]}
                </div>

                <button
                    onClick={handleSignOut}
                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
