import Link from "next/link";
import { AdminBookingTable } from "@/components/admin/admin-booking-table";
import { createClient } from "@/lib/supabase/server";
import { getServerI18n } from "@/lib/i18n/server";

const pageSize = 25;
const statuses = ["pending", "approved", "rejected", "cancelled"] as const;

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function AdminBookingsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getServerI18n();
  const searchParams = await props.searchParams;
  const requestedPage = Number.parseInt(getParam(searchParams.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedStatus = getParam(searchParams.status);
  const status = statuses.includes(requestedStatus as (typeof statuses)[number])
    ? requestedStatus as (typeof statuses)[number]
    : null;
  const search = getParam(searchParams.q).trim().slice(0, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("id, title, start_time, end_time, status, rooms(name), creator:profiles!bookings_user_id_fkey(email), responsible:profiles!bookings_responsible_profile_id_fkey(email)", { count: "exact" })
    .order("start_time", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error("Could not load bookings");

  const bookings = (data || []).map((booking) => ({
    ...booking,
    rooms: Array.isArray(booking.rooms) ? booking.rooms[0] || null : booking.rooms,
    creator: Array.isArray(booking.creator) ? booking.creator[0] || null : booking.creator,
    responsible: Array.isArray(booking.responsible) ? booking.responsible[0] || null : booking.responsible,
  }));
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("q", search);
    params.set("page", String(nextPage));
    return `/admin/bookings?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl tracking-tight">{t("admin.bookingsTitle")}</h1>
        <p className="text-muted-foreground">{t("admin.bookingsSubtitle")}</p>
      </div>

      <form className="flex flex-col gap-3 rounded-lg border border-border/50 bg-background/50 p-3 sm:flex-row sm:items-end" method="get">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="booking-search" className="text-xs text-muted-foreground">{t("admin.searchBookings")}</label>
          <input
            id="booking-search"
            name="q"
            defaultValue={search}
            maxLength={100}
            placeholder={t("admin.searchBookingsPlaceholder")}
            className="flex h-9 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>
        <div className="space-y-1.5 sm:w-48">
          <label htmlFor="booking-status" className="text-xs text-muted-foreground">{t("common.status")}</label>
          <select
            id="booking-status"
            name="status"
            defaultValue={status || ""}
            className="flex h-9 w-full rounded-md border border-border/60 bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="">{t("admin.allStatuses")}</option>
            {statuses.map((item) => <option key={item} value={item}>{t(`status.${item}`)}</option>)}
          </select>
        </div>
        <button className="h-9 rounded-lg bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/80" type="submit">
          {t("admin.applyFilters")}
        </button>
      </form>

      <AdminBookingTable bookings={bookings} emptyMessage={t("bookings.tableNoBookings")} />

      <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{t("admin.bookingResultCount", { count: count || 0 })}</span>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={page <= 1}
            className={`rounded-md border border-border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
            href={pageHref(Math.max(1, page - 1))}
          >
            {t("common.previous")}
          </Link>
          <span>{t("admin.pageOf", { page, total: totalPages })}</span>
          <Link
            aria-disabled={page >= totalPages}
            className={`rounded-md border border-border px-3 py-1.5 ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
            href={pageHref(Math.min(totalPages, page + 1))}
          >
            {t("common.next")}
          </Link>
        </div>
      </div>
    </div>
  );
}
