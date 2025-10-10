import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';

export async function getRoles(  options?: {
    q?: string;                         // optional search by name
    sort?: 'name' | 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  }
) {
  const { q, sort = 'name', order = 'asc' } = options ?? {};

  return prisma.role.findMany({
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

interface CreateRoleParams {
   roleName: string;
   workerIds: number[]
   departmentId: number
}

interface CreateRoleResult {
  success: boolean;
  role?: Omit<Role, 'createdAt' | 'updatedAt'> & {
    departmentId: number,
    workerIds: number[]
  }, 
  error?: string
}

/**
 * Creates a new role with a default WORKER permission
 */

export async function createRole(roleRequest: CreateRoleParams): Promise<CreateRoleResult> {
  try {
    // Get WORKER permission
    const workerPermission = await prisma.permission.findUnique({
      where: { name: 'WORKER' }
    });

    if (!workerPermission) {
      throw new Error('WORKER permission not found');
    }

    const newRole = await prisma.role.create({
      data: {
        name: roleRequest.roleName,
        Department: { connect: { id: roleRequest.departmentId } },
        Permission: { connect: { id: workerPermission.id } },
        Worker: roleRequest.workerIds?.length > 0 ? {
          connect: roleRequest.workerIds.map((id: number) => ({ id }))
        } : undefined,
      },
      include: {
        Department: {
          where: {
            id: roleRequest.departmentId 
          },
          select: {
            id: true
          }
        },
        Worker: {
          select: {
            id: true
          }
        },
      }
    });

    const responseDeptId = newRole.Department
          .flatMap((dept) => dept.id)
          .find(id => id === roleRequest.departmentId);
    if (!responseDeptId) throw new Error('error connecting new role to the department');

    return {
      success: true,
      role: {
        id: newRole.id,
        name: newRole.name,
        departmentId: responseDeptId,
        workerIds: newRole.Worker.flatMap((worker) => worker.id)

      }
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}