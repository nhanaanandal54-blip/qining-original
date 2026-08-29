"use client";

import { useEffect, useState } from "react";

/**
 * 不蒜子（busuanzi）访问统计组件
 * 需要在 layout.tsx 中引入 busuanzi.pure.mini.js 脚本
 *
 * @param type "pv" = 页面浏览量, "uv" = 访客人数
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
    const id =
      type === "pv"
        ? "busuanzi_value_site_pv"
        : "busuanzi_value_site_uv";

    const tryUpdate = () => {
      const el = document.getElementById(id);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        if (text && text !== fallback) {
          setValue(text);
          return true;
        }
      }
      return false;
    };

    // 立即尝试一次
    if (tryUpdate()) return;

    // 轮询等待不蒜子脚本加载完成（最多 5 秒）
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (tryUpdate() || attempts > 25) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [type, fallback]);

  // 隐藏的原始 span（给 busuanzi 脚本填充）
  // 可见值通过 state 显示，避免 hydration 警告
  const hiddenId =
    type === "pv"
      ? "busuanzi_value_site_pv"
      : "busuanzi_value_site_uv";

  return (
    <>
      <span id={hiddenId} className="hidden" />
      <span>{value}</span>
    </>
  );
}
