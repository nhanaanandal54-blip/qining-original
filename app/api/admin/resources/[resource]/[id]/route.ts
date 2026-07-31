import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminResources, normalizeAdminPayload } from "@/lib/admin-resources";
import { ensureDatabase, getDatabase } from "@/lib/database";

type Context = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { resource: resourceKey, id } = await context.params;
  const resource = adminResources[resourceKey];
  if (!resource || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

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
  const assignments = keys.map((key, index) => `${key} = $${index + 1}`);
  if (resource.table !== "photos") assignments.push("updated_at = NOW()");
  const rows = await sql.unsafe(
    `UPDATE ${resource.table} SET ${assignments.join(", ")} WHERE id = $${keys.length + 1} RETURNING *`,
    [...keys.map((key) => payload[key]), Number(id)]
  );
  if (!rows[0]) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { resource: resourceKey, id } = await context.params;
  const resource = adminResources[resourceKey];
  if (!resource || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  await ensureDatabase();
  const sql = getDatabase();
  const rows = await sql.unsafe(
    `DELETE FROM ${resource.table} WHERE id = $1 RETURNING id`,
    [Number(id)]
  );
  if (!rows[0]) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

