"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CalendarDays, DoorOpen, BarChart3 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

const tabs = [
  { id: "calendar", icon: CalendarDays, labelKey: "dashboard.tabCalendar" },
  { id: "rooms", icon: DoorOpen, labelKey: "dashboard.tabRooms" },
  { id: "statistics", icon: BarChart3, labelKey: "dashboard.tabStatistics" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface DashboardTabsProps {
  calendarContent: React.ReactNode;
  roomsContent: React.ReactNode;
  statisticsContent: React.ReactNode;
}

export function DashboardTabs({
  calendarContent,
  roomsContent,
  statisticsContent,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const { t } = useI18n();

  const content: Record<TabId, React.ReactNode> = {
    calendar: calendarContent,
    rooms: roomsContent,
    statistics: statisticsContent,
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-full bg-muted/50 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-emphasis text-emphasis-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {content[activeTab]}
    </div>
  );
}
