import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  setAdminCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "后台登录尚未配置" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, createAdminSession());
  return response;
}

