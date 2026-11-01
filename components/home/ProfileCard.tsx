"use client";

// 客户端组件：从 /api/site-config 读取运行时配置，覆写 siteConfig.ts 的默认值
// 已支持的覆写键：avatarUrl / authorName / bio / github / email / bio（额外加）
// 任意键缺失或读取失败 → 回落到 siteConfig.ts 的编译期常量

import { useEffect, useState } from "react";
import { siteConfig } from "@/siteConfig";

const STATS_REFRESH_INTERVAL_MS = 10_000;

type SiteStats = {
  uv: number;
  pv: number;
};

let recordPromise: Promise<SiteStats> | null = null;

async function requestStats(method: "GET" | "POST"): Promise<SiteStats> {
  const response = await fetch("/api/stats", {
    method,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("统计数据暂时不可用");

  const data: unknown = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("统计数据格式错误");
  }

  const { uv, pv } = data as Record<string, unknown>;
  if (
    typeof uv !== "number" ||
    typeof pv !== "number" ||
    !Number.isSafeInteger(uv) ||
    !Number.isSafeInteger(pv) ||
    uv < 0 ||
    pv < 0
  ) {
    throw new Error("统计数据格式错误");
  }

  return { uv, pv };
}

function recordVisit() {
  if (!recordPromise) {
    recordPromise = requestStats("POST").catch((error: unknown) => {
      recordPromise = null;
      throw error;
    });
  }
  return recordPromise;
}

function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let recorded = false;

    const sync = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        const next = recorded
          ? await requestStats("GET")
          : await recordVisit();
        recorded = true;

        if (!cancelled) {
          setStats(next);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        inFlight = false;
      }
    };

    void sync();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void sync();
    }, STATS_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const format = (value: number) => value.toLocaleString("zh-CN");
  const fallback = failed ? "--" : "…";

  return {
    uv: stats ? format(stats.uv) : fallback,
    pv: stats ? format(stats.pv) : fallback,
  };
}

type SiteConfigOverrides = {
  avatarUrl?: string;
  authorName?: string;
  bio?: string;
  github?: string;
  email?: string;
};

export default function ProfileCard({
  postCount = 0,
  chatterCount = 0,
  photoCount = 0,
}: {
  postCount?: number;
  chatterCount?: number;
  photoCount?: number;
}) {
  const [overrides, setOverrides] = useState<SiteConfigOverrides>({});
  const [loaded, setLoaded] = useState(false);
  const { uv, pv } = useSiteStats();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, string> | null) => {
        if (cancelled || !data) return;
        setOverrides({
          avatarUrl: data.avatarUrl?.trim() || undefined,
          authorName: data.authorName?.trim() || undefined,
          bio: data.bio?.trim() || undefined,
          github: data.github?.trim() || undefined,
          email: data.email?.trim() || undefined,
        });
      })
      .catch(() => {
        // 静默失败：使用 siteConfig.ts 默认值
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const avatarUrl = overrides.avatarUrl ?? siteConfig.avatarUrl;
  const authorName = overrides.authorName ?? siteConfig.authorName;
  const bio = overrides.bio ?? siteConfig.bio;
  const social = {
    github: overrides.github ?? siteConfig.social?.github,
    email: overrides.email ?? siteConfig.social?.email,
  };

  return (
    <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-5 md:p-8 flex flex-col justify-between transition-all duration-700 group relative overflow-hidden w-full h-full min-h-[200px] md:min-h-[280px]">
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 p-[3px] shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-110 hover:rotate-6 cursor-pointer">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-full h-full rounded-full object-cover bg-white dark:bg-slate-800"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-white/90 dark:bg-slate-800 flex items-center justify-center text-xl md:text-3xl font-black text-sky-500">
                  启
                </div>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2 tracking-wider transition-colors duration-700">
              {authorName}
            </h1>
            <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-md transition-colors duration-700">
              {bio}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-end md:items-center justify-between mt-4 md:mt-8 gap-4 md:gap-6 relative z-10">
        <div className="flex gap-4 md:gap-6 w-full md:w-auto justify-around md:justify-start flex-wrap">
          <StatItem count={postCount} label="文章" color="text-indigo-600 dark:text-indigo-400" />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem count={chatterCount} label="说说" color="text-purple-600 dark:text-purple-400" />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem count={photoCount} label="照片" color="text-pink-600 dark:text-pink-400" />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem count={uv} label="访客" color="text-sky-600 dark:text-sky-400" />
          <div className="w-px h-10 bg-slate-300/50 dark:bg-slate-700 hidden md:block" />
          <StatItem count={pv} label="浏览" color="text-emerald-600 dark:text-emerald-400" />
        </div>

        <div className="flex gap-3 flex-wrap justify-end">
          {social.github && <SocialBtn type="github" url={social.github} />}
          {social.email && <SocialBtn type="email" url={`mailto:${social.email}`} />}
        </div>
      </div>

      {/* 已读取后台配置但失败时，给后台调试用的小角标（生产无副作用） */}
      {process.env.NODE_ENV !== "production" && loaded && (
        <span className="absolute bottom-2 right-3 text-[10px] text-slate-400/70">
          {Object.keys(overrides).filter((k) => overrides[k as keyof SiteConfigOverrides]).length} 项来自后台
        </span>
      )}
    </div>
  );
}

function StatItem({ count, label, color }: { count: React.ReactNode; label: string; color: string }) {
  return (
    <div className="text-center group/stat">
      <div className={`text-xl md:text-2xl font-black ${color} transition-transform group-hover/stat:scale-110`}>{count}</div>
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function SocialBtn({ type, url }: { type: string; url?: string }) {
  const getIcon = () => {
    switch (type) {
      case "github":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        );
      case "email":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };
  const content = (
    <div className="w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:scale-125 hover:-translate-y-1 transition-all duration-300 border border-white/40 dark:border-white/10 shadow-sm" title={type}>
      {getIcon()}
    </div>
  );
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer">{content}</a>
  ) : (
    content
  );
}
