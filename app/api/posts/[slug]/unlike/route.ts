import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ slug: string }> };

export async function POST(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { slug } = await context.params;
  const id = Number(slug);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "无效文章" }, { status: 400 });
  const rows = await sql`UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ${id} RETURNING likes`;
  if (!rows[0]) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  return NextResponse.json({ likes: rows[0].likes });
}

