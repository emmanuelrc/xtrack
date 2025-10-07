// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDepartments } from '@/lib/db/departments';

/**
 * GET /api/departments
 */
export async function GET(req: NextRequest) {
  try {
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