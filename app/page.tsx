import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { Plus, Clock, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

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
          <StatCard title="Upcoming Bookings" value="3" icon={Calendar} description="Next: Team Sync at 2:00 PM" />
          <StatCard title="Available Rooms" value="8" icon={Clock} description="Currently free across 2 floors" />
          <StatCard title="Total Users" value="24" icon={Users} description="Active in your organization" />
        </div>

        {/* Recent Activity / Timeline */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm h-[400px]">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Today's Schedule</h3>
            </div>
            <div className="p-6 flex items-center justify-center text-muted-foreground">
              {/* Placeholder for Timeline Component */}
              Timeline View Placeholder
            </div>
          </div>
          <div className="col-span-3 rounded-xl border border-border bg-card shadow-sm h-[400px]">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="p-6 text-muted-foreground">
              {/* Placeholder for Actions */}
              Quick Actions Placeholder
            </div>
          </div>
        </div>
      </div>
    </ShellWrapper>
  );
}
