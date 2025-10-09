//app/worker/[id]/_components/YearPills.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function YearPills({
  years,
  selectedYear,
}: {
  years: number[];
  selectedYear: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setYear(y: number) {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("year", String(y));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const distinct = [...new Set(years)].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-2">
      {distinct.map((y) => {
        const active = y === selectedYear;
        return (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={[
              "px-4 py-1 rounded-full text-sm border",
              active
                ? "bg-green-600 text-white border-green-600"
                : "bg-gray-100 text-gray-800 border-gray-300",
            ].join(" ")}
            aria-pressed={active}
          >
            {y}
          </button>
        );
      })}
    </div>
  );
}
