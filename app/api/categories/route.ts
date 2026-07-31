import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET() {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const rows = await sql`
      SELECT ROW_NUMBER() OVER (ORDER BY category)::int AS id,
        category AS name, category AS slug, '' AS description, 0 AS sort,
        COUNT(*)::int AS post_count
      FROM posts
      WHERE status = 'published' AND category <> ''
      GROUP BY category
      ORDER BY category
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

