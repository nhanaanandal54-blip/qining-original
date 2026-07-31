import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "published";
    const category = params.get("category") || "";
    const tag = params.get("tag") || "";
    const page = Math.max(1, Number(params.get("page") || 1));
    const size = Math.min(100, Math.max(1, Number(params.get("size") || 20)));
    const values: (string | number)[] = [status];
    const where = ["status = $1"];
    if (category) {
      values.push(category);
      where.push(`category = $${values.length}`);
    }
    if (tag) {
      values.push(tag);
      where.push(`$${values.length} = ANY(tags)`);
    }
    values.push(size, (page - 1) * size);
    const rows = await sql.unsafe(
      `SELECT id, title, slug, description, cover, category, tags, status,
        is_pinned, views, likes, word_count, reading_time, published_at,
        created_at, updated_at
       FROM posts
       WHERE ${where.join(" AND ")}
       ORDER BY is_pinned DESC, published_at DESC NULLS LAST, created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
