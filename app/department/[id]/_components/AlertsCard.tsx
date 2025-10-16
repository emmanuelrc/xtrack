// app/department/[id]/_components/AlertsCard.tsx
// make the list scroll inside the card so the section never grows too tall

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, BellRing } from "lucide-react";

type Alert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number; // 1..12
  reading_mSv: number;
  limit_mSv: number;
};

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AlertsCard({ alerts }: { alerts: Alert[] }) {
  return (
    <section aria-labelledby="alerts-heading">
      <Card className="bg-[#c7c6c6] border-none text-[#1f2937] overflow-hidden">
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#4b5563]">No alerts for this year</div>
          ) : (
            // group wrapper = reveal thin scrollbars on hover (see globals.css)
            <div className="group/scroll relative">
              {/* this is the scrolling container; header inside stays sticky */}
              <div className="hover-scroll overflow-y-auto max-h-40">
                {/* tiny sticky header */}
                <div className="sticky top-0 z-10 h-5 px-2 flex items-center border-b border-black/10 bg-[#c7c6c6]">
                  <h2
                    id="alerts-heading"
                    className="text-[10px] font-semibold uppercase tracking-wider leading-none text-[#374151]"
                  >
                    Alerts
                  </h2>
                </div>

                <ul className="divide-y divide-black/10">
                  {alerts.map((a) => (
                    <li
                      key={`${a.workerId}-${a.month}`}
                      className="flex items-center justify-between pr-3 pl-1 py-1.5 first:pt-1 last:pb-1 hover:bg-black/5 transition-colors"
                    >
                      {/* left: bell close to edge + text */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <BellRing className="w-3.5 h-3.5 text-[#374151] shrink-0" />
                        <div className="leading-tight min-w-0">
                          <div className="text-sm font-medium truncate">{a.name}</div>
                          <div className="text-[10px] text-[#4b5563] truncate">
                            {a.role ?? "—"} • {monthNames[a.month - 1]}
                          </div>
                        </div>
                      </div>

                      {/* right: compact numbers + chevron */}
                      <div className="flex items-center gap-1">
                        <div className="text-xs text-right leading-none whitespace-nowrap">
                          <span className="font-semibold">{a.reading_mSv.toFixed(2)}</span>
                          <span className="text-[#4b5563]"> / {a.limit_mSv.toFixed(2)} mSv</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#374151] shrink-0" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
