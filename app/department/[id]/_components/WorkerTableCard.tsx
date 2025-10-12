// app/department/[id]/_components/WorkerTableCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";

type WorkerRow = {
  workerId: number;
  fullName: string;
  role: string | null;
  lastReadingDate: Date | null;
  lastReading_mSv: number | null;
};

export default function WorkerTableCard({ workers }: { workers: WorkerRow[] }) {
  return (
    <Card className="bg-gray-200 shadow-md overflow-hidden p-0">
      <CardContent className="p-0">
        {/* group wrapper lets us reveal scrollbars on hover */}
        <div className="group/scroll relative">
          <div className="hover-scroll overflow-auto max-h-40">
            <table className="min-w-[460px] w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[19%]" />
                <col className="w-[15%]" />
              </colgroup>

              <thead className="sticky top-0 z-10 bg-gray-200 text-gray-700 border-b border-gray-300">
                <tr className="h-10 align-middle">
                  <th className="text-left px-2 py-0 text-sm font-normal">Name</th>
                  <th className="text-left px-2 py-0 text-sm font-normal">Role</th>
                  <th className="text-right px-2 py-0 text-sm font-normal">Last Reading</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {workers.map((w) => (
                  <tr key={w.workerId} className="h-10 align-middle">
                    <td className="px-3 py-0 whitespace-nowrap">{w.fullName}</td>
                    <td className="px-3 py-0 truncate">{w.role ?? "—"}</td>
                    <td className="px-3 py-0 text-right whitespace-nowrap">
                      {w.lastReading_mSv != null ? `${w.lastReading_mSv.toFixed(2)} mSv` : "—"}
                    </td>
                  </tr>
                ))}

                {workers.length === 0 && (
                  <tr className="h-10 align-middle">
                    <td className="px-3 py-0 text-center text-gray-600" colSpan={3}>
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
