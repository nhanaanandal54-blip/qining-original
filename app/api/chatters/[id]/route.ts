import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { id } = await context.params;
  const rows = await sql`SELECT * FROM chatters WHERE id = ${Number(id)} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: "说说不存在" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

