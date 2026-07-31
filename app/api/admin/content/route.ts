import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminResources, normalizeAdminPayload } from "@/lib/admin-resources";
import { ensureDatabase, getDatabase } from "@/lib/database";

function getResource(request: NextRequest) {
  const resourceKey = request.nextUrl.searchParams.get("resource") || "";
  const resource = adminResources[resourceKey];
  return resource ? { resourceKey, resource } : null;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const selected = getResource(request);
  if (!selected) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  await ensureDatabase();
  const sql = getDatabase();
  const rows = await sql.unsafe(
    `SELECT * FROM ${selected.resource.table} ORDER BY ${selected.resource.orderBy} LIMIT 500`
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const selected = getResource(request);
  if (!selected) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const input = await request.json().catch(() => ({}));
  const payload = normalizeAdminPayload(selected.resourceKey, input);
  if (!payload) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const missing = selected.resource.fields.find(
    (field) => field.required && !payload[field.key]
  );
  if (missing) return NextResponse.json({ error: `${missing.label} is required` }, { status: 400 });

  await ensureDatabase();
  const sql = getDatabase();
  const keys = Object.keys(payload);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const rows = await sql.unsafe(
    `INSERT INTO ${selected.resource.table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    keys.map((key) => payload[key])
  );
  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const selected = getResource(request);
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!selected || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const input = await request.json().catch(() => ({}));
  const payload = normalizeAdminPayload(selected.resourceKey, input);
  if (!payload) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const missing = selected.resource.fields.find(
    (field) => field.required && !payload[field.key]
  );
  if (missing) return NextResponse.json({ error: `${missing.label} is required` }, { status: 400 });

  await ensureDatabase();
  const sql = getDatabase();
  const keys = Object.keys(payload);
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
  if (selected.resource.table !== "photos") assignments.push("updated_at = NOW()");
  const rows = await sql.unsafe(
    `UPDATE ${selected.resource.table} SET ${assignments.join(", ")} WHERE id = $${keys.length + 1} RETURNING *`,
    [...keys.map((key) => payload[key]), Number(id)]
  );
  if (!rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const selected = getResource(request);
  const id = request.nextUrl.searchParams.get("id") || "";
  if (!selected || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  await ensureDatabase();
  const sql = getDatabase();
  const rows = await sql.unsafe(
    `DELETE FROM ${selected.resource.table} WHERE id = $1 RETURNING id`,
    [Number(id)]
  );
  if (!rows[0]) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
