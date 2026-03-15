import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { Plus, Clock, Users, Calendar, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { MonthlyCalendar } from "@/components/schedule/monthly-calendar";
import { getServerI18n } from "@/lib/i18n/server";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="p-2 bg-secondary rounded-lg">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold">{value}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    </div>
  );
}

export default async function Home() {
  const { t, locale } = await getServerI18n();
  const dateLocale = getDateFnsLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const { count: upcomingBookingsCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .gte("start_time", now)
    .eq("status", "approved");

  const { count: totalRooms } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });

  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("status", "approved")
    .lte("start_time", now)
    .gt("end_time", now);

  const occupiedCount = activeBookings
    ? new Set(activeBookings.map((booking) => booking.room_id)).size
    : 0;
  const availableRoomsCount = (totalRooms || 0) - occupiedCount;

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const { data: monthBookings } = await supabase
    .from("bookings")
    .select("id, title, start_time, end_time, status, rooms(name)")
    .eq("status", "approved")
    .gte("start_time", monthStart.toISOString())
    .lte("start_time", monthEnd.toISOString())
    .order("start_time");

  const calendarBookings =
    monthBookings?.map((booking) => ({
      ...booking,
      room: Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms,
    })) || [];

  return (
    <ShellWrapper>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {user?.email
                ? t("dashboard.welcomeBack", { email: user.email })
                : t("dashboard.welcomeBackNoEmail")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {t("common.newBooking")}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title={t("dashboard.myUpcomingBookings")}
            value={String(upcomingBookingsCount || 0)}
            icon={Calendar}
            description={t("dashboard.approvedFutureMeetings")}
          />
          <StatCard
            title={t("dashboard.availableRooms")}
            value={String(availableRoomsCount)}
            icon={Clock}
            description={t("dashboard.outOfTotalRooms", { total: totalRooms || 0 })}
          />
          <StatCard
            title={t("dashboard.totalUsers")}
            value={String(totalUsers || 0)}
            icon={Users}
            description={t("dashboard.activeInOrganization")}
          />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm p-5 sm:p-6">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">{t("dashboard.monthlyBookingCalendar")}</h3>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), "MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
            <div className="p-0 pt-5">
              <MonthlyCalendar bookings={calendarBookings} />
            </div>
        </div>
      </div>
    </ShellWrapper>
  );
}
