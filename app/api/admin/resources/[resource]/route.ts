import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminResources, normalizeAdminPayload } from "@/lib/admin-resources";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ resource: string }> };

export async function GET(request: NextRequest, context: Context) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { resource: resourceKey } = await context.params;
  const resource = adminResources[resourceKey];
  if (!resource) return NextResponse.json({ error: "未知资源" }, { status: 404 });

  await ensureDatabase();
  const sql = getDatabase();
  const rows = await sql.unsafe(
    `SELECT * FROM ${resource.table} ORDER BY ${resource.orderBy} LIMIT 500`
  );
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest, context: Context) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { resource: resourceKey } = await context.params;
  const resource = adminResources[resourceKey];
  if (!resource) return NextResponse.json({ error: "未知资源" }, { status: 404 });

  const input = await request.json().catch(() => ({}));
  const payload = normalizeAdminPayload(resourceKey, input);
  if (!payload) return NextResponse.json({ error: "数据无效" }, { status: 400 });

  const missing = resource.fields.find(
    (field) => field.required && !payload[field.key]
  );
  if (missing) {
    return NextResponse.json({ error: `${missing.label}不能为空` }, { status: 400 });
  }

  await ensureDatabase();
  const sql = getDatabase();
  const keys = Object.keys(payload);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const rows = await sql.unsafe(
    `INSERT INTO ${resource.table} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    keys.map((key) => payload[key])
  );
  return NextResponse.json(rows[0], { status: 201 });
}

