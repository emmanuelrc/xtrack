// app/comparison/_components/ChartCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type Row = { m: number; y: number; value: number; chestExceeds?: boolean };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ComparisonChartCard({
  departmentName,
  year,
  data,
  monthlyLimit, 
}: {
  departmentName?: string;
  year: number;
  data: Row[];
  monthlyLimit?: number | null;
}) {
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const entry = data.find(d => d.m === i + 1);
    return { month: MONTHS[i], value: Number(entry?.value ?? 0) };
  });

  const maxVal = Math.max(0, ...chartData.map(d => d.value));
  const showLimit = typeof monthlyLimit === "number";
  const yMax = showLimit ? Math.max(maxVal, monthlyLimit!) * 1.1 : maxVal * 1.1 || 1;

  const chartConfig = { value: { label: "Avg dose (mSv)", color: "rgb(22 163 74)" } } satisfies ChartConfig;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-4">
        <div className="flex items-end justify-between mb-2">
          <div className="text-sm text-gray-600">
            {departmentName ? `${departmentName} — ${year}` : `${year}`}
          </div>
        </div>

        <div className="relative h-[200px]">
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
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  type="number"
                  domain={[0, yMax]}
                  tickLine={false}
                  axisLine={false}
                  width={showLimit ? 28 : 0}
                  tick={showLimit ? { fontSize: 12, fill: "#6b7280" } : false}
                  tickFormatter={(v) => Number(v).toFixed(1)}
                />

                {showLimit && (
                  <ReferenceLine
                    y={Number(monthlyLimit)}
                    stroke="#e11d48"
                    strokeDasharray="6 4"
                    ifOverflow="extendDomain"
                    label={{ value: "Dose Limit", position: "top", fill: "#e11d48", fontSize: 11 }}
                  />
                )}

                <ChartTooltip cursor={{ fillOpacity: 0.06 }} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={8} barSize={16}>
                  <LabelList
                    dataKey="value"
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
