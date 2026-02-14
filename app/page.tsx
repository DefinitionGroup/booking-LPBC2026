import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { Plus, Clock, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Timeline } from "@/components/schedule/timeline";

function StatCard({ title, value, icon: Icon, description }: { title: string, value: string, icon: any, description?: string }) {
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get Upcoming Bookings (My bookings in future)
  const now = new Date().toISOString();
  const { count: upcomingBookingsCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .gte('start_time', now)
    .eq('status', 'approved');

  // 2. Get Available Rooms (Total Rooms - Active Bookings Now)
  const { count: totalRooms } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true });

  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('room_id')
    .eq('status', 'approved')
    .lte('start_time', now)
    .gt('end_time', now);

  const occupiedCount = activeBookings ? new Set(activeBookings.map(b => b.room_id)).size : 0;
  const availableRoomsCount = (totalRooms || 0) - occupiedCount;

  // 3. Get Total Users (If admin, else show something else or hide)
  // For now, let's show "My Bookings" count or similar if not admin, but user asked for "connected to app state".
  // Let's stick to the existing "Total Users" card but make it real if possible, or swap it for "Pending Requests" if admin?
  // Let's just fetch total profiles for now to match the UI placeholder.
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // 4. Get Today's Schedule (Approved bookings for everyone)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: todaysBookings } = await supabase
    .from('bookings')
    .select('id, title, start_time, end_time, status, rooms(name)')
    .eq('status', 'approved')
    .gte('start_time', startOfDay.toISOString())
    .lte('end_time', endOfDay.toISOString())
    .order('start_time');

  // Transform for Timeline component
  const timelineBookings = todaysBookings?.map(b => ({
    ...b,
    room: Array.isArray(b.rooms) ? b.rooms[0] : b.rooms
  })) || [];

  return (
    <ShellWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back{user?.email ? `, ${user.email}` : ""}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/bookings/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="My Upcoming Bookings"
            value={String(upcomingBookingsCount || 0)}
            icon={Calendar}
            description="Approved future meetings"
          />
          <StatCard
            title="Available Rooms"
            value={String(availableRoomsCount)}
            icon={Clock}
            description={`Out of ${totalRooms} total rooms`}
          />
          <StatCard
            title="Total Users"
            value={String(totalUsers || 0)}
            icon={Users}
            description="Active in organization"
          />
        </div>

        {/* Recent Activity / Timeline */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm h-[600px] flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Today's Schedule</h3>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
            </div>
            <div className="p-0 flex-1 overflow-hidden">
              <Timeline bookings={timelineBookings} />
            </div>
          </div>
          <div className="col-span-3 rounded-xl border border-border bg-card shadow-sm h-[600px]">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="p-6 text-muted-foreground">
              {/* Just a list of helpful links for now */}
              <ul className="space-y-4">
                <li>
                  <Link href="/rooms" className="flex items-center gap-2 hover:underline">
                    <Clock className="h-4 w-4" /> Browse Rooms
                  </Link>
                </li>
                <li>
                  <Link href="/schedule" className="flex items-center gap-2 hover:underline">
                    <Calendar className="h-4 w-4" /> Full Schedule
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ShellWrapper>
  );
}
