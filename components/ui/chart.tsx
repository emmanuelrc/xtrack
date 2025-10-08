// components/ui/chart.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export type ChartConfig = Record<
  string,
  {
    label: string;
    color: string; // e.g. "var(--chart-1)"
  }
>;

type ChartContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
  children: React.ReactNode;
};

/** Wraps Recharts in a sized container and exposes CSS vars like --color-dose */
export function ChartContainer({
  config,
  className,
  style,
  children,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(() => {
    return Object.fromEntries(
      Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color])
    );
  }, [config]);

  return (
    <div
      className={cn("h-[180px] w-full", className)}
      style={{ ...cssVars, ...style }}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

/** Thin wrapper for Recharts Tooltip to keep API consistent */
export function ChartTooltip(props: any) {
  return <RechartsTooltip {...props} wrapperStyle={{ outline: "none" }} />;
}

/** Default tooltip body used by <ChartTooltip content={<ChartTooltipContent />} /> */
export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
}: any) {
  if (!active || !payload?.length) return null;

  const fmt = (v: unknown) =>
    typeof v === "number" ? v.toFixed(2) : String(v);

  return (
    <div className="rounded-md border bg-background px-2 py-1.5 shadow-sm text-[11px]">
      {!hideLabel && <div className="mb-1 font-medium">{label}</div>}
      <div className="grid gap-1">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: item.color || "var(--foreground)" }}
            />
            <span className="text-muted-foreground">
              {item.name ?? item.dataKey}:
            </span>
            <span className="font-medium">{fmt(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

