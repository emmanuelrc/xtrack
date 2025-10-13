// app/dashboard/_components/StatsCard.tsx
"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

// Sample data; replace with server data (e.g., org-level chest/eye monthly exposure)
const chartData = [
  { month: "January",  chest: 12.3, eye: 4.1 },
  { month: "February", chest: 18.6, eye: 5.9 },
  { month: "March",    chest: 10.2, eye: 3.7 },
  { month: "April",    chest: 15.9, eye: 6.2 },
  { month: "May",      chest: 13.1, eye: 5.4 },
  { month: "June",     chest: 16.7, eye: 6.9 },
];

const chartConfig = {
  chest: { label: "Chest", color: "var(--chart-1)" },
  eye:   { label: "Eye",   color: "var(--chart-2)"  },
} satisfies ChartConfig;

export default function StatsCard() {
  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Exposure Trends for Radiology</CardTitle>
        <CardDescription className="text-xs">Showing exposure for the last 6 months</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v: string) => v.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillChest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-chest)" stopOpacity={0.85} />
                <stop offset="95%" stopColor="var(--color-chest)" stopOpacity={0.10} />
              </linearGradient>
              <linearGradient id="fillEye" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-eye)" stopOpacity={0.85} />
                <stop offset="95%" stopColor="var(--color-eye)" stopOpacity={0.10} />
              </linearGradient>
            </defs>

            <Area
              dataKey="eye"
              type="natural"
              fill="url(#fillEye)"
              fillOpacity={0.4}
              stroke="var(--color-eye)"
              stackId="a"
            />
            <Area
              dataKey="chest"
              type="natural"
              fill="url(#fillChest)"
              fillOpacity={0.4}
              stroke="var(--color-chest)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-xs">
          <div className="grid gap-1">
            <div className="flex items-center gap-1.5 leading-none font-medium">
              Trending up by 5.2% this month <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="text-muted-foreground leading-none">January – June 2024</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
