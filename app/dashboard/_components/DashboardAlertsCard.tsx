// app/dashboard/_components/DashboardAlertsCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, BellRing } from "lucide-react";

type Alert = {
  workerId: number;
  name: string;
  role: string | null;
  month: number;        // 1..12
  reading_mSv: number;
  limit_mSv: number;
};

const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/*
  Compact version tailored for the Dashboard:
  - Shorter row height
  - Constrained height with vertical scroll
  - No internal section heading (the page provides it)
*/
export default function DashboardAlertsCard({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="bg-gray-200 shadow-md">
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="p-3 text-xs text-gray-700">No alerts for this year</div>
        ) : (
          <ul className="divide-y divide-gray-300 max-h-44 overflow-y-auto">
            {alerts.map((a) => (
              <li key={`${a.workerId}-${a.month}`} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <BellRing className="w-4 h-4 text-gray-700" />
                  <div className="leading-tight">
                    <div className="text-sm font-medium text-gray-900">{a.name}</div>
                    <div className="text-[10px] text-gray-700">
                      {a.role ?? "—"} • {monthNames[a.month - 1]}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs">
                    <span className="font-semibold">{a.reading_mSv.toFixed(2)} mSv</span>
                    <span className="text-gray-700"> / {a.limit_mSv.toFixed(2)} mSv</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
