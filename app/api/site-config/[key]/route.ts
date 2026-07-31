import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { key } = await context.params;
  const rows = await sql`SELECT * FROM site_config WHERE key = ${key} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: "配置不存在" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

