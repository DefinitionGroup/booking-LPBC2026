"use client";

import { updateBookingStatus } from "@/actions/bookings";
import { format } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Booking {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    rooms?: { name: string } | null;
    profiles?: { email: string } | null;
}

export function AdminBookingTable({ bookings }: { bookings: Booking[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            const result = await updateBookingStatus(id, status);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm text-left">
                    <thead className="bg-secondary text-muted-foreground font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-3">Queued</th>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Room</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                        {/* Ideally created_at diff */}
                                        New
                                    </td>
                                    <td className="px-6 py-4 font-medium">{booking.title}</td>
                                    <td className="px-6 py-4">{booking.rooms?.name || "Unknown"}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{booking.profiles?.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span className="font-medium">{format(new Date(booking.start_time), "MMM d")}</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'approved')}
                                                disabled={!!processingId}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50"
                                                title="Approve"
                                            >
                                                {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                disabled={!!processingId}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                                                title="Reject"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    No pending bookings to review.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
