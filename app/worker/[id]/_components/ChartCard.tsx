//app/worker/[id]/_components/ChartCard.tsx

"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type Point = { month: number; total_mSv: number };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ChartCard({
  data,
  limit,
}: {
  data: Point[];
  /** Monthly dose limit to display as a dashed line (mSv). */
  limit?: number | null;
}) {
  // Normalize to 12 months
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const entry = data.find((d) => d.month === i + 1);
    return { month: MONTHS[i], dose: Number(entry?.total_mSv ?? 0) };
  });

  const maxDose = Math.max(0, ...chartData.map((d) => d.dose));
  const showLimit = typeof limit === "number";
  const yMax = showLimit ? Math.max(maxDose, limit!) * 1.1 : maxDose * 1.1 || 1; // keep headroom

  const chartConfig = {
    dose: { label: "Dose (mSv)", color: "rgb(22 163 74)" },
  } satisfies ChartConfig;

  return (
    <Card className="bg-white shadow-md">
      <CardContent className="p-4">
        {/* Left-side vertical axis title */}
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
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />

                {/* Y axis shows ONLY the limit value as a tick when provided */}
                <YAxis
                  type="number"
                  domain={[0, yMax]}
                  tickLine={false}
                  axisLine={false}
                  width={showLimit ? 28 : 0}
                  ticks={showLimit ? [Number(limit)] : undefined}
                  tick={
                    showLimit
                      ? { fontSize: 12, fill: "#6b7280" } // gray-500
                      : false
                  }
                  tickFormatter={(v) => Number(v).toFixed(1)}
                />

                {/* Dashed dose limit */}
                {showLimit && (
                  <ReferenceLine
                    y={Number(limit)}
                    stroke="#e11d48"          // rose-600
                    strokeDasharray="6 4"
                    ifOverflow="extendDomain"
                    label={{
                      value: "Dose Limit",
                      position: "top",
                      fill: "#e11d48",
                      fontSize: 11,
                    }}
                  />
                )}

                <ChartTooltip cursor={{ fillOpacity: 0.06 }} content={<ChartTooltipContent />} />
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
