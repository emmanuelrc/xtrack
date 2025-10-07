import { Bell } from "lucide-react";

export default function ScreenHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-green-700">{title}</h1>
      <button aria-label="Notifications" className="p-2 rounded-full hover:bg-gray-100">
        <Bell className="w-5 h-5 text-gray-600" />
      </button>
    </header>
  );
}
