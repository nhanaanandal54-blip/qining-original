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

- 全站基础资料在 `siteConfig.ts`
- 文章列表在 `data/posts.ts`
- 说说在 `data/moments.ts`
- 照片墙在 `data/photos.ts` 和 `data/albums.ts`
- 项目在 `app/projects/projectsData.ts`
- 关于页正文在 `app/about/about.md`

后续你把自己的资料发来后，按这些文件补进去即可。

## 开源与署名

Kirameku 使用 MIT License。因为当前项目复用了 Kirameku 的源码方案，需要保留原项目许可和版权声明；启宁自己的文案、头像、背景图和未来内容归启宁所有。
