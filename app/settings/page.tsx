import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import { ModeToggle } from "@/components/mode-toggle";
import { getServerI18n } from "@/lib/i18n/server";

export default async function SettingsPage() {
    const { t } = await getServerI18n();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <ShellWrapper>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl tracking-tight">{t("settings.title")}</h1>
                    <p className="text-muted-foreground">{t("settings.subtitle")}</p>
                </div>

                <div className="grid gap-6">
                    {/* Appearance Section (New) */}
                    <div className="rounded-lg bg-card p-6 shadow-sm">
                        <h2 className="text-lg mb-4">{t("settings.appearance")}</h2>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs">{t("settings.interfaceTheme")}</p>
                                <p className="text-xs text-muted-foreground">{t("settings.appearanceDescription")}</p>
                            </div>
                            <ModeToggle />
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="text-lg mb-4">{t("settings.profile")}</h2>
                        <div className="grid gap-4 max-w-md">
                            <div className="grid gap-2">
                                <label className="text-xs">{t("auth.email")}</label>
                                <input
                                    disabled
                                    className="flex h-10 w-full rounded-md border border-border/40 bg-muted px-3 py-2 text-xs opacity-50 cursor-not-allowed"
                                    value={user?.email || ""}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t("settings.emailManaged")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section Placeholder */}
                    <div className="rounded-lg bg-card p-6 shadow-sm">
                        <h2 className="text-lg mb-4">{t("settings.notifications")}</h2>
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="email-notifs" className="rounded border-gray-300" defaultChecked />
                            <label htmlFor="email-notifs" className="text-xs">{t("settings.receiveEmails")}</label>
                        </div>
                    </div>
                </div>
            </div>
        </ShellWrapper>
    );
}
