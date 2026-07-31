import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const { id } = await context.params;
    const rows = await sql`
      SELECT * FROM photos WHERE album_id = ${Number(id)}
      ORDER BY sort ASC, created_at DESC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

