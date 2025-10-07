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
      <h2 id="alerts-heading" className="text-gray-700 text-lg font-semibold mb-2">
        Alerts
      </h2>
      <Card className="bg-gray-200 shadow-md">
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="p-4 text-sm text-gray-700">No alerts for this year 🎉</div>
          ) : (
            <ul className="divide-y divide-gray-300">
              {alerts.map((a) => (
                <li key={`${a.workerId}-${a.month}`} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 text-gray-700" />
                    <div>
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-700">{a.role ?? "—"} • {monthNames[a.month - 1]}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
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
    </section>
  );
}
