import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureDatabase, getDatabase } from "@/lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "qining_visitor_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const INITIAL_UV = 107;
const INITIAL_PV = 201;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

type SiteStats = { uv: number; pv: number };

let statsSchemaPromise: Promise<void> | undefined;

function ensureStatsSchema() {
  if (!statsSchemaPromise) {
    statsSchemaPromise = (async () => {
      await ensureDatabase();
      const sql = getDatabase();

      await sql`
        CREATE TABLE IF NOT EXISTS site_stats (
          id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          pv BIGINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_visitors (
          visitor_id TEXT PRIMARY KEY,
          first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO site_stats (id, pv)
        VALUES (1, 0)
        ON CONFLICT (id) DO NOTHING
      `;

      // 一次性补齐初始数据；使用事务锁避免多个冷启动实例重复补访客。
      await sql.begin(async (transaction) => {
        await transaction`SELECT pg_advisory_xact_lock(201107201)`;

        // 留出本次访问的 +1，使首次显示值正好为 201。
        await transaction`
          UPDATE site_stats
          SET pv = GREATEST(pv, ${INITIAL_PV - 1}), updated_at = NOW()
          WHERE id = 1
        `;

        const visitorRows = await transaction`
          SELECT COUNT(*)::int AS count FROM site_visitors
        `;
        const missingVisitors = Math.max(
          0,
          INITIAL_UV - toCount(visitorRows[0]?.count)
        );

        if (missingVisitors > 0) {
          await transaction`
            INSERT INTO site_visitors (visitor_id)
            SELECT 'seed_' || md5(
              random()::text || clock_timestamp()::text || seeded.series::text
            )
            FROM generate_series(1, ${missingVisitors}) AS seeded(series)
          `;
        }
      });
    })().catch((error) => {
      statsSchemaPromise = undefined;
      throw error;
    });
  }

  return statsSchemaPromise;
}

function toCount(value: unknown) {
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

async function readSiteStats(): Promise<SiteStats> {
  await ensureStatsSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT
      (SELECT pv FROM site_stats WHERE id = 1) AS pv,
      (SELECT COUNT(*) FROM site_visitors) AS uv
  `;

  return {
    pv: toCount(rows[0]?.pv),
    uv: toCount(rows[0]?.uv),
  };
}

async function recordSiteVisit(visitorId: string): Promise<SiteStats> {
  await ensureStatsSchema();
  const sql = getDatabase();

  return sql.begin(async (transaction) => {
    await transaction`
      INSERT INTO site_visitors (visitor_id)
      VALUES (${visitorId})
      ON CONFLICT (visitor_id)
      DO UPDATE SET last_seen = NOW()
    `;

    const statsRows = await transaction`
      UPDATE site_stats
      SET pv = pv + 1, updated_at = NOW()
      WHERE id = 1
      RETURNING pv
    `;
    const visitorRows = await transaction`
      SELECT COUNT(*) AS uv FROM site_visitors
    `;

    return {
      pv: toCount(statsRows[0]?.pv),
      uv: toCount(visitorRows[0]?.uv),
    };
  });
}

function unavailable() {
  return NextResponse.json(
    { error: "统计数据暂时不可用" },
    { status: 503, headers: NO_STORE_HEADERS }
  );
}

/** 获取最新数字，不增加浏览量。 */
export async function GET() {
  try {
    const stats = await readSiteStats();
    return NextResponse.json(stats, { headers: NO_STORE_HEADERS });
  } catch {
    return unavailable();
  }
}

/** 每次页面加载调用一次：PV +1，新匿名访客同时计入 UV。 */
export async function POST() {
  const cookieStore = await cookies();
  const savedId = cookieStore.get(VISITOR_COOKIE)?.value;
  const hasValidCookie = savedId ? UUID_PATTERN.test(savedId) : false;
  const visitorId = hasValidCookie && savedId ? savedId : randomUUID();

  try {
    const stats = await recordSiteVisit(visitorId);
    const response = NextResponse.json(stats, { headers: NO_STORE_HEADERS });

    if (!hasValidCookie) {
      response.cookies.set({
        name: VISITOR_COOKIE,
        value: visitorId,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return response;
  } catch {
    return unavailable();
  }
}
