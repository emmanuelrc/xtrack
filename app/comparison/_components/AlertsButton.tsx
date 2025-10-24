// app/comparison/_components/AlertsButton.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AlertsButton({ year }: { year: number }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/alerts?year=${year}`)
      .then((r) => r.json())
      .then((b) => {
        if (b?.success && Array.isArray(b.data)) setCount(b.data.length);
        else setCount(0);
      })
      .catch(() => setCount(0));
  }, [year]);

  return (
    <Link
      href={`/alerts?year=${year}`}
      className="relative grid place-items-center size-9 rounded-full border border-gray-300 text-gray-700 bg-white/95 hover:bg-white shadow-sm"
      aria-label="Exceedance alerts"
      title="Exceedance alerts"
    >
      {/* bell */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"/>
      </svg>
      {/* count */}
      {count != null && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
