// app/api/dosimeters/total/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const origin = url.origin;
    const qs = url.searchParams.toString();
    const countsUrl = `${origin}/api/departments/worker-counts${qs ? `?${qs}` : ""}`;

    const auth = req.headers.get("authorization") || undefined;
    const cookie = req.headers.get("cookie") || undefined;

    const res = await fetch(countsUrl, {
      cache: "no-store",
      headers: {
        ...(auth ? { authorization: auth } : {}),
        ...(cookie ? { cookie } : {}),
        accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        data: { total: 0, source: "fallback", note: `upstream ${res.status}` },
      });
    }

    const body = await res.json();

    const rows =
      (Array.isArray(body?.data) && body.data) ||
      (Array.isArray(body?.data?.rows) && body.data.rows) ||
      (Array.isArray(body?.rows) && body.rows) ||
      [];

    const total = rows.reduce((sum: number, r: any) => {
      const n = Number(r?.count ?? r?.workers ?? r?.dosimeters ?? r?.total);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    return NextResponse.json({ success: true, data: { total, source: "worker-counts" } });
  } catch {
    return NextResponse.json({ success: true, data: { total: 0, source: "fallback" } });
  }
}
