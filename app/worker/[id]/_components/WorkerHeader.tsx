import Link from "next/link";
import { Bell } from "lucide-react";

export default function WorkerHeader({
  name,
  role,
  department,
  alertsHref, // link to the alerts page
}: {
  name: string;
  role?: string | null;
  department?: string | null;
  alertsHref: string;
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

      <Link
        href={alertsHref}
        aria-label="Over-limit alerts"
        className="p-2 rounded-full hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
      >
        <Bell className="w-5 h-5 text-gray-600" />
      </Link>
    </header>
  );
}
