# 启宁

这是“启宁”的个人站点。当前线上版本保持 GitHub Pages 可直接访问的静态部署方式，同时参考 Kirameku 开源项目的玻璃拟态、背景氛围和小组件风格做视觉调整。

## 当前包含

- 首页
- 文章
- 说说
- 照片
- 项目
- 搜索
- 明暗主题
- 便签、计时器、随机数小工具
- 浏览器本地内容工作台
- JSON 数据导出

所有公开内容来自 `data.json`。可以先在页面里点“添加内容”测试，数据会存在当前浏览器，也可以导出成 JSON，再合并进 `data.json` 用于正式发布。

## 一键部署

当前仓库使用 GitHub Pages，推送到 `main` 分支后即可通过 `https://nhanaanandal54-blip.github.io/qining-original/` 访问。

## 运行

直接用浏览器打开 `index.html` 即可。

## 管理数据

公开内容放在 `data.json`：

- `posts`：文章
- `moments`：说说
- `photos`：照片
- `projects`：项目

也可以先在页面里点“添加内容”测试，本地内容会保存在当前浏览器；确认后点“导出数据”，再把导出的 JSON 合并进 `data.json` 发布。

## 开源与署名

Kirameku 使用 MIT License。若后续迁移或复用 Kirameku 的完整源码方案，需要保留原项目的许可证和版权声明。当前站点的个人内容、头像、背景图和文案由启宁提供或定制。
