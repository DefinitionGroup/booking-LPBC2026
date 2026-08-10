import { getServerI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { CreateCompanyButton } from "@/components/admin/create-company-button";
import { InviteUserButton } from "@/components/admin/invite-user-button";
import { CompanyActions } from "@/components/admin/company-actions";
import { UserActions } from "@/components/admin/user-actions";

type CompanyRecord = {
  id: string;
  name: string;
  domain: string | null;
  status: "active" | "inactive";
  deactivation_reason: string | null;
  created_at?: string;
};

type UserSummaryRecord = {
  profile_id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user";
  company_id: string | null;
  profile_status: "active" | "inactive" | "anonymized";
  deactivation_reason: string | null;
  created_at: string;
  booking_count: number;
  future_responsibility_count: number;
  has_auth_account: boolean;
};

type CompanySummaryRecord = {
  company_id: string;
  company_name: string;
  company_domain: string | null;
  company_status: "active" | "inactive";
  deactivation_reason: string | null;
  created_at: string;
  user_count: number;
  booking_count: number;
};

export default async function AdminUsersPage() {
  const { t } = await getServerI18n();
  const standardClient = await createClient();
  const {
    data: { user },
  } = await standardClient.auth.getUser();

  const [companiesResult, usersResult, currentProfileResult] = await Promise.all([
    standardClient.rpc("get_company_admin_summary"),
    standardClient.rpc("get_user_admin_summary"),
    standardClient
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user?.id || "00000000-0000-0000-0000-000000000000")
      .single(),
  ]);

  if (companiesResult.error || usersResult.error || currentProfileResult.error) {
    throw new Error("Could not load company administration data");
  }

  const companySummaries = (companiesResult.data || []) as CompanySummaryRecord[];
  const companies = companySummaries.map((company) => ({
    id: company.company_id,
    name: company.company_name,
    domain: company.company_domain,
    status: company.company_status,
    deactivation_reason: company.deactivation_reason,
    created_at: company.created_at,
    userCount: Number(company.user_count),
    bookingCount: Number(company.booking_count),
  })) as (CompanyRecord & { userCount: number; bookingCount: number })[];
  const profiles = (usersResult.data || []) as UserSummaryRecord[];

  const companyMap = new Map(companies.map((company) => [company.id, company]));
  const enrichedProfiles = profiles.map((profile) => ({
    ...profile,
    id: profile.profile_id,
    status: profile.profile_status,
    bookingCount: Number(profile.booking_count),
    futureResponsibilityCount: Number(profile.future_responsibility_count),
    hasAuthAccount: profile.has_auth_account,
    companyName: profile.company_id ? companyMap.get(profile.company_id)?.name || t("admin.unassignedCompany") : t("admin.unassignedCompany"),
  }));
  const replacementUsers = enrichedProfiles
    .filter((profile) => profile.status === "active")
    .map((profile) => ({
      id: profile.id,
      name: profile.full_name || profile.email,
      companyId: profile.company_id,
      companyName: profile.company_id ? companyMap.get(profile.company_id)?.name || t("admin.unassignedCompany") : t("admin.unassignedCompany"),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl tracking-tight">{t("admin.usersTitle")}</h1>
          <p className="text-muted-foreground">{t("admin.usersSubtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CreateCompanyButton />
          <InviteUserButton companies={companies.filter((company) => company.status === "active").map((company) => ({ id: company.id, name: company.name }))} />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg">{t("admin.companiesTitle")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.companiesSubtitle")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-xs">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-4">{t("admin.companyName")}</th>
                  <th className="p-4">{t("admin.companyDomain")}</th>
                  <th className="p-4">{t("common.status")}</th>
                  <th className="p-4">{t("common.users")}</th>
                  <th className="p-4">{t("common.bookings")}</th>
                  <th className="p-4 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <tr key={company.id} className="border-t">
                      <td className="p-4">
                        <div>{company.name}</div>
                        {company.status === "inactive" && company.deactivation_reason && (
                          <div className="mt-1 max-w-64 truncate text-[11px] text-muted-foreground" title={company.deactivation_reason}>
                            {company.deactivation_reason}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{company.domain || t("admin.noDomain")}</td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${company.status === "active" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                          {company.status === "active" ? t("admin.active") : t("admin.inactive")}
                        </span>
                      </td>
                      <td className="p-4 tabular-nums">{company.userCount}</td>
                      <td className="p-4 tabular-nums">{company.bookingCount}</td>
                      <td className="p-4 text-right">
                        <CompanyActions company={{
                          id: company.id,
                          name: company.name,
                          domain: company.domain,
                          status: company.status,
                          userCount: company.userCount,
                          bookingCount: company.bookingCount,
                        }} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      {t("admin.noCompaniesFound")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/30 px-5 py-4">
            <h2 className="text-lg">{t("admin.userDirectory")}</h2>
            <p className="text-xs text-muted-foreground">{t("admin.userDirectorySubtitle")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-xs">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-4">{t("admin.fullName")}</th>
                  <th className="p-4">{t("auth.email")}</th>
                  <th className="p-4">{t("admin.company")}</th>
                  <th className="p-4">{t("admin.userRole")}</th>
                  <th className="p-4">{t("common.status")}</th>
                  <th className="p-4">{t("common.bookings")}</th>
                  <th className="p-4">{t("admin.futureResponsibility")}</th>
                  <th className="p-4 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {enrichedProfiles.length > 0 ? (
                  enrichedProfiles.map((profile) => (
                    <tr key={profile.id} className="border-t">
                      <td className="p-4">{profile.full_name || t("admin.noName")}</td>
                      <td className="p-4 text-muted-foreground">
                        {profile.email}
                        {profile.id === currentProfileResult.data.id ? ` (${t("admin.currentUser")})` : ""}
                      </td>
                      <td className="p-4 text-muted-foreground">{profile.companyName}</td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs">
                          {profile.role === "admin" ? t("roles.admin") : t("roles.user")}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${profile.status === "active" ? "bg-emerald-500/10 text-emerald-700" : profile.status === "inactive" ? "bg-amber-500/10 text-amber-700" : "bg-muted text-muted-foreground"}`}>
                          {t(`admin.userStatus.${profile.status}`)}
                        </span>
                      </td>
                      <td className="p-4 tabular-nums">{profile.bookingCount}</td>
                      <td className="p-4 tabular-nums">{profile.futureResponsibilityCount}</td>
                      <td className="p-4 text-right">
                        <UserActions
                          profile={{
                            id: profile.id,
                            email: profile.email,
                            fullName: profile.full_name,
                            role: profile.role,
                            companyId: profile.company_id,
                            status: profile.status,
                            futureResponsibilityCount: profile.futureResponsibilityCount,
                            hasAuthAccount: profile.hasAuthAccount,
                            isCurrentUser: profile.id === currentProfileResult.data.id,
                          }}
                          companies={companies.map((company) => ({
                            id: company.id,
                            name: company.name,
                            status: company.status,
                          }))}
                          replacementUsers={replacementUsers}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
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
