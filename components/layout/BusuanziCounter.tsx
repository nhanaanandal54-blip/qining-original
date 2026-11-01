"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 200;
const TIMEOUT_MS = 8000;

/**
 * 不蒜子（busuanzi）访问统计组件。
 * 需要在 layout.tsx 中引入 busuanzi.pure.mini.js 脚本。
 *
 * @param type "pv" = 页面浏览量，"uv" = 访客人数
 * @param fallback 加载中的占位文字
 */
export default function BusuanziCounter({
  type,
  fallback = "加载中",
}: {
  type: "pv" | "uv";
  fallback?: string;
}) {
  const [value, setValue] = useState<string>(fallback);

  useEffect(() => {
    setValue(fallback);

    const id =
      type === "pv"
        ? "busuanzi_value_site_pv"
        : "busuanzi_value_site_uv";

    const tryUpdate = () => {
      const el = document.getElementById(id);
      const text = el?.textContent?.trim();

      if (text && text !== fallback) {
        setValue(text);
        return true;
      }

      return false;
    };

    // 不蒜子已经完成统计时，直接使用现有结果。
    if (tryUpdate()) return;

    let interval: number | undefined;
    let timeout: number | undefined;

    const stopWaiting = () => {
      if (interval !== undefined) window.clearInterval(interval);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };

    interval = window.setInterval(() => {
      if (tryUpdate()) stopWaiting();
    }, POLL_INTERVAL_MS);

    // 第三方接口失败或超时时显示占位符，不再永久停留在“加载中”。
    timeout = window.setTimeout(() => {
      stopWaiting();
      setValue("--");
    }, TIMEOUT_MS);

    return stopWaiting;
  }, [type, fallback]);

  // 隐藏的原始 span 给不蒜子脚本填充；可见值通过 state 显示，避免 hydration 警告。
  const hiddenId =
    type === "pv" ? "busuanzi_value_site_pv" : "busuanzi_value_site_uv";
  const unavailable = value === "--";
  const label = type === "pv" ? "浏览量" : "访客人数";

  return (
    <>
      <span id={hiddenId} className="hidden" />
      <span
        aria-live="polite"
        aria-label={unavailable ? `${label}暂时不可用` : undefined}
        title={unavailable ? "统计数据暂时不可用，请稍后刷新重试" : undefined}
      >
        {value}
      </span>
    </>
  );
}
