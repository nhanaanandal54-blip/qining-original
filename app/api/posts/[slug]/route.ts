import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const { slug } = await context.params;
    const rows = await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    await sql`UPDATE posts SET views = views + 1 WHERE id = ${rows[0].id}`;
    return NextResponse.json({ ...rows[0], views: Number(rows[0].views) + 1 });
  } catch {
    return NextResponse.json({ error: "文章加载失败" }, { status: 500 });
  }
}

