//app/worker/[id]/_components/DosimeterToggleCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Placement } from "@prisma/client";

const LABELS: Record<Placement, string> = {
  CHEST: "Chest",
  EYE: "Eye",
  EXTREMITIES: "Extremities",
  FOETAL: "Fetal",
};

export default function DosimeterToggleCard({
  placements,
  selected,
  onSelect,
}: {
  placements: Placement[];
  selected: Placement;
  onSelect: (p: Placement) => void;
}) {
  if (placements.length <= 1) return null; // only show if multiple

  return (
    <Card className="bg-gray-100 shadow-none border">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {placements.map((p) => {
            const active = p === selected;
            return (
              <button
                key={p}
                onClick={() => onSelect(p)}
                className={[
                  "px-3 py-1.5 rounded-full text-sm border transition",
                  active
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-800 border-gray-300",
                ].join(" ")}
                aria-pressed={active}
              >
                {LABELS[p]}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
