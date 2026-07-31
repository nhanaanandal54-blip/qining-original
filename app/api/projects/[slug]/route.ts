import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { slug } = await context.params;
  const rows = await sql`SELECT * FROM projects WHERE slug = ${slug} LIMIT 1`;
  if (!rows[0]) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

