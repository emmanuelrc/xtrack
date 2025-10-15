// app/dashboard/_components/DeptDonut.tsx
"use client";

import * as React from "react";
import { Pie, PieChart, Sector, Label } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export type DeptCount = { name: string; count: number | string };

const GREENS = ["#22c55e", "#16a34a", "#10b981", "#059669", "#34d399", "#0ea5a0", "#2dd4bf"];

const makeConfig = (names: string[]): ChartConfig =>
  names.reduce(
    (acc, n, i) => ({ ...acc, [n]: { label: n, color: GREENS[i % GREENS.length] } }),
    { count: { label: "Dosimeters" } } as ChartConfig
  );

export default function DeptDonut({
  data,
  title = "Dosimeters by Department",
  totalOverride,
  centerLabel = "Dosimeters",
}: {
  data: DeptCount[];
  title?: string;
  totalOverride?: number;
  centerLabel?: string;
}) {
  const coerce = (v: number | string) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const sliceSum = React.useMemo(() => data.reduce((s, d) => s + coerce(d.count), 0), [data]);

  const chartData = React.useMemo(
    () =>
      data.map((d, i) => ({
        department: d.name,
        count: coerce(d.count),
        fill: GREENS[i % GREENS.length],
      })),
    [data]
  );

  const chartConfig = React.useMemo(() => makeConfig(data.map((d) => d.name)), [data]);

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const total = typeof totalOverride === "number" ? totalOverride : sliceSum;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[260px]">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="department"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={6}
              paddingAngle={1.5}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              activeIndex={activeIndex ?? undefined}
              activeShape={
                activeIndex != null
                  ? ({ outerRadius = 0, ...props }: PieSectorDataItem) => (
                      <Sector {...props} outerRadius={outerRadius + 10} />
                    )
                  : undefined
              }
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    const { cx, cy } = viewBox as { cx: number; cy: number };
                    return (
                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={cx} y={cy} className="fill-foreground text-3xl font-bold">
                          {total.toLocaleString()}
                        </tspan>
                        <tspan x={cx} y={cy + 22} className="fill-muted-foreground text-sm">
                          {centerLabel}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
