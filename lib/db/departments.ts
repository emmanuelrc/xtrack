import { prisma } from '@/lib/db';
import { Dosimeter, Worker, Limit, Role, Placement } from '@prisma/client';

export interface PlacementLimit {
  placement: Placement;
  limit?: number;
  limitId?: number;
  hasLimit: boolean;
}

export interface RoleWithLimits {
  id: number;
  name: string;
  placementLimits: PlacementLimit[];
}


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

/**
 * Fetches department data with roles and their dosimeter placement limits
 */
export async function getDepartmentWithRoleLimits(departmentId: number) {
  // Query 1: Get department with roles and their limits
  const [department, workersWithData] = await Promise.all([
    prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        Role: {
          include: {
            Limit: {
              where: { department_id: departmentId }
            }
          }
        }
      }
    }),
    // Query 2: Get all workers in this department with their roles and dosimeters
    prisma.worker.findMany({
      where: {
        Department: {
          some: { id: departmentId }
        }
      },
      include: {
        Role: {
          select: { id: true }
        },
        Dosimeter: {
          where: {
            department_id: departmentId,
            is_control: false,
            placement: { not: null }
          },
          select: {
            placement: true
          }
        }
      }
    })
  ]);

  if (!department) {
    throw new Error('Department not found');
  }

  // Build a mapping of role_id -> Set of placements used by workers
  //(Set is used to dedupe as we go)
  // this is because we need to keep track of dosimeters with no limit set, 
  // vs placements that don't exist in this role
  const rolePlacements: Record<number, Set<Placement>> = {}

  workersWithData.forEach(worker => {
    worker.Role.forEach(role => {
      if (!rolePlacements[role.id]) {
        rolePlacements[role.id] = new Set();
      }
      
      worker.Dosimeter.forEach(dosimeter => {
        if (dosimeter.placement) {
          rolePlacements[role.id]!.add(dosimeter.placement);
        }
      });
    });
  });
 

  const rolesWithLimits: RoleWithLimits[] = department.Role.map(role => {
    const placements = rolePlacements[role.id] || new Set();
    
    const placementLimits: PlacementLimit[] = [...placements]
      .sort()
      .map(placement => {
        const limit = role.Limit.find(
          l => l.placement === placement && l.department_id === departmentId
        );
        
        return {
          placement,
          limit: limit ? Number(limit.limit_dose_mSv) : undefined,
          limitId: limit?.id,
          hasLimit: !!limit 
        };
      });

    return {
      id: role.id,
      name: role.name,
      placementLimits
    };
  });

  return {
    id: department.id,
    name: department.name,
    roles: rolesWithLimits
  };
}
