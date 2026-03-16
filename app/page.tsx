import { ShellWrapper } from "@/components/layout/shell-wrapper";
import {
  Plus,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subWeeks,
  parseISO,
} from "date-fns";
import { MonthlyCalendar } from "@/components/schedule/monthly-calendar";
import { getServerI18n } from "@/lib/i18n/server";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  WeeklyActivityChart,
  BookingTrendChart,
  RoomUtilizationChart,
} from "@/components/dashboard/dashboard-charts";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{title}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <h3 className="text-3xl tracking-tight">{value}</h3>
          {trend && (
            <span
              className={`mb-1 flex items-center gap-0.5 text-xs ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }`}
            >
              {trend.positive && <TrendingUp className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function Home() {
  const { t, locale } = await getServerI18n();
  const dateLocale = getDateFnsLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const nowISO = now.toISOString();

  // --- Stats queries ---
  const { count: upcomingBookingsCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .gte("start_time", nowISO)
    .eq("status", "approved");

  const { count: totalRooms } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });

  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("status", "approved")
    .lte("start_time", nowISO)
    .gt("end_time", nowISO);

  const occupiedCount = activeBookings
    ? new Set(activeBookings.map((b) => b.room_id)).size
    : 0;
  const availableRoomsCount = (totalRooms || 0) - occupiedCount;

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // --- Monthly bookings for calendar ---
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { data: monthBookings } = await supabase
    .from("bookings")
    .select("id, title, start_time, end_time, status, rooms(name)")
    .gte("start_time", monthStart.toISOString())
    .lte("start_time", monthEnd.toISOString())
    .order("start_time");

  const calendarBookings =
    monthBookings?.map((booking) => ({
      ...booking,
      room: Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms,
    })) || [];

  // --- Weekly activity data (current week, per day) ---
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const { data: weekBookings } = await supabase
    .from("bookings")
    .select("start_time")
    .eq("status", "approved")
    .gte("start_time", weekStart.toISOString())
    .lte("start_time", weekEnd.toISOString());

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyData = dayLabels.map((day, i) => {
    const dayDate = addDays(weekStart, i);
    const count = weekBookings?.filter((b) => {
      const d = parseISO(b.start_time);
      return (
        d.getFullYear() === dayDate.getFullYear() &&
        d.getMonth() === dayDate.getMonth() &&
        d.getDate() === dayDate.getDate()
      );
    }).length || 0;
    return { day, bookings: count };
  });

  // --- Trend data (last 4 weeks) ---
  const trendData = await Promise.all(
    [3, 2, 1, 0].map(async (weeksAgo) => {
      const ws = startOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
      const we = endOfWeek(subWeeks(now, weeksAgo), { weekStartsOn: 1 });
      const { count: approvedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("start_time", ws.toISOString())
        .lte("start_time", we.toISOString());
      const { count: pendingWeekCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .gte("start_time", ws.toISOString())
        .lte("start_time", we.toISOString());
      return {
        week: format(ws, "MMM d", { locale: dateLocale }),
        approved: approvedCount || 0,
        pending: pendingWeekCount || 0,
      };
    })
  );

  // --- Recent bookings ---
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("id, title, start_time, status, rooms(name)")
    .eq("user_id", user?.id)
    .order("start_time", { ascending: false })
    .limit(5);

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    rejected: "bg-destructive/10 text-destructive",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <ShellWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {user?.email
                ? t("dashboard.welcomeBack", { email: user.email })
                : t("dashboard.welcomeBackNoEmail")}
            </p>
          </div>
          <Link
            href="/bookings/new"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-xs text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("common.newBooking")}
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            description={t("dashboard.outOfTotalRooms", {
              total: totalRooms || 0,
            })}
          />
          <StatCard
            title={t("dashboard.totalUsers")}
            value={String(totalUsers || 0)}
            icon={Users}
            description={t("dashboard.activeInOrganization")}
          />
          <StatCard
            title={t("dashboard.pendingApprovals")}
            value={String(pendingCount || 0)}
            icon={Clock}
            description={t("dashboard.awaitingReview")}
            trend={
              (pendingCount || 0) > 0
                ? { value: `${pendingCount} pending`, positive: false }
                : undefined
            }
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Weekly activity — spans 4 */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>{t("dashboard.weeklyActivity")}</CardTitle>
              <CardDescription>
                {t("dashboard.weeklyActivityDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyActivityChart data={weeklyData} />
            </CardContent>
          </Card>

          {/* Room utilization — spans 3 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t("dashboard.roomUtilization")}</CardTitle>
              <CardDescription>
                {t("dashboard.roomUtilizationDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <RoomUtilizationChart
                occupied={occupiedCount}
                available={availableRoomsCount}
              />
              <div className="flex gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--chart-1)]" />
                  <span className="text-muted-foreground">
                    {t("dashboard.occupied")} ({occupiedCount})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[var(--chart-3)]" />
                  <span className="text-muted-foreground">
                    {t("dashboard.available")} ({availableRoomsCount})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend + Recent bookings row */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Booking trend — spans 4 */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>{t("dashboard.bookingTrend")}</CardTitle>
              <CardDescription>
                {t("dashboard.bookingTrendDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingTrendChart data={trendData} />
            </CardContent>
          </Card>

          {/* Recent bookings — spans 3 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t("dashboard.recentBookings")}</CardTitle>
              <CardDescription>
                {t("dashboard.recentBookingsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings && recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.map((booking) => {
                    const room = Array.isArray(booking.rooms)
                      ? booking.rooms[0]
                      : booking.rooms;
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between gap-3 rounded-md p-3 bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs">
                            {booking.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {room?.name ? `${room.name} · ` : ""}
                            {format(parseISO(booking.start_time), "MMM d, HH:mm", {
                              locale: dateLocale,
                            })}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={statusColors[booking.status] || ""}
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  {t("dashboard.noRecentBookings")}
                </p>
              )}
              <div className="mt-4">
                <Link
                  href="/bookings"
                  className="inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-xs hover:bg-muted/50 hover:text-accent-foreground transition-all"
                >
                  {t("dashboard.viewAllBookings")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.monthlyBookingCalendar")}</CardTitle>
            <CardDescription>
              {format(now, "MMMM yyyy", { locale: dateLocale })}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-0">
            <MonthlyCalendar bookings={calendarBookings} />
          </CardContent>
        </Card>
      </div>
    </ShellWrapper>
  );
}
