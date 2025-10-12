// app/worker/[id]/_components/YearPills.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = { years: number[]; selectedYear: number };

export default function YearPills({ years, selectedYear }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const distinct = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b),
    [years]
  );

  const idx = Math.max(0, distinct.indexOf(selectedYear));
  const hasPrev = idx > 0;
  const hasNext = idx < distinct.length - 1;

  function setYear(y: number) {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("year", String(y));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const trackRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [thumbStyle, setThumbStyle] = useState({ left: 0, width: 0, height: 0 });
  const [needsScroll, setNeedsScroll] = useState(false);

  const measure = () => {
    const btn = btnRefs.current[selectedYear];
    const track = trackRef.current;
    if (!btn || !track) return;
    const b = btn.getBoundingClientRect();
    const t = track.getBoundingClientRect();
    setThumbStyle({
      left: b.left - t.left + track.scrollLeft,
      width: b.width,
      height: b.height,
    });
    setNeedsScroll(track.scrollWidth > track.clientWidth + 1);
  };

  useLayoutEffect(measure, [selectedYear, distinct.length]);
  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Ensure the active year is visible and centered-ish when it changes
  useEffect(() => {
    const el = btnRefs.current[selectedYear];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedYear]);

  const moveSelection = (dir: -1 | 1) => {
    const i = distinct.indexOf(selectedYear);
    if (i < 0) return;
    const j = Math.min(Math.max(i + dir, 0), distinct.length - 1);
    const y = distinct[j];
    if (y !== selectedYear) setYear(y);
  };

  // Keep paging scroll with arrows, but ALSO toggle year
  const pageScroll = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.6) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onLeft = () => {
    moveSelection(-1);
    pageScroll(-1);
  };
  const onRight = () => {
    moveSelection(1);
    pageScroll(1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onLeft();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onRight();
    }
  };

  return (
    <div className="relative w-screen -mx-4 px-4" aria-label="Select year">
      {/* Left arrow (changes year + pages scroll) */}
      <button
        type="button"
        onClick={onLeft}
        disabled={!hasPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 grid place-items-center size-9 rounded-full border border-gray-300 text-gray-700 bg-white/95 hover:bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous year"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M12.7 15.3a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4l4-4a1 1 0 1 1 1.4 1.4L9.41 10l3.3 3.3a1 1 0 0 1 0 1.4z"/>
        </svg>
      </button>

      {/* Track */}
      <div
        className="relative mx-9 rounded-full bg-gray-300"
        role="radiogroup"
        aria-label="Year"
        onKeyDown={onKeyDown}
      >
        <div
          ref={trackRef}
          className={[
            "relative flex overflow-x-auto scroll-smooth rounded-full px-1 py-1 gap-1",
            needsScroll ? "justify-start" : "justify-center",
          ].join(" ")}
          style={{ scrollbarWidth: "none" }}
          onScroll={measure}
        >
          {/* Active green thumb */}
          <div
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-[rgb(22_163_74)] shadow-md transition-all duration-200"
            style={{ left: thumbStyle.left, width: thumbStyle.width, height: thumbStyle.height }}
            aria-hidden="true"
          />

          {distinct.map((y) => {
            const active = y === selectedYear;
            return (
              <button
                key={y}
                ref={(el) => (btnRefs.current[y] = el)}
                type="button"
                onClick={() => setYear(y)}
                role="radio"
                aria-checked={active}
                className={[
                  "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none",
                  "hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-emerald-500",
                  active ? "text-white" : "text-gray-800",
                ].join(" ")}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right arrow (changes year + pages scroll) */}
      <button
        type="button"
        onClick={onRight}
        disabled={!hasNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 grid place-items-center size-9 rounded-full border border-gray-300 text-gray-700 bg-white/95 hover:bg-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next year"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M7.3 4.7a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 1 1-1.4-1.4L10.59 10 7.3 6.7a1 1 0 0 1 0-1.4z"/>
        </svg>
      </button>
    </div>
  );
}
