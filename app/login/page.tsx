import { login } from "./actions";
import { Building2, Mail, Lock, CheckCircle2 } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/actions/site-settings";

export default async function LoginPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams;
    const error = searchParams.error;
    const success = searchParams.success;
    const { t } = await getServerI18n();
    const settings = await getSiteSettings();
    const errorMessage =
        typeof error === "string" && error.startsWith("auth.accessManagedError")
            ? error.includes(":")
                ? t("auth.accessManagedErrorWithEmail", { email: error.split(":").slice(1).join(":") })
                : t("auth.accessManagedError")
            : error;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
            {/* Background image */}
            {settings.hero_image_url ? (
                <Image
                    src={settings.hero_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    priority
                />
            ) : (
                <div className="absolute inset-0 bg-background" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-sm space-y-6">
                <div className="flex justify-end">
                    <LanguageSwitcher />
                </div>

                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl tracking-tight text-white">{settings.project_name}</h1>
                        <p className="text-xs text-white/70">{t("auth.welcomeSubtitle")}</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="rounded-md bg-destructive/10 px-4 py-3 text-xs text-destructive">
                        {errorMessage}
                    </div>
                )}

                {success === "passwordUpdated" && (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {t("auth.passwordUpdatedSuccess")}
                    </div>
                )}

                <Card>
                    <CardContent>
                        <form className="flex flex-col gap-5" suppressHydrationWarning>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t("auth.email")}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        suppressHydrationWarning
                                        className="pl-9"
                                        placeholder={t("auth.emailPlaceholder")}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">{t("auth.password")}</Label>
                                    <Link
                                        href="/login/forgot-password"
                                        className="text-xs text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {t("auth.forgotPassword")}
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        suppressHydrationWarning
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <Button type="submit" formAction={login} className="w-full mt-1">
                                {t("auth.login")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-white/50">
                    {t("auth.accessManaged")}
                </p>
            </div>
        </div>
    );
}
