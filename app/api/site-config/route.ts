import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET() {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const rows = await sql`SELECT key, value FROM site_config ORDER BY key`;
    return NextResponse.json(
      Object.fromEntries(rows.map((row) => [String(row.key), String(row.value)]))
    );
  } catch {
    return NextResponse.json({});
  }
}

