// siteConfig.ts - 全站配置中心

export const siteConfig = {
  // 网站标题与博主信息
  title: "启宁",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  authorName: "启宁",
  bio: "个人知识空间，用来记录医学知识、编程开发、设计探索与成长过程。",

  // 头像设置
  avatarUrl: "/avatar.png",

  // 背景设置
  useGradient: true,
  themeColors: ["#dbeafe", "#f8fafc", "#e0f2fe", "#f1f5f9"],
  bgImages: [
    "/backgrounds/bg-01.jpg",
    "/backgrounds/bg-02.jpg",
    "/backgrounds/bg-03.jpg",
    "/backgrounds/bg-04.jpg",
    "/backgrounds/bg-05.jpg",
  ] as string[],

  // 默认封面图
  defaultPostCover: "",

  // 照片墙预览图
  photoWallImage: "",

  // 云音乐配置（网易云音乐）
  // 歌单与额外歌曲会自动合并；重复或失效歌曲会被跳过
  cloudMusicPlaylistId: "17943739323",  // 歌单 ID
  cloudMusicIds: [                       // 额外歌曲 ID（会与歌单合并去重）
    "3399839173",
    "492725541",
  ],

  // 后端 API 地址（留空，开发通过 next.config.ts rewrites 代理，生产通过 Nginx 反代）
  apiBaseUrl: "",

  // 社交链接
  social: {
    github: "https://github.com/nhanaanandal54-blip",
    gitee: "",
    google: "",
    email: "435688960@qq.com",
    qq: "",
    wechat: "",
  },

  // 站点信息
  buildDate: "2026-07-31T18:11:26+08:00",
  footerBadges: [
    { name: "Next.js 15", color: "text-sky-500" },
    { name: "React 19", color: "text-cyan-400" },
    { name: "Tailwind 4", color: "text-teal-400" },
  ],
  icpConfig: {
    name: "",
    link: "https://beian.miit.gov.cn/",
  },
  moeIcpConfig: {
    name: "",
    link: "https://icp.gov.moe/",
  },

  // 分类标题
  chatterTitle: "留言",
  chatterDescription: "生活、技术、随想的碎片记录",
};
