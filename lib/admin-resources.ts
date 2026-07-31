export type AdminFieldType = "text" | "textarea" | "number" | "boolean" | "array" | "datetime";

export interface AdminField {
  key: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
}

export interface AdminResource {
  table: string;
  label: string;
  titleField: string;
  fields: AdminField[];
  orderBy: string;
}

export type AdminValue = string | number | boolean | string[] | null;

export const adminResources: Record<string, AdminResource> = {
  posts: {
    table: "posts",
    label: "文章",
    titleField: "title",
    orderBy: "is_pinned DESC, published_at DESC NULLS LAST, created_at DESC",
    fields: [
      { key: "title", label: "标题", type: "text", required: true },
      { key: "slug", label: "链接标识", type: "text", required: true },
      { key: "description", label: "摘要", type: "textarea" },
      { key: "content", label: "正文（Markdown）", type: "textarea", required: true },
      { key: "cover", label: "封面图片 URL", type: "text" },
      { key: "category", label: "分类", type: "text" },
      { key: "tags", label: "标签", type: "array" },
      { key: "status", label: "状态（published/draft）", type: "text" },
      { key: "is_pinned", label: "置顶", type: "boolean" },
      { key: "published_at", label: "发布时间", type: "datetime" },
    ],
  },
  chatters: {
    table: "chatters",
    label: "说说",
    titleField: "content",
    orderBy: "created_at DESC",
    fields: [
      { key: "content", label: "内容", type: "textarea", required: true },
      { key: "images", label: "图片 URL", type: "array" },
      { key: "mood", label: "心情", type: "text" },
      { key: "status", label: "状态（published/draft）", type: "text" },
    ],
  },
  projects: {
    table: "projects",
    label: "项目",
    titleField: "name",
    orderBy: "sort ASC, created_at DESC",
    fields: [
      { key: "name", label: "项目名", type: "text", required: true },
      { key: "slug", label: "链接标识", type: "text", required: true },
      { key: "description", label: "简介", type: "textarea" },
      { key: "long_description", label: "详细介绍", type: "textarea" },
      { key: "cover_image", label: "封面图片 URL", type: "text" },
      { key: "tech_stack", label: "技术栈", type: "array" },
      { key: "link_github", label: "GitHub 链接", type: "text" },
      { key: "link_live", label: "线上链接", type: "text" },
      { key: "link_docs", label: "文档链接", type: "text" },
      { key: "status", label: "状态", type: "text" },
      { key: "status_label", label: "状态文案", type: "text" },
      { key: "is_featured", label: "精选", type: "boolean" },
      { key: "sort", label: "排序", type: "number" },
    ],
  },
  albums: {
    table: "albums",
    label: "相册",
    titleField: "title",
    orderBy: "sort ASC, created_at DESC",
    fields: [
      { key: "title", label: "相册名", type: "text", required: true },
      { key: "description", label: "介绍", type: "textarea" },
      { key: "cover", label: "封面图片 URL", type: "text" },
      { key: "sort", label: "排序", type: "number" },
    ],
  },
  photos: {
    table: "photos",
    label: "照片",
    titleField: "caption",
    orderBy: "album_id ASC, sort ASC, created_at DESC",
    fields: [
      { key: "album_id", label: "相册 ID", type: "number", required: true },
      { key: "url", label: "图片 URL", type: "text", required: true },
      { key: "caption", label: "说明", type: "text" },
      { key: "orientation", label: "方向（landscape/portrait）", type: "text" },
      { key: "sort", label: "排序", type: "number" },
    ],
  },
  "site-config": {
    table: "site_config",
    label: "站点配置",
    titleField: "key",
    orderBy: "key ASC",
    fields: [
      { key: "key", label: "配置键", type: "text", required: true },
      { key: "value", label: "配置值", type: "textarea" },
      { key: "description", label: "说明", type: "text" },
    ],
  },
};

export function normalizeAdminPayload(
  resourceKey: string,
  input: Record<string, unknown>
): Record<string, AdminValue> | null {
  const resource = adminResources[resourceKey];
  if (!resource) return null;

  const output: Record<string, AdminValue> = {};
  for (const field of resource.fields) {
    const value = input[field.key];
    let normalized: AdminValue;
    if (field.type === "array") {
      normalized = Array.isArray(value)
        ? value.map(String).map((item) => item.trim()).filter(Boolean)
        : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
    } else if (field.type === "number") {
      normalized = Number(value || 0);
    } else if (field.type === "boolean") {
      normalized = Boolean(value);
    } else if (field.type === "datetime") {
      normalized = value ? new Date(String(value)).toISOString() : null;
    } else {
      normalized = String(value || "").trim();
    }
    output[field.key] = normalized;
  }

  if (resourceKey === "posts") {
    const content = String(output.content || "");
    output.word_count = content.replace(/\s+/g, "").length;
    output.reading_time = Math.max(1, Math.ceil(content.length / 500));
    if (output.status === "published" && !output.published_at) {
      output.published_at = new Date().toISOString();
    }
  }

  return output;
}
