"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  Label as RechartsLabel,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// --- Weekly Activity Bar Chart ---

const weeklyChartConfig = {
  bookings: { label: "Bookings", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function WeeklyActivityChart({
  data,
}: {
  data: { day: string; bookings: number }[];
}) {
  return (
    <ChartContainer config={weeklyChartConfig} className="h-[220px] w-full">
      <BarChart data={data} barSize={32}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="bookings" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

// --- Booking Trend Area Chart ---

const trendChartConfig = {
  approved: { label: "Approved", color: "var(--chart-1)" },
  pending: { label: "Pending", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function BookingTrendChart({
  data,
}: {
  data: { week: string; approved: number; pending: number }[];
}) {
  return (
    <ChartContainer config={trendChartConfig} className="h-[220px] w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="approved"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="pending"
          stroke="var(--chart-2)"
          fill="var(--chart-2)"
          fillOpacity={0.1}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// --- Room Utilization Donut ---

const DONUT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const utilizationConfig = {
  occupied: { label: "Occupied", color: "var(--chart-1)" },
  available: { label: "Available", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function RoomUtilizationChart({
  occupied,
  available,
}: {
  occupied: number;
  available: number;
}) {
  const total = occupied + available;
  const data = [
    { name: "Occupied", value: occupied },
    { name: "Available", value: available },
  ];

  return (
    <ChartContainer config={utilizationConfig} className="mx-auto h-[180px] w-[180px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}
          <RechartsLabel
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-2xl"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 20}
                      className="fill-muted-foreground text-xs"
                    >
                      rooms
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
