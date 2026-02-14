import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import { ModeToggle } from "@/components/mode-toggle";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <ShellWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences.</p>
                </div>

                <div className="grid gap-6">
                    {/* Appearance Section (New) */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Interface Theme</p>
                                <p className="text-xs text-muted-foreground">Customize how the application looks on your device.</p>
                            </div>
                            <ModeToggle />
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Profile</h2>
                        <div className="grid gap-4 max-w-md">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    disabled
                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                                    value={user?.email || ""}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Your email address is managed by identity provider.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section Placeholder */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Notifications</h2>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="email-notifs" className="rounded border-gray-300" defaultChecked />
                            <label htmlFor="email-notifs" className="text-sm">Receive email notifications for booking updates</label>
                        </div>
                    </div>
                </div>
            </div>
        </ShellWrapper>
    );
}
