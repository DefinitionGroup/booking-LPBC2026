import { ShellWrapper } from "@/components/layout/shell-wrapper";
import {
  Plus,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  DoorOpen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/actions/site-settings";
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
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { getBookingAvailability } from "@/lib/bookings/availability";

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
  const siteSettings = await getSiteSettings();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: currentProfile } = user
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .single()
    : { data: null };
  const currentProfileId = currentProfile?.id || "00000000-0000-0000-0000-000000000000";

  const now = new Date();
  const nowISO = now.toISOString();

  // --- Stats queries ---
  const { count: upcomingBookingsCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("responsible_profile_id", currentProfileId)
    .gte("start_time", nowISO)
    .eq("status", "approved");

  const { count: totalRooms } = await supabase
    .from("rooms")
    .select("*", { count: "exact", head: true });

  const { data: activeBookings } = await getBookingAvailability(
    supabase,
    nowISO,
    new Date(now.getTime() + 1000).toISOString()
  );

  const occupiedCount = new Set(activeBookings.map((b) => b.room_id)).size;
  const availableRoomsCount = (totalRooms || 0) - occupiedCount;

  const occupiedRoomIds = new Set(activeBookings.map((b) => b.room_id));

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, capacity, amenities, image_url")
    .eq("is_active", true)
    .order("name")
    .limit(6);

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

  const { data: monthBookings } = await getBookingAvailability(
    supabase,
    monthStart.toISOString(),
    monthEnd.toISOString()
  );

  const calendarBookings = monthBookings.map((booking, index) => ({
    id: `${booking.room_id}:${booking.start_time}:${index}`,
    title: t("schedule.reserved"),
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: "approved",
    room: { name: booking.room_name },
  }));

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
    .or(`user_id.eq.${currentProfileId},responsible_profile_id.eq.${currentProfileId}`)
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
      {/* ── Hero Banner ── */}
      <div className="relative -mx-4 -mt-4 mb-8 overflow-hidden sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <div className="relative h-64 sm:h-80">
          {siteSettings.hero_image_url ? (
            <Image
              src={siteSettings.hero_image_url}
              alt="Hero background"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-primary/50 to-background" />
          )}
          {/* Darken overlay */}
          <div className="absolute inset-0 bg-black/30" />
          {/* Project name */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              {siteSettings.project_name}
            </h1>
            <p className="max-w-sm text-sm text-white/80 drop-shadow">
              {user?.email
                ? t("dashboard.welcomeBack", { email: user.email })
                : t("dashboard.welcomeBackNoEmail")}
            </p>
            <Link
              href="/bookings/new"
              className="mt-2 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-5 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-white/30"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("common.newBooking")}
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl tracking-tight">{t("dashboard.title")}</h1>
          </div>
          <Link
            href="/bookings/new"
            className="inline-flex items-center rounded-full bg-emphasis px-4 py-2 text-xs font-medium text-emphasis-foreground shadow-sm transition-all hover:bg-emphasis/85"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("common.newBooking")}
          </Link>
        </div>

        {/* Tabbed content */}
        <DashboardTabs
          calendarContent={
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
          }
          roomsContent={
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("dashboard.roomGallery")}</CardTitle>
                  <CardDescription>
                    {t("dashboard.roomGalleryDesc")}
                  </CardDescription>
                </div>
                <Link
                  href="/rooms"
                  className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("dashboard.viewAllRooms")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent>
                {rooms && rooms.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rooms.map((room) => {
                      const isOccupied = occupiedRoomIds.has(room.id);
                      return (
                        <Link
                          key={room.id}
                          href={`/bookings/new?room=${room.id}`}
                          className="group relative aspect-video overflow-hidden rounded-xl border border-border transition-all hover:shadow-md hover:border-emphasis/30"
                        >
                          {room.image_url ? (
                            <Image
                              src={room.image_url}
                              alt={room.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-secondary text-white/20">
                              <DoorOpen className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white ${isOccupied ? "bg-red-500" : "bg-emerald-500"}`}
                            >
                              {isOccupied ? t("rooms.occupied") : t("rooms.available")}
                            </span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold tracking-tight text-white">{room.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-white">
                                <Users className="h-4 w-4" />
                                <span>{room.capacity}</span>
                              </div>
                            </div>
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {room.amenities.slice(0, 3).map((amenity: string) => (
                                  <span
                                    key={amenity}
                                    className="rounded-md bg-white/20 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emphasis px-3 py-1 text-xs font-medium text-emphasis-foreground transition-colors hover:bg-emphasis/85">
                              <Plus className="h-3 w-3" />
                              {t("common.newBooking")}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("rooms.noRoomsFound")}
                  </p>
                )}
              </CardContent>
            </Card>
          }
          statisticsContent={
            <div className="space-y-6">
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
            </div>
          }
        />
      </div>
    </ShellWrapper>
  );
}
