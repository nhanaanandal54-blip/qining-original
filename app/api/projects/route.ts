import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET() {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const rows = await sql`SELECT * FROM projects ORDER BY sort ASC, created_at DESC`;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

