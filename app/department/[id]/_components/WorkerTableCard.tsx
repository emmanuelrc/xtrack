// app/department/[id]/_components/WorkerTableCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

type WorkerRow = {
  workerId: number;
  fullName: string;
  role: string | null;
  lastReadingDate: Date | string | null;
  lastReading_mSv: number | null;
};

function fmtShortDate(d: Date | string | null) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleString("en-US", { month: "short", day: "2-digit" });
}

export default function WorkerTableCard({ workers }: { workers: WorkerRow[] }) {
  return (
    <Card className="bg-[#e5e7eb] shadow-md overflow-hidden p-0">
      <CardContent className="p-0">
        {/* group wrapper lets us reveal scrollbars on hover */}
        <div className="group/scroll relative">
          <div className="hover-scroll overflow-auto max-h-44">
            <table className="min-w-[500px] w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[35%]" />
                <col className="w-[20%]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-[#d1d5db] text-[#374151] border-b border-gray-300">
                <tr className="h-9 align-middle">
                  <th className="text-left px-3 py-0 text-xs font-medium tracking-wide">Name</th>
                  <th className="text-left px-3 py-0 text-xs font-medium tracking-wide">Role</th>
                  <th className="text-right px-3 py-0 text-xs font-medium tracking-wide">Last Reading</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {workers.map((w) => (
                  <tr
                    key={w.workerId}
                    className="h-11 align-middle hover:bg-black/5 transition-colors"
                  >
                    <td className="px-3 py-0 whitespace-nowrap">
                      <span className="font-medium text-[#111827]">{w.fullName}</span>
                    </td>
                    <td className="px-3 py-0 truncate text-[#374151]">
                      {w.role ?? "—"}
                    </td>
                    <td className="px-3 py-0 text-right whitespace-nowrap">
                      {w.lastReading_mSv != null ? (
                        <div className="leading-tight">
                          <span className="font-semibold text-[#111827]">
                            {w.lastReading_mSv.toFixed(2)}{" "}
                          </span>
                          <span className="text-[11px] text-[#4b5563]">mSv</span>
                          <div className="text-[10px] text-[#6b7280]">
                            {fmtShortDate(w.lastReadingDate)}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}

                {workers.length === 0 && (
                  <tr className="h-10 align-middle">
                    <td className="px-3 py-2 text-center text-gray-600" colSpan={3}>
                      No workers found for this department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
