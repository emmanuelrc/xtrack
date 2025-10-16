// components/app-shell/AppShell.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/ui/BrandLogo";

type Props = {
  active?: "dashboard" | "alerts" | "comparison" | "organisation";
  children: React.ReactNode;
};

export default function AppShell({ active, children }: Props) {
  const sp = useSearchParams();
  const isMobilePreview = sp?.get("preview") === "mobile";

  return (
    <div
      className={cn(
        "min-h-dvh flex flex-col",
        isMobilePreview &&
          "mx-auto w-[390px] sm:w-[420px] border border-border rounded-2xl overflow-hidden shadow-lg"
      )}
    >
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" aria-label="Go to Dashboard" className="flex items-center">
            {/* use wordmark by default; switch to 'mark' if you prefer the symbol-only */}
            <BrandLogo variant="mark" />
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link className={active==="dashboard" ? "text-foreground" : "text-muted-foreground"} href="/dashboard">Dashboard</Link>
            <Link className={active==="alerts" ? "text-foreground" : "text-muted-foreground"} href="/alerts">Alerts</Link>
            <Link className={active==="comparison" ? "text-foreground" : "text-muted-foreground"} href="/comparison">Comparison</Link>
            <Link className={active==="organisation" ? "text-foreground" : "text-muted-foreground"} href="/organisation">Org</Link>
          </nav>
        </div>
        <Separator />
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
