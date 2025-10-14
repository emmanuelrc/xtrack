// components/ui/chart.tsx


"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export type ChartConfig = Record<string, { label: string; color: string }>;

export function ChartContainer({
  config,
  className,
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { config: ChartConfig; children: React.ReactNode }) {
  const cssVars = React.useMemo(
    () => Object.fromEntries(Object.entries(config).map(([k, v]) => [`--color-${k}`, v.color])),
    [config]
  );
  return (
    <div className={cn("h-[180px] w-full", className)} style={{ ...cssVars, ...style }} {...props}>
      <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
    </div>
  );
}

export function ChartTooltip(props: any) {
  return <RechartsTooltip {...props} wrapperStyle={{ outline: "none" }} />;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  labelFormatter, // <-- NEW
}: {
  active?: boolean;
  payload?: any[];
  label?: any;
  hideLabel?: boolean;
  labelFormatter?: (label: any) => string; // <-- NEW
}) {
  if (!active || !payload?.length) return null;

  // De-dupe items with same dataKey (e.g., Area + Line)
  const uniqueByKey = Array.from(new Map(payload.map((it) => [it.dataKey, it])).values());
  const fmtVal = (v: unknown) => (typeof v === "number" ? v.toFixed(2) : String(v));
  const fmtLabel = labelFormatter ? labelFormatter : (l: any) => String(l);

  return (
    <div className="rounded-md border bg-background px-2 py-1.5 shadow-sm text-[11px]">
      {!hideLabel && <div className="mb-1 font-medium">{fmtLabel(label)}</div>}
      <div className="grid gap-1">
        {uniqueByKey.map((item: any) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: item.color || "var(--foreground)" }} />
            <span className="text-muted-foreground">{item.name ?? item.dataKey}:</span>
            <span className="font-medium">{fmtVal(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
