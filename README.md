# 启宁

这是启宁的个人知识空间。当前版本复用 Kirameku 的 Next.js 布局、玻璃拟态 UI、导航、背景、音乐、小组件和页面结构，并已移除原作者个人内容。

## 内容边界

- 站点名称：启宁
- 邮箱：435688960@qq.com
- GitHub：https://github.com/nhanaanandal54-blip
- 头像：`public/avatar.png`
- 背景图：`public/backgrounds/`
- 文章、说说、照片、项目数据：当前为空，后续只添加启宁自己的内容

不会使用原作者的昵称、头像、照片、文章、项目、音乐歌单、联系方式或其他个人资料。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000` 查看。

## 构建

```bash
npm run build
```

## 部署

这是 Next.js 动态站点，推荐使用 Vercel 一键部署。GitHub Pages 只能托管纯静态文件，无法完整支持原方案里的动态路由和 API 能力。

## 管理数据

- 后台地址：`/admin`
- 可管理内容：文章、说说、项目、相册、照片、站点配置
- 文章正文支持 Markdown
- 图片字段填写本站路径或公开图片 URL
- 关于页正文仍在 `app/about/about.md`

生产环境使用 Neon PostgreSQL，连接信息由 Vercel Storage 自动写入 `DATABASE_URL`。管理密码只以 scrypt 哈希形式保存在 Vercel 环境变量中，不写入仓库。

本地开发需要在 `.env.local` 配置：

```env
DATABASE_URL=postgresql://...
ADMIN_PASSWORD_HASH=scrypt$...
ADMIN_SESSION_SECRET=...
```

数据库表会在第一次访问内容 API 或后台时自动创建，无需手动执行 SQL。

## 开源与署名

Kirameku 使用 MIT License。因为当前项目复用了 Kirameku 的源码方案，需要保留原项目许可和版权声明；启宁自己的文案、头像、背景图和未来内容归启宁所有。
