// app/dashboard/_components/DashboardAlertsCard.tsx
// shrink top and bottom space of the card only: tiny header bar + less padding on first/last rows

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, BellRing } from "lucide-react";

type Alert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number;        // 1..12
  reading_mSv: number;
  limit_mSv: number;
  year?: number;        // optional for ’YY
};

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DashboardAlertsCard({ alerts }: { alerts: Alert[] }) {
  const fallbackYear = new Date().getUTCFullYear();

  const uniqueAlerts = Array.from(
    new Map(alerts.map((a) => [`${a.workerId}-${a.year ?? "x"}-${a.month}`, a])).values()
  );

  return (
    <Card className="bg-[#c7c6c6] border-none text-[#1f2937] overflow-hidden">
      {/* very short header bar; removes extra space above title */}
      <div className="sticky top-0 z-10 h-4 px-2 flex items-center border-b border-black/10 bg-[#c7c6c6]">
        <span className="text-[10px] font-semibold uppercase tracking-wider leading-none text-[#374151]">
          Alerts
        </span>
      </div>

      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[#4b5563]">No alerts for this year</div>
        ) : (
          <ul className="max-h-44 overflow-y-auto divide-y divide-black/10">
            {uniqueAlerts.map((a) => {
              const yy = String(a.year ?? fallbackYear).slice(-2);
              return (
                <li
                  key={`${a.workerId}-${a.year ?? "x"}-${a.month}`}
                  // keep regular row height, but trim the topmost and bottommost padding
                  className="flex items-center justify-between pr-3 pl-1 py-1.5 first:pt-1 last:pb-1 hover:bg-black/5 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BellRing className="h-4 w-4 text-[#374151] shrink-0" />
                    <div className="leading-tight min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-[#4b5563] truncate">
                        {a.role ?? "—"} • {monthNames[a.month - 1]} ’{yy}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="text-xs text-right leading-none whitespace-nowrap">
                      <span className="font-semibold">{a.reading_mSv.toFixed(2)}</span>
                      <span className="text-[#4b5563]"> / {a.limit_mSv.toFixed(2)} mSv</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#374151] shrink-0" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
