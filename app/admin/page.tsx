"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Album,
  Database,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LogOut,
  Menu,
  MessageSquareText,
  Plus,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

type FieldType = "text" | "textarea" | "number" | "boolean" | "array" | "datetime";

interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

interface ResourceMeta {
  key: string;
  label: string;
  titleField: string;
  fields: Field[];
}

type RecordValue = string | number | boolean | string[] | null;
type ContentRecord = Record<string, RecordValue> & { id?: number };

const resourceIcons = {
  posts: FileText,
  chatters: MessageSquareText,
  projects: FolderKanban,
  albums: Album,
  photos: ImageIcon,
  "site-config": Settings,
};

function defaultValue(field: Field): RecordValue {
  if (field.type === "boolean") return false;
  if (field.type === "number") return 0;
  if (field.type === "array") return [];
  if (field.type === "datetime") return null;
  if (field.key === "status") return "published";
  if (field.key === "orientation") return "landscape";
  return "";
}

function displayValue(value: RecordValue) {
  if (Array.isArray(value)) return value.join(", ");
  return value == null ? "" : String(value);
}

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [databaseConfigured, setDatabaseConfigured] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resources, setResources] = useState<ResourceMeta[]>([]);
  const [activeKey, setActiveKey] = useState("posts");
  const [items, setItems] = useState<ContentRecord[]>([]);
  const [draft, setDraft] = useState<ContentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const activeResource = useMemo(
    () => resources.find((resource) => resource.key === activeKey),
    [activeKey, resources]
  );

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/auth/session", { cache: "no-store" });
      const data = await response.json();
      setAuthenticated(Boolean(data.authenticated));
      setDatabaseConfigured(Boolean(data.databaseConfigured));
    } finally {
      setChecking(false);
    }
  }, []);

  const loadResources = useCallback(async () => {
    const response = await fetch("/api/admin/resources", { cache: "no-store" });
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    if (!response.ok) throw new Error("管理模块加载失败");
    setResources(await response.json());
  }, []);

  const loadItems = useCallback(async (resourceKey: string) => {
    setLoading(true);
    setDraft(null);
    try {
      const response = await fetch(`/api/admin/resources/${resourceKey}`, {
        cache: "no-store",
      });
      if (response.status === 401) {
        setAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error("内容加载失败");
      setItems(await response.json());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "内容加载失败");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!authenticated) return;
    // Data is loaded asynchronously after authentication changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadResources().catch((error) => setNotice(error.message));
  }, [authenticated, loadResources]);

  useEffect(() => {
    if (!authenticated || !resources.length) return;
    // Switching modules intentionally resets the editor before fetching rows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems(activeKey);
  }, [activeKey, authenticated, loadItems, resources.length]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError("");
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLoginError(data.error || "登录失败");
      return;
    }
    setPassword("");
    setAuthenticated(true);
    setDatabaseConfigured(true);
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setResources([]);
    setItems([]);
    setDraft(null);
  }

  function createItem() {
    if (!activeResource) return;
    setDraft(
      Object.fromEntries(
        activeResource.fields.map((field) => [field.key, defaultValue(field)])
      )
    );
  }

  function updateDraft(field: Field, value: string | boolean) {
    setDraft((current) => {
      if (!current) return current;
      let nextValue: RecordValue = value;
      if (field.type === "number") nextValue = Number(value || 0);
      if (field.type === "array") {
        nextValue = String(value).split(",").map((item) => item.trim()).filter(Boolean);
      }
      return { ...current, [field.key]: nextValue };
    });
  }

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    if (!draft || !activeResource) return;
    setSaving(true);
    setNotice("");
    const isEditing = Boolean(draft.id);
    try {
      const response = await fetch(
        `/api/admin/resources/${activeKey}${isEditing ? `/${draft.id}` : ""}`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "保存失败");
      setNotice("已保存，前台内容会自动更新");
      await loadItems(activeKey);
      setDraft(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: ContentRecord) {
    if (!item.id || !window.confirm("确认永久删除这条内容？")) return;
    const response = await fetch(`/api/admin/resources/${activeKey}/${item.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setNotice(data.error || "删除失败");
      return;
    }
    setNotice("已删除");
    await loadItems(activeKey);
  }

  if (checking) {
    return (
      <AdminFrame>
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
      </AdminFrame>
    );
  }

  if (!authenticated) {
    return (
      <AdminFrame>
        <div className="flex min-h-screen items-center justify-center px-5">
          <form onSubmit={handleLogin} className="w-full max-w-sm border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-950 dark:text-white">启宁管理后台</h1>
                <p className="text-xs text-slate-500">仅站点管理员可访问</p>
              </div>
            </div>
            {!databaseConfigured && (
              <div className="mb-4 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                数据库环境变量尚未配置。
              </div>
            )}
            <label className="mb-2 block text-xs font-medium text-slate-700 dark:text-slate-300" htmlFor="admin-password">
              管理密码
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950"
              required
            />
            {loginError && <p className="mt-2 text-xs text-red-600">{loginError}</p>}
            <button type="submit" className="mt-5 h-11 w-full bg-sky-600 text-sm font-medium text-white hover:bg-sky-700">
              登录后台
            </button>
          </form>
        </div>
      </AdminFrame>
    );
  }

  return (
    <AdminFrame>
      <div className="flex h-screen overflow-hidden">
        <aside className={`${mobileMenu ? "flex" : "hidden"} absolute inset-y-0 left-0 z-20 w-64 flex-col border-r border-slate-200 bg-white md:static md:flex dark:border-slate-800 dark:bg-slate-950`}>
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-sky-600" />
              启宁后台
            </div>
            <button type="button" className="md:hidden" title="关闭菜单" onClick={() => setMobileMenu(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {resources.map((resource) => {
              const Icon = resourceIcons[resource.key as keyof typeof resourceIcons] || Settings;
              return (
                <button
                  key={resource.key}
                  type="button"
                  onClick={() => { setActiveKey(resource.key); setMobileMenu(false); }}
                  className={`flex h-10 w-full items-center gap-3 px-3 text-sm ${activeKey === resource.key ? "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"}`}
                >
                  <Icon className="h-4 w-4" />
                  {resource.label}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={handleLogout} className="m-3 flex h-10 items-center gap-3 px-3 text-sm text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-900">
            <LogOut className="h-4 w-4" />退出登录
          </button>
        </aside>

        {mobileMenu && <button type="button" aria-label="关闭菜单遮罩" className="absolute inset-0 z-10 bg-black/30 md:hidden" onClick={() => setMobileMenu(false)} />}

        <section className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-900">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <button type="button" title="打开菜单" className="md:hidden" onClick={() => setMobileMenu(true)}><Menu className="h-5 w-5" /></button>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{activeResource?.label || "内容管理"}</h2>
                <p className="text-[11px] text-slate-500">{items.length} 条记录</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" title="刷新" onClick={() => loadItems(activeKey)} className="flex h-9 w-9 items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button type="button" onClick={createItem} className="flex h-9 items-center gap-2 bg-sky-600 px-3 text-xs font-medium text-white hover:bg-sky-700">
                <Plus className="h-4 w-4" />新增
              </button>
            </div>
          </header>

          {notice && (
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50 px-4 py-2 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
              {notice}<button type="button" title="关闭提示" onClick={() => setNotice("")}><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(280px,0.8fr)_minmax(420px,1.2fr)] lg:overflow-hidden">
            <div className="border-r border-slate-200 bg-white lg:overflow-y-auto dark:border-slate-800 dark:bg-slate-950">
              {loading ? (
                <div className="flex h-40 items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin text-slate-400" /></div>
              ) : items.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-sm text-slate-400">
                  <Database className="mb-2 h-6 w-6" />暂无数据
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item) => {
                    const title = displayValue(item[activeResource?.titleField || "id"]) || `记录 #${item.id}`;
                    return (
                      <button key={item.id} type="button" onClick={() => setDraft(item)} className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900 ${draft?.id === item.id ? "bg-sky-50 dark:bg-sky-950" : ""}`}>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-200">{title}</span>
                        <span className="text-[10px] text-slate-400">#{item.id}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 md:p-6 lg:overflow-y-auto dark:bg-slate-900">
              {!draft || !activeResource ? (
                <div className="flex min-h-64 items-center justify-center text-sm text-slate-400">选择一条记录或点击新增</div>
              ) : (
                <form onSubmit={saveItem} className="mx-auto max-w-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{draft.id ? `编辑 #${draft.id}` : `新增${activeResource.label}`}</h3>
                    {draft.id && (
                      <button type="button" title="删除" onClick={() => deleteItem(draft)} className="flex h-9 w-9 items-center justify-center border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {activeResource.fields.map((field) => (
                    <FieldInput key={field.key} field={field} value={draft[field.key]} onChange={(value) => updateDraft(field, value)} />
                  ))}
                  <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
                    <button disabled={saving} type="submit" className="flex h-10 items-center gap-2 bg-sky-600 px-5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
                      <Save className="h-4 w-4" />{saving ? "保存中" : "保存"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminFrame>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: RecordValue; onChange: (value: string | boolean) => void }) {
  const inputId = `field-${field.key}`;
  if (field.type === "boolean") {
    return (
      <label className="flex h-11 items-center justify-between border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" htmlFor={inputId}>
        {field.label}
        <input id={inputId} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-sky-600" />
      </label>
    );
  }

  const stringValue = field.type === "array" ? (Array.isArray(value) ? value.join(", ") : displayValue(value)) : displayValue(value);
  const isLargeText = field.type === "textarea";
  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
        {field.label}{field.required ? " *" : ""}
      </label>
      {isLargeText ? (
        <textarea id={inputId} required={field.required} value={stringValue} onChange={(event) => onChange(event.target.value)} rows={field.key === "content" ? 18 : 4} className="w-full resize-y border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-6 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" />
      ) : (
        <input id={inputId} required={field.required} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"} value={field.type === "datetime" && stringValue ? stringValue.slice(0, 16) : stringValue} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950" />
      )}
      {field.type === "array" && <p className="mt-1 text-[10px] text-slate-400">多个值用英文逗号分隔</p>}
    </div>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[1000] overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">{children}</div>;
}
