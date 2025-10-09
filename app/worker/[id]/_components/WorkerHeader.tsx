//app/worker/[id]/_components/WorkerHeader.tsx
import { Bell } from "lucide-react";

export default function WorkerHeader({
  name,
  role,
  department,
}: {
  name: string;
  role?: string | null;
  department?: string | null;
}) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-green-700">{name}</h1>
        {(role || department) && (
          <p className="text-sm text-gray-500">
            {[role, department].filter(Boolean).join(" — ")}
          </p>
        )}
      </div>
      <button aria-label="Notifications" className="p-2 rounded-full hover:bg-gray-100">
        <Bell className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  );
}
