import Link from "next/link";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Pencil } from "lucide-react"
import { getDepartments } from "@/lib/db/departments"
import { getRoles } from "@/lib/db/roles"
import { AddRoleSection } from "./_components/AddRoleSection";

export default async function OrganisationPage() {
  const [departments, roles] = await Promise.all([getDepartments(), getRoles()])

  return (
    <main className="max-w-sm mx-auto p-4 h-screen overflow-y-auto">
      <nav className="flex justify-between">
      <h1 className="text-xl text-green-700 mb-[1rem]">
          Organisation Structure
      </h1>
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>      
      </nav>

      {/* Departments */}
      <section className="mb-8" aria-labelledby="dept-heading">
      <h2
        id="dept-heading"
        className="text-gray-700 text-lg font-semibold mb-2">
        Department Overview
      </h2>
      <Card className="bg-gray-200 shadow-md overflow-y-auto max-h-[200]">
        <CardContent>
          <ul className="space-y-2">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex justify-between"
              >
                <span> {d.name } </span>
                <Link href={`/department/${d.id}/edit`}>
                  <Pencil className="w-4 h-4 text-gray-700" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      </section>

      {/* Roles Section */}
      <section className="mb-8 max-h-screen" aria-labelledby="roles-heading">
      <h2
        id="roles-heading"
        className="text-gray-700 text-lg font-semibold mb-2">
        Roles
      </h2>
      <Card className="bg-gray-200 shadow-md overflow-y-auto max-h-[200]">
        <CardContent>
          <ul className="space-y-2">
            {roles.map((r) => (
              <li
                key={r.id}
              >
                {r.name}
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
        </CardContent>
      </Card>
      </section>
      <AddRoleSection />  

    </main>
  )
}
