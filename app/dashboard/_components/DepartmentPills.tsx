// app/dashboard/_components/DepartmentPills.tsx
"use client";

type Dept = { id: number; name: string };
type Props = { departments: Dept[]; selectedId: number | null; onSelect: (id: number) => void };

function abbrev(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

export default function DepartmentPills({ departments, selectedId, onSelect }: Props) {
  if (!departments.length) return <div className="text-xs text-gray-500 px-1 py-2">No departments found.</div>;
  const activeId = selectedId ?? departments[0].id;

  return (
    <div className="w-full overflow-hidden" aria-label="Select department">
      <div className="relative rounded-full bg-gray-300" role="radiogroup" aria-label="Department">
        {/* slimmer height to reduce overall gap */}
        <div className="flex overflow-x-auto px-1 py-0.5 gap-1 justify-center" style={{ scrollbarWidth: "none" }}>
          {departments.map((d) => {
            const active = d.id === activeId;
            return (
              <button
                key={d.id}
                type="button"
                title={d.name}
                onClick={() => onSelect(d.id)}
                role="radio"
                aria-checked={active}
                className={[
                  "rounded-full px-3 py-0.5 text-[11px] font-medium transition-colors outline-none",
                  "hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-[rgb(22_163_74)]",
                  active ? "bg-[rgb(22_163_74)] text-white shadow-sm" : "text-gray-800",
                ].join(" ")}
              >
                {abbrev(d.name)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
