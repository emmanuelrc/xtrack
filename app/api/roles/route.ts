import { NextResponse } from 'next/server';
import { createRole } from '@/lib/db/roles';
import { requireAuth, requirePermission } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ok = await requirePermission(user, 'ALL');
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { roleName, workerIds, departmentId } = await request.json();

    if (!roleName || !departmentId) {
      return NextResponse.json(
        { error: 'Invalid role data' },
        { status: 400 }
      );
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