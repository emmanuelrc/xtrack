import { prisma } from '@/lib/db';
import { Placement } from '@prisma/client';


interface SaveLimitParams {
  departmentId: number;
  roleId: number;
  placement: Placement;
  limitDoseMSv: number;
  limitId?: number; // If provided, updates existing; otherwise creates new
}

interface SaveLimitResult {
  success: boolean;
  limit?: {
    id: number;
    departmentId: number;
    roleId: number;
    placement: Placement;
    limitDoseMSv: number;
  };
  error?: string;
}

/**
 * Creates or updates a dose limit for a role/placement/department
 * If limitId is provided, updates that limit. Otherwise, creates a new one.
 */
export async function saveLimit({
  departmentId,
  roleId,
  placement,
  limitDoseMSv,
  limitId
}: SaveLimitParams): Promise<SaveLimitResult> {
  try {
    // Validation
    if (limitDoseMSv <= 0) {
      return {
        success: false,
        error: 'Dose limit must be greater than 0'
      };
    }

    // UPDATE PATH: If limitId provided, just update the dose
    if (limitId) {

      console.log('DATA FROM CLIENT', limitDoseMSv)
      const updatedLimit = await prisma.limit.update({
        where: { id: limitId },
        data: { limit_dose_mSv: limitDoseMSv }
      });

      console.log('UPDATED LIMIT', updatedLimit.limit_dose_mSv)

      return {
        success: true,
        limit: {
          id: updatedLimit.id,
          departmentId: updatedLimit.department_id,
          roleId: updatedLimit.role_id,
          placement: updatedLimit.placement,
          limitDoseMSv: Number(updatedLimit.limit_dose_mSv)
        }
      };
    }

    // CREATE PATH: Validate and create
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      return {
        success: false,
        error: 'Department not found'
      };
    }

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        Department: { some: { id: departmentId } }
      }
    });

    if (!role) {
      return {
        success: false,
        error: 'Role not found or not assigned to this department'
      };
    }

    const existingLimit = await prisma.limit.findFirst({
      where: {
        department_id: departmentId,
        role_id: roleId,
        placement: placement
      }
    });

    if (existingLimit) {
      return {
        success: false,
        error: 'A limit already exists for this combination. Use limitId to update it.'
      };
    }

    const newLimit = await prisma.limit.create({
      data: {
        department_id: departmentId,
        role_id: roleId,
        placement: placement,
        limit_dose_mSv: limitDoseMSv
      }
    });

    return {
      success: true,
      limit: {
        id: newLimit.id,
        departmentId: newLimit.department_id,
        roleId: newLimit.role_id,
        placement: newLimit.placement,
        limitDoseMSv: Number(newLimit.limit_dose_mSv)
      }
    };

  } catch (error) {
    console.error('Error saving limit:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}