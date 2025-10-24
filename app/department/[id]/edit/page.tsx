// app/department/[id]/edit/page.tsx

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import DepartmentManagement from "./_components/DepartmentManagement";

export default function DepartmentEditPage() {
  const { id } = useParams();
  const deptId = Number(id);

  return (
    <AppShell>
      <PageHeader
        title="Edit Department"
        description={`Department • ${Number.isFinite(deptId) ? deptId : "—"}`}
        actions={
          <Link href={`/department/${deptId || ""}`}>
            <Button variant="outline" size="sm">Back to department</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {/* Main editor */}
        <DepartmentManagement departmentId={deptId} />
      </div>
    </AppShell>
  );
}
