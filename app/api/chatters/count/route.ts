import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const status = request.nextUrl.searchParams.get("status") || "published";
    const rows = await sql`SELECT COUNT(*)::int AS count FROM chatters WHERE status = ${status}`;
    return NextResponse.json({ count: rows[0]?.count || 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

