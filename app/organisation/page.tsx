// app/organisation/page.tsx

import Link from "next/link";
import { Pencil } from "lucide-react";
import AppShell from "@/components/app-shell/AppShell";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDepartments } from "@/lib/db/departments";
import { getRoles } from "@/lib/db/roles";
import {
  getCurrentUser,
  extractPermissions,
  getAllowedDepartmentIds,
} from "@/lib/auth";
import { AddRoleSection } from "./_components/AddRoleSection";

export default async function OrganisationPage() {
  const [departments, roles, user] = await Promise.all([
    getDepartments(),
    getRoles(),
    getCurrentUser(),
  ]);

  const permissionNames = extractPermissions(user);
  const permissionLevel = (["ALL", "DEPARTMENT", "WORKER"].find((p) =>
    permissionNames.includes(p)
  ) ?? "WORKER") as "ALL" | "DEPARTMENT" | "WORKER";
  const allowedDepartmentIds = getAllowedDepartmentIds(user);

  return (
    <AppShell active="organisation">
      <PageHeader
        title="Organisation Structure"
        description="Departments, roles and permissions."
        actions={
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        }
      />

      {/* Departments */}
      <section className="mb-6" aria-labelledby="dept-heading">
        <h2
          id="dept-heading"
          className="text-sm font-medium text-muted-foreground mb-2"
        >
          Department Overview
        </h2>
        <Card>
          <CardContent className="p-3">
            <ul className="divide-y">
              {departments.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2">
                  <span className="truncate">{d.name}</span>
                  <Link
                    href={`/department/${d.id}/edit`}
                    className="inline-flex items-center rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${d.name}`}
                    title={`Edit ${d.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Roles */}
      <section className="mb-6" aria-labelledby="roles-heading">
        <h2
          id="roles-heading"
          className="text-sm font-medium text-muted-foreground mb-2"
        >
          Roles
        </h2>
        <Card>
          <CardContent className="p-3">
            <ul className="space-y-2">
              {roles.map((r) => (
                <li key={r.id} className="text-sm">
                  {r.name}
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
          </CardContent>
        </Card>
      </section>

      {/* Add Role / Permissions */}
      <AddRoleSection
        permissionLevel={permissionLevel}
        allowedDepartmentIds={allowedDepartmentIds ?? null}
      />
    </AppShell>
  );
}
