import { createClient } from "@/lib/supabase/server";
import { getServerI18n } from "@/lib/i18n/server";

export default async function DebugAuthPage() {
  const { t } = await getServerI18n();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = user ? await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single() : { data: null, error: null };

  return (
    <div className="p-8 font-mono text-xs">
      <h1 className="text-xl mb-4">{t("debug.title")}</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded bg-muted/50">
          <h2 className="mb-2">{t("debug.userSession")}</h2>
          {user ? (
            <pre className="whitespace-pre-wrap text-green-600 overflow-auto">
              {t("debug.idLabel")}: {user.id}
              {t("auth.email")}: {user.email}
            </pre>
          ) : (
            <div className="text-red-500">{t("debug.noUserSession")}</div>
          )}
          {error && <div className="text-red-500 mt-2">{t("debug.errorPrefix")}: {error.message}</div>}
        </div>

        <div className="border p-4 rounded bg-muted/50">
          <h2 className="mb-2">{t("debug.profileData")}</h2>
          {profile ? (
            <pre className="whitespace-pre-wrap text-blue-600 overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <div className="text-orange-500">
              {t("debug.noProfileFound")}
              {user && ` (${t("debug.roleCheckHint")})`}
            </div>
          )}
          {profileError && <div className="text-red-500 mt-2">{t("debug.errorPrefix")}: {profileError.message}</div>}
        </div>
      </div>
    </div>
  );
}
