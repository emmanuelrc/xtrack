import { prisma } from '@/lib/db';
import { Dosimeter, Worker, Limit, Role, Placement } from '@prisma/client';


export async function getDepartments(  options?: {
    q?: string;                         // optional search by name
    sort?: 'name' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }
) {
  const { q, sort = 'name', order = 'asc' } = options ?? {};

  return prisma.department.findMany({
    where: {
      ...(q
        ? { name: { contains: q, mode: 'insensitive' } }
        : {}),
    },
    orderBy: { [sort]: order },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getDepartmentWithDetails(id: number) {
  try {
  // Fetch the department with all related data we need
  const department = await prisma.department.findUnique({
    where: { id: id },
    include: {
      // Get all roles associated with this department
      Role: {
        include: {
          Limit: {
            where: {
              department_id: id
            }
          },
      // Get workers who have this role AND work in this department
          Worker: {
            where: {
              Department: {
                some: { id: id }
              }
            },
            include: {
              // Get the dosimeters each worker is wearing
              Dosimeter: {
                where: {
                  department_id: id,
                  // Exclude control dosimeters (not worn by workers)
                  is_control: false,
                  // Only include dosimeters with a placement type
                  placement: { not: null }
                },
                select: {
                  placement: true // We only need the placement type
                }
              }
            }
          }
        }
      }
    }
  });

  if (!department) {
    return null;
  }

  // Transform the nested Prisma result into a clean shape for the frontend
  const transformedData = {
    id: department.id,
    name: department.name,
    roles: department.Role.map(role => {
      // Extract all dosimeter placements from all workers in this role
      const allPlacements: Placement[] = role.Worker.flatMap(worker =>
        worker.Dosimeter.map(dosimeter => dosimeter.placement!)
      );

      // Dedupe placements: if 3 people have CHEST dosimeters, we only want it once
      const uniquePlacements = [...new Set(allPlacements)];

      // Sort placements so they're displayed consistently
      const sortedPlacements = uniquePlacements.sort();

      return {
        id: role.id,
        name: role.name,
        // Limit[0] because there should only be one limit per role per department
        limitDoseMSv: role.Limit[0]?.limit_dose_mSv?.toNumber() ?? 0,
        // The unique dosimeter types being worn by workers in this role
        activeDosimeterTypes: sortedPlacements,
        // Count of workers who have this role in this department
        workerCount: role.Worker.length
      };
    })
  };

  return transformedData;

  } catch (e: unknown) {
    if (e instanceof Error) console.log(e.message)
  }
}
