import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "published";
    const page = Math.max(1, Number(params.get("page") || 1));
    const size = Math.min(100, Math.max(1, Number(params.get("size") || 50)));
    const rows = await sql`
      SELECT * FROM chatters WHERE status = ${status}
      ORDER BY created_at DESC LIMIT ${size} OFFSET ${(page - 1) * size}
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

