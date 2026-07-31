import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  await ensureDatabase();
  const sql = getDatabase();
  const { id } = await context.params;
  const rows = await sql`
    SELECT albums.*, COUNT(photos.id)::int AS photo_count
    FROM albums LEFT JOIN photos ON photos.album_id = albums.id
    WHERE albums.id = ${Number(id)} GROUP BY albums.id LIMIT 1
  `;
  if (!rows[0]) return NextResponse.json({ error: "相册不存在" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

