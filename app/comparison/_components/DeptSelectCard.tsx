// app/comparison/_components/DeptSelectCard.tsx
// Nicer list: compact, with initials chip, subtle chevron, active ring in #16a34a.

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

type Dept = { id: number; name: string };

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function DeptSelectCard({
  departments,
  withData,
  value,
  onChange,
}: {
  departments: Dept[];
  withData: Set<string>;
  value: string;
  onChange: (name: string) => void;
}) {
  if (!departments.length) return null;

  return (
    <Card className="bg-[#ededed] shadow-md overflow-hidden">
      <CardHeader className="pb-0">
        <CardTitle className="text-base text-[#4b5563]">Departments</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {departments.map((d) => {
              const active = d.name === value;
              const hasData = withData.has(d.name);

              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onChange(d.name)}
                    className={[
                      "w-full px-3 py-2 flex items-center justify-between gap-3 transition-colors",
                      "hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a]",
                      active ? "bg-white" : "",
                      !hasData ? "opacity-70" : "",
                    ].join(" ")}
                    aria-pressed={active}
                    title={!hasData ? "No data in this period" : d.name}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span
                        className={[
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          active
                            ? "border-[#16a34a] text-[#16a34a] bg-[#16a34a]/10"
                            : "border-gray-300 text-gray-600 bg-white",
                        ].join(" ")}
                      >
                        {initials(d.name)}
                      </span>
                      <span className="truncate text-sm">
                        <span className={active ? "font-semibold text-gray-900" : "text-gray-800"}>
                          {d.name}
                        </span>
                        {!hasData && (
                          <span className="ml-2 rounded-full bg-gray-200 px-2 py-[2px] text-[10px] text-gray-600">
                            no data
                          </span>
                        )}
                      </span>
                    </span>

                    <ChevronRight
                      className={[
                        "h-4 w-4 shrink-0",
                        active ? "text-[#16a34a]" : "text-gray-400",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
