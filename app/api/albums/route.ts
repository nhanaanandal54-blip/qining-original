import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export async function GET() {
  try {
    await ensureDatabase();
    const sql = getDatabase();
    const rows = await sql`
      SELECT albums.*, COUNT(photos.id)::int AS photo_count
      FROM albums LEFT JOIN photos ON photos.album_id = albums.id
      GROUP BY albums.id ORDER BY albums.sort ASC, albums.created_at DESC
    `;
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}

