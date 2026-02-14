"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarDays,
    DoorOpen,
    Settings,
    Menu,
    X,
    CreditCard,
    Building2,
} from "lucide-react";

interface AppShellProps {
    children: React.ReactNode;
    userNav?: React.ReactNode;
}

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Schedule", href: "/schedule", icon: CalendarDays },
    { name: "Bookings", href: "/bookings", icon: CreditCard },
    { name: "Rooms", href: "/rooms", icon: DoorOpen },
    { name: "Building", href: "/building", icon: Building2 }, // Admin?
    { name: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children, userNav }: AppShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Mobile Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/80 lg:hidden transition-opacity",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span>Equinox Rooms</span>
                    </div>
                    <button
                        type="button"
                        className="ml-auto lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-6 w-6 text-muted-foreground" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-6 py-8">
                    <ul role="list" className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-6 w-6 shrink-0",
                                                isActive
                                                    ? "text-primary-foreground"
                                                    : "text-muted-foreground group-hover:text-foreground"
                                            )}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header (Desktop & Mobile) */}
                <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-muted-foreground lg:hidden hover:text-foreground"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
                        <span className="lg:hidden text-sm font-semibold leading-6 text-foreground mr-auto">
                            Dashboard
                        </span>

                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Separator if needed */}
                            {/* User Nav */}
                            {userNav}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-secondary/30 p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
