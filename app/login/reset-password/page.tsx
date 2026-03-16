import { updatePassword } from "../actions";
import { Building2, ArrowLeft } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import Link from "next/link";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const { t } = await getServerI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.resetPasswordTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("auth.resetPasswordSubtitle")}</p>
        </div>

        {typeof error === "string" && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                {t("auth.newPassword")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                {t("auth.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              formAction={updatePassword}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("auth.updatePassword")}
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
