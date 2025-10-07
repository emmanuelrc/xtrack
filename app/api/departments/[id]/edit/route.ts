// app/api/departments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDepartmentWithDetails } from '@/lib/db/departments';

/**
 * GET /api/departments
 */
export async function GET(  req: NextRequest,
  { params }: { params: { id: string } }) {
    
  try {

    const { id } = params; 

    const department = await getDepartmentWithDetails(Number(id));

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
