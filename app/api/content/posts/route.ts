import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const params = request.nextUrl.searchParams;
    const slug = params.get("slug") || "";
    const id = params.get("id") || "";

    if (slug || id) {
      const rows = slug
        ? await sql`SELECT * FROM posts WHERE slug = ${slug} LIMIT 1`
        : /^\d+$/.test(id)
          ? await sql`SELECT * FROM posts WHERE id = ${Number(id)} LIMIT 1`
          : [];
      if (!rows[0]) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      await sql`UPDATE posts SET views = views + 1 WHERE id = ${rows[0].id}`;
      return NextResponse.json({ ...rows[0], views: Number(rows[0].views) + 1 });
    }

    const status = params.get("status") || "published";
    if (params.get("mode") === "count") {
      const rows = await sql`SELECT COUNT(*)::int AS count FROM posts WHERE status = ${status}`;
      return NextResponse.json({ count: rows[0]?.count || 0 });
    }

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
    return NextResponse.json({ error: "Posts unavailable" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await ensureDatabase();
  const sql = getDatabase();
  const params = request.nextUrl.searchParams;
  const id = params.get("id") || "";
  const action = params.get("action") || "like";
  if (!/^\d+$/.test(id) || !["like", "unlike"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rows = action === "unlike"
    ? await sql`UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = ${Number(id)} RETURNING likes`
    : await sql`UPDATE posts SET likes = likes + 1 WHERE id = ${Number(id)} RETURNING likes`;
  if (!rows[0]) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ likes: rows[0].likes });
}
