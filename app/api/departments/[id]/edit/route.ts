// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentWithRoleLimits } from '@/lib/db/departments';

/**
 * GET /api/departments/:id/edit
 */
export async function GET(  req: NextRequest,
  { params }: { params: { id: string } }) {
    
  try {

    let { id } = await params; 

    const department = await getDepartmentWithRoleLimits(Number(id));

    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 500 }
    );
    }

    return NextResponse.json(department, { status: 200 });
  } catch (err) {
    console.error('GET /api/department/:id error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
