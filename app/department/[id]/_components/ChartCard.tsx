"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Point = { month: number; total_mSv: number };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ChartCard({ data }: { data: Point[] }) {
  // 12 months, fill missing with 0
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const entry = data.find((d) => d.month === i + 1);
    return { month: MONTHS[i], dose: Number(entry?.total_mSv ?? 0) };
  });

  // pill green
  const chartConfig = {
    dose: { label: "Dose (mSv)", color: "rgb(22 163 74)" }, // #16a34a
  } satisfies ChartConfig;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-4">
        {/* Label outside the plot; chart shifted with padding-left */}
        <div className="relative h-[180px]">
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1
                       text-[10px] text-gray-500 [writing-mode:vertical-rl] rotate-180 select-none"
            aria-hidden="true"
          >
            Exposure (mSv)
          </span>

          <div className="pl-6 h-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 12, right: 8, left: 0, bottom: 12 }}
                barCategoryGap={18}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tick={false}
                  axisLine={false}
                  width={0} // hide y-axis ticks/space
                />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.06 }}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="dose" fill="var(--color-dose)" radius={8} barSize={16}>
                  <LabelList
                    dataKey="dose"
                    position="top"
                    offset={10}
                    className="fill-foreground"
                    fontSize={10}
                    formatter={(val: number) => (val > 0 ? val.toFixed(1) : "")}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
