import { getServerI18n } from "@/lib/i18n/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CreateCompanyButton } from "@/components/admin/create-company-button";
import { InviteUserButton } from "@/components/admin/invite-user-button";

type CompanyRecord = {
  id: string;
  name: string;
  domain: string | null;
  created_at?: string;
};

type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  company_id: string | null;
  created_at?: string;
};

export default async function AdminUsersPage() {
  const { t } = await getServerI18n();
  const standardClient = await createClient();
  const {
    data: { user },
  } = await standardClient.auth.getUser();

  let companies: CompanyRecord[] = [];
  let profiles: ProfileRecord[] = [];
  let serviceRoleError = false;

  try {
    const adminClient = await createAdminClient();

    const [{ data: companiesData }, { data: profilesData }] = await Promise.all([
      adminClient.from("companies").select("id, name, domain, created_at").order("name"),
      adminClient
        .from("profiles")
        .select("id, email, full_name, role, company_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

    companies = companiesData || [];
    profiles = profilesData || [];
  } catch {
    serviceRoleError = true;

    const [{ data: companiesData }, { data: profilesData }] = await Promise.all([
      standardClient.from("companies").select("id, name, domain, created_at").order("name"),
      standardClient
        .from("profiles")
        .select("id, email, full_name, role, company_id, created_at")
        .order("created_at", { ascending: false }),
    ]);

    companies = companiesData || [];
    profiles = profilesData || [];
  }

  const companyMap = new Map(companies.map((company) => [company.id, company]));
  const enrichedProfiles = profiles.map((profile) => ({
    ...profile,
    companyName: profile.company_id ? companyMap.get(profile.company_id)?.name || t("admin.unassignedCompany") : t("admin.unassignedCompany"),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.usersTitle")}</h1>
          <p className="text-muted-foreground">{t("admin.usersSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CreateCompanyButton />
          <InviteUserButton companies={companies.map((company) => ({ id: company.id, name: company.name }))} />
        </div>
      </div>

      {serviceRoleError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {t("admin.serviceRoleRequired")}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{t("admin.companiesTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin.companiesSubtitle")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-4 font-medium">{t("admin.companyName")}</th>
                  <th className="p-4 font-medium">{t("admin.companyDomain")}</th>
                </tr>
              </thead>
              <tbody>
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <tr key={company.id} className="border-t">
                      <td className="p-4 font-medium">{company.name}</td>
                      <td className="p-4 text-muted-foreground">{company.domain || t("admin.noDomain")}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                      {t("admin.noCompaniesFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">{t("admin.userDirectory")}</h2>
            <p className="text-sm text-muted-foreground">{t("admin.userDirectorySubtitle")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-4 font-medium">{t("admin.fullName")}</th>
                  <th className="p-4 font-medium">{t("auth.email")}</th>
                  <th className="p-4 font-medium">{t("admin.company")}</th>
                  <th className="p-4 font-medium">{t("admin.userRole")}</th>
                </tr>
              </thead>
              <tbody>
                {enrichedProfiles.length > 0 ? (
                  enrichedProfiles.map((profile) => (
                    <tr key={profile.id} className="border-t">
                      <td className="p-4 font-medium">{profile.full_name || t("admin.noName")}</td>
                      <td className="p-4 text-muted-foreground">
                        {profile.email}
                        {profile.id === user?.id ? ` (${t("admin.currentUser")})` : ""}
                      </td>
                      <td className="p-4 text-muted-foreground">{profile.companyName}</td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                          {profile.role === "admin" ? t("roles.admin") : t("roles.user")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      {t("admin.noUsersFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
