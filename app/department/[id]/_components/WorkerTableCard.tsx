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
    <Card className="bg-gray-200 shadow-md">
      <CardContent className="p-0">
        <div className="overflow-auto max-h-40">
          <table className="min-w-[460px] text-sm">
            <thead className="sticky top-0 bg-gray-300 text-gray-700">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Role</th>
                <th className="text-right px-4 py-2 font-medium">Last Reading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {workers.map((w) => (
                <tr key={w.workerId}>
                  <td className="px-4 py-2 whitespace-nowrap">{w.fullName}</td>
                  <td className="px-4 py-2">{w.role ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    {w.lastReading_mSv != null ? `${w.lastReading_mSv.toFixed(2)} mSv` : "—"}
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-600" colSpan={3}>
                    No workers found for this department.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
