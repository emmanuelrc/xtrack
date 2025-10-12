// lib/db/limits.ts
import { prisma } from "@/lib/db";
import { Placement } from "@prisma/client";

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
 * Normalize a placement value (string or enum) to a Prisma enum at runtime.
 * Handles cases where callers pass "Chest"/"EYE"/etc. instead of Placement.CHEST.
 */
function toPlacementEnum(p: unknown): Placement | undefined {
  // If it's already a valid enum value, return it
  const values = Object.values(Placement) as string[];
  if (values.includes(p as string)) return p as Placement;

  // Try case-insensitive match against enum values and keys
  const s = String(p || "").toUpperCase();
  // match by value (EYE, CHEST, etc.)
  const byValue = values.find(v => v.toUpperCase() === s);
  if (byValue) return byValue as Placement;

  // match by key name (if enum is { EYE: 'EYE', CHEST: 'CHEST' })
  const byKey = (Placement as any)[s];
  if (byKey && values.includes(byKey)) return byKey as Placement;

  return undefined;
}

/**
 * Read helper used by Department view chart.
 * Returns the department's MONTHLY dose limit in mSv.
 *
 * Strategy:
 *  - Prefer a whole-body/primary placement first (default CHEST).
 *  - Otherwise, fall back to the smallest limit defined for the department.
 */
export async function getDepartmentMonthlyLimit(
  departmentId: number,
  preferredPlacement: Placement = Placement.CHEST // ✅ use enum, not string
): Promise<number | null> {
  const preferred = toPlacementEnum(preferredPlacement) ?? Placement.CHEST;

  // Try preferred placement first
  const prefRow = await prisma.limit.findFirst({
    where: { department_id: departmentId, placement: preferred },
    select: { limit_dose_mSv: true },
  });
  if (prefRow?.limit_dose_mSv != null) {
    return Number(prefRow.limit_dose_mSv);
  }

  // Fallback: pick the smallest defined limit for the department (conservative)
  const fallback = await prisma.limit.findFirst({
    where: { department_id: departmentId },
    orderBy: { limit_dose_mSv: "asc" },
    select: { limit_dose_mSv: true },
  });
  return fallback?.limit_dose_mSv != null ? Number(fallback.limit_dose_mSv) : null;
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
  limitId,
}: SaveLimitParams): Promise<SaveLimitResult> {
  try {
    // Validation
    if (limitDoseMSv <= 0) {
      return { success: false, error: "Dose limit must be greater than 0" };
    }

    // Ensure placement is a valid enum at runtime (guards API routes)
    const normalizedPlacement = toPlacementEnum(placement) as Placement | undefined;
    if (!normalizedPlacement) {
      return { success: false, error: "Invalid placement value" };
    }

    // UPDATE PATH
    if (limitId) {
      const updatedLimit = await prisma.limit.update({
        where: { id: limitId },
        data: { limit_dose_mSv: limitDoseMSv },
      });

      return {
        success: true,
        limit: {
          id: updatedLimit.id,
          departmentId: updatedLimit.department_id,
          roleId: updatedLimit.role_id,
          placement: updatedLimit.placement,
          limitDoseMSv: Number(updatedLimit.limit_dose_mSv),
        },
      };
    }

    // CREATE PATH: Validate relations
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) return { success: false, error: "Department not found" };

    const role = await prisma.role.findFirst({
      where: { id: roleId, Department: { some: { id: departmentId } } },
    });
    if (!role) return { success: false, error: "Role not found or not assigned to this department" };

    const existingLimit = await prisma.limit.findFirst({
      where: { department_id: departmentId, role_id: roleId, placement: normalizedPlacement },
    });
    if (existingLimit) {
      return {
        success: false,
        error: "A limit already exists for this combination. Use limitId to update it.",
      };
    }

    const newLimit = await prisma.limit.create({
      data: {
        department_id: departmentId,
        role_id: roleId,
        placement: normalizedPlacement,
        limit_dose_mSv: limitDoseMSv,
      },
    });

    return {
      success: true,
      limit: {
        id: newLimit.id,
        departmentId: newLimit.department_id,
        roleId: newLimit.role_id,
        placement: newLimit.placement,
        limitDoseMSv: Number(newLimit.limit_dose_mSv),
      },
    };
  } catch (error) {
    console.error("Error saving limit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
