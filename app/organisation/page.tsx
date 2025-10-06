import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getDepartments } from "@/lib/db/departments"
import { getRoles } from "@/lib/db/roles"

export default async function OrganisationPage() {
  const departments = await getDepartments()
  const roles = await getRoles()

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
      <section className="mb-8">
      <CardHeader>
        <CardTitle className="text-gray-700">Department Overview</CardTitle>
      </CardHeader>
      <Card className="bg-gray-200 shadow-md overflow-y-auto max-h-[200]">
        <CardContent>
          <ul className="space-y-2">
            {departments.map((d) => (
              <li
                key={d.id}
              >
                {d.name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      </section>

      {/* Roles Section */}
        <section className="mb-8 max-h-screen">
      <CardHeader>
        <CardTitle className="text-gray-700">Roles</CardTitle>
      </CardHeader>
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
      <Button className="
          bg-gray-200 text-black
          rounded-full
          px-4 py-1 
          min-w-full
          text-sm font-medium
      ">
            Add Role
      </Button>
    </main>
  )
}
