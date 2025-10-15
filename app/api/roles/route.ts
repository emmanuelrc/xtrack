import { NextResponse } from 'next/server';
import { createRole } from '@/lib/db/roles';
import { requireAuth, requirePermission, getAllowedDepartmentIds } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const isAll = await requirePermission(user, 'ALL');
    const isDept = await requirePermission(user, 'DEPARTMENT');
    if (!isAll && !isDept) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { roleName, workerIds, departmentId } = await request.json();

    if (!roleName || !departmentId) {
      return NextResponse.json(
        { error: 'Invalid role data' },
        { status: 400 }
      );
    }
    if (isDept && departmentId) {
      const allowed = getAllowedDepartmentIds(user) ?? [];
      if (!allowed.includes(departmentId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const result = await createRole({roleName, workerIds, departmentId});

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    return NextResponse.json(result.role, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}