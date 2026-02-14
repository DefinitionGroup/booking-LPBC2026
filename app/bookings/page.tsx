import { ShellWrapper } from "@/components/layout/shell-wrapper";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { format } from "date-fns";

export default async function BookingsPage() {
    const supabase = await createClient();
    const { data: bookings } = await supabase
        .from("bookings")
        .select("*, rooms(name), profiles(email)")
        .order("start_time", { ascending: true });

    return (
        <ShellWrapper>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                    <Link
                        href="/bookings/new"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Booking
                    </Link>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Room</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Date & Time</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {bookings && bookings.length > 0 ? (
                                bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{booking.title}</td>
                                        <td className="px-6 py-4">{booking.rooms?.name || "Unknown Room"}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{booking.profiles?.email || "Unknown User"}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span>{format(new Date(booking.start_time), "MMM d, yyyy")}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                                        ${booking.status === 'approved' ? 'bg-green-500/10 text-green-700' :
                                                    booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700' :
                                                        'bg-red-500/10 text-red-700'}`}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                        No bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ShellWrapper>
    );
}
