import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { hasDatabase } from "@/lib/database";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: isAdminRequest(request),
    databaseConfigured: hasDatabase(),
  });
}

