import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { adminResources } from "@/lib/admin-resources";
import { ensureDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  await ensureDatabase();
  return NextResponse.json(
    Object.entries(adminResources).map(([key, resource]) => ({
      key,
      label: resource.label,
      titleField: resource.titleField,
      fields: resource.fields,
    }))
  );
}

