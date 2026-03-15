import { login } from "./actions";
import { Building2 } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const error = searchParams.error;
    const { t } = await getServerI18n();
    const errorMessage =
        typeof error === "string" && error.startsWith("auth.accessManagedError")
            ? error.includes(":")
                ? t("auth.accessManagedErrorWithEmail", { email: error.split(":").slice(1).join(":") })
                : t("auth.accessManagedError")
            : error;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-6">
            <div className="w-full max-w-sm space-y-6">
                <div className="flex justify-end">
                    <LanguageSwitcher />
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("auth.welcomeTitle")}</h1>
                    <p className="text-sm text-muted-foreground">{t("auth.welcomeSubtitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("auth.accessManaged")}</p>
                </div>

                {errorMessage && (
                    <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 text-center">
                        {errorMessage}
                    </div>
                )}

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <form className="flex flex-col gap-4" suppressHydrationWarning>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="email">{t("auth.email")}</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                suppressHydrationWarning
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                placeholder={t("auth.emailPlaceholder")}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="password">{t("auth.password")}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                suppressHydrationWarning
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                formAction={login}
                                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                {t("auth.login")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
