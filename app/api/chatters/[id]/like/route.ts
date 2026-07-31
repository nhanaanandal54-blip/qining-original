import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { id } = await context.params;
  const rows = await sql`UPDATE chatters SET likes = likes + 1 WHERE id = ${Number(id)} RETURNING likes`;
  if (!rows[0]) return NextResponse.json({ error: "说说不存在" }, { status: 404 });
  return NextResponse.json({ likes: rows[0].likes });
}

