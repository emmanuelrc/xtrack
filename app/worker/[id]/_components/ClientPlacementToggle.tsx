//app/worker/[id]/_components/ClientPlacementToggle.tsx
"use client";
import type { Placement } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DosimeterToggleCard from "./DosimeterToggleCard";

export default function ClientPlacementToggle({
  placements,
  selected,
}: {
  placements: Placement[];
  selected?: Placement;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  if (!placements?.length) return null;

  function setPlacement(p: Placement) {
    const params = new URLSearchParams(sp?.toString() || "");
    params.set("placement", p);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <DosimeterToggleCard
      placements={placements}
      selected={selected ?? placements[0]}
      onSelect={setPlacement}
    />
  );
}
