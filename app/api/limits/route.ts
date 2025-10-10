// app/api/limits/route.ts
import { NextResponse } from 'next/server';
import { saveLimit } from '@/lib/db/limits';
import { Placement } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departmentId, roleId, placement, limitDoseMSv, limitId } = body;

    // Additional validation
    if (!Object.values(Placement).includes(placement)) {
      return NextResponse.json(
        { error: 'Invalid placement value' },
        { status: 400 }
      );
    }

    const result = await saveLimit({
      departmentId: parseInt(departmentId),
      roleId: parseInt(roleId),
      placement: placement as Placement,
      limitDoseMSv: parseFloat(limitDoseMSv),
      limitId: limitId && parseInt(limitId)
    });

    if (result.success) {
      // TODO fix logic to send 200 OK if it was an update
      return NextResponse.json(result.limit, { status: 201 });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}