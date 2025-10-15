// app/api/workers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requirePermission } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const ok = await requirePermission(user, 'WORKER');
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const departmentId = searchParams.get('departmentId');

    if (!departmentId) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    // TODO extract into lib/db/workers.ts
    const workers = await prisma.worker.findMany({
      where: {
        Department: {
          some: {
            id: parseInt(departmentId),
          },
        },
        ...(q ? {
          OR: [
            { first_name: { contains: q, mode: 'insensitive' } },
            { last_name: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
      take: 10,
      orderBy: [
        { first_name: 'asc' },
        { last_name: 'asc' },
      ],
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workers' },
      { status: 500 }
    );
  }
}