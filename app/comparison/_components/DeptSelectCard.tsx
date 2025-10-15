// app/comparison/_components/DeptSelectCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Dept = { id: number; name: string };

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
    <Card className="bg-gray-100 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Departments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-auto">
          <ul className="divide-y">
            {departments.map((d) => {
              const active = d.name === value;
              const hasData = withData.has(d.name);
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onChange(d.name)}
                    className={[
                      "w-full text-left px-4 py-3 transition-colors",
                      active ? "text-emerald-700 font-semibold" : "text-gray-700",
                      !hasData ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    {d.name}
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
