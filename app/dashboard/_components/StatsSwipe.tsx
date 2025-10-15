// app/dashboard/_components/StatsSwipe.tsx
"use client";

import * as React from "react";


export default function StatsSwipe({
  children,
  className = "",
}: {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const startX = React.useRef<number | null>(null);
  const deltaX = React.useRef(0);
  const THRESHOLD = 40; // how far to consider it a swipe

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };

  const onTouchEnd = () => {
    if (deltaX.current < -THRESHOLD && index === 0) setIndex(1); // left
    if (deltaX.current > THRESHOLD && index === 1) setIndex(0); // right
    startX.current = null;
    deltaX.current = 0;
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* translate between the two cards */}
      <div
        className="flex w-[200%] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${index === 0 ? "0%" : "-50%"})` }}
      >
        <div className="w-1/2 pr-2">{children[0]}</div>
        <div className="w-1/2 pl-2">{children[1]}</div>
      </div>

      {/* pager dots */}
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-2">
        {[0, 1].map((i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 w-1.5 rounded-full transition ${
              index === i ? "bg-foreground/70" : "bg-foreground/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
