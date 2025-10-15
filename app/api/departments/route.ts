// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { getDepartments } from '@/lib/db/departments';

/**
 * GET /api/departments
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const canAll = await requirePermission(user, 'ALL');
    const canDept = await requirePermission(user, 'DEPARTMENT');
    if (!canAll && !canDept) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Parse query parameters from the URL
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? undefined;
    const sort = (searchParams.get('sort') as 'name' | 'createdAt' | 'updatedAt') ?? 'name';
    const order = (searchParams.get('order') as 'asc' | 'desc') ?? 'asc';

    // Call the data-access function
    const departments = await getDepartments({ q, sort, order });

    return NextResponse.json(departments, { status: 200 });
  } catch (err) {
    console.error('GET /api/departments error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
