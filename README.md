# 花听直播 - 麻将比赛直播辅助工具

🀄 基于 `Electron` + `Vue` + `Vite` 开发的麻将比赛直播辅助工具

一个专为麻将比赛直播设计的桌面应用程序，提供透明悬浮窗口显示比赛信息，以及独立的控制面板进行实时数据管理。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/Electron-29.1.1-47848F.svg)
![Vue](https://img.shields.io/badge/Vue-3.4.21-4FC08D.svg)
![Vite](https://img.shields.io/badge/Vite-5.1.5-646CFF.svg)

## ✨ 功能特性

🎮 **双窗口设计**：透明悬浮窗 + 独立控制面板  
🎯 **实时同步**：控制面板修改后，悬浮窗实时更新  
🌱 **麻将专用**：专为麻将比赛直播场景设计  
💪 **现代技术栈**：基于 Electron + Vue 3 + Vite + TypeScript  
🔩 **跨平台支持**：支持 Windows、macOS、Linux  
🖥 **多窗口管理**：主进程统一管理数据状态

## 🎯 应用场景

- 麻将比赛直播
- 电竞赛事转播
- 在线麻将教学
- 比赛数据展示  

## 🚀 快速开始

```sh
# 克隆项目
git clone https://github.com/your-username/electron-vite-vue.git

# 进入项目目录
cd electron-vite-vue

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 构建应用
npm run build
```

### 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0

## 📖 使用指南

### 窗口说明

运行 `npm run dev` 后会自动开启两个窗口：

#### 1. Match Overlay（悬浮窗）
- **特性**：无边框透明窗口，可置顶显示
- **布局**：
  - 左上角：场次、本场、场供、宝牌信息
  - 右上角：赛事名称 + Logo
  - 底部：选手/战队信息、分数、听牌状态

#### 2. 控制面板
- **特性**：常规窗口，用于数据管理
- **功能**：填写所有字段，实时更新悬浮窗
- **优势**：表单值持久化，方便连续调整

### 可配置数据

| 类别 | 字段 | 说明 |
|------|------|------|
| 基础信息 | 场次、本场、场供、宝牌 | 麻将基础信息 |
| 赛事信息 | 比赛名称、比赛 Logo URL | 赛事标识 |
| 选手信息 | 选手名称、战队名称、战队 Logo URL | 参赛者信息 |
| 游戏状态 | 副露说明、实时分数 | 当前局面 |
| 听牌信息 | 听牌内容、可胡状态 | 彩色标签区分可胡/不可胡 |

### 数据同步机制

- 所有数据在主进程内存中维护
- 通过 `matchAPI`（预加载脚本）实现进程间通信
- 确保双窗口数据实时同步

## 🛠️ 技术栈

### 核心框架
- **[Electron](https://www.electronjs.org/)** `^29.1.1` - 跨平台桌面应用框架
- **[Vue 3](https://vuejs.org/)** `^3.4.21` - 渐进式 JavaScript 框架
- **[Vite](https://vitejs.dev/)** `^5.1.5` - 下一代前端构建工具
- **[TypeScript](https://www.typescriptlang.org/)** `^5.4.2` - JavaScript 的超集

### 构建工具
- **[Electron Builder](https://www.electron.build/)** `^24.13.3` - 应用打包和分发
- **[Vite Plugin Electron](https://github.com/electron-vite/vite-plugin-electron)** `^0.28.4` - Electron 开发插件
- **[Vue TSC](https://github.com/johnsoncodehk/volar)** `^2.0.6` - Vue TypeScript 编译器

### 路由管理
- **[Vue Router](https://router.vuejs.org/)** `^4.3.0` - Vue.js 官方路由管理器

## 🙏 致谢

本项目基于以下优秀的开源项目：

- [electron-vite/electron-vite-vue](https://github.com/electron-vite/electron-vite-vue) - 项目模板基础
- [Electron](https://github.com/electron/electron) - 跨平台桌面应用框架
- [Vue.js](https://github.com/vuejs/vue) - 渐进式 JavaScript 框架
- [Vite](https://github.com/vitejs/vite) - 下一代前端构建工具
- [TypeScript](https://github.com/microsoft/TypeScript) - JavaScript 超集
- [Vue Router](https://github.com/vuejs/router) - Vue.js 路由管理

感谢所有开源贡献者的辛勤付出！

## 📁 项目结构

```
electron-vite-vue/
├── electron/                 # Electron 主进程和预加载脚本
│   ├── main/
│   │   └── index.ts         # 主进程入口
│   └── preload/
│       └── index.ts         # 预加载脚本
├── src/                     # 渲染进程源码
│   ├── components/          # Vue 组件
│   ├── composables/         # Vue 组合式函数
│   │   └── useMatchState.ts # 比赛状态管理
│   ├── img/                 # 图片资源
│   ├── Resources/           # 麻将牌面资源
│   ├── router/              # 路由配置
│   ├── types/               # TypeScript 类型定义
│   │   └── match.ts         # 比赛数据类型
│   ├── views/               # 页面组件
│   │   ├── ControlPanel.vue # 控制面板
│   │   └── OverlayView.vue  # 悬浮窗
│   ├── App.vue              # 根组件
│   ├── main.ts              # 渲染进程入口
│   └── style.css            # 全局样式
├── dist/                    # 构建输出（渲染进程）
├── dist-electron/           # 构建输出（主进程）
├── release/                 # 应用打包输出
├── index.html               # HTML 模板
├── package.json             # 项目配置
├── vite.config.ts           # Vite 配置
├── electron-builder.json5   # Electron Builder 配置
└── README.md                # 项目说明
```

<!--
## Be aware

🚨 By default, this template integrates Node.js in the Renderer process. If you don't need it, you just remove the option below. [Because it will modify the default config of Vite](https://github.com/electron-vite/vite-plugin-electron-renderer#config-presets-opinionated).

```diff
# vite.config.ts

export default {
  plugins: [
-   // Use Node.js API in the Renderer-process
-   renderer({
-     nodeIntegration: true,
-   }),
  ],
}
```
-->

## 📝 开发说明

### 构建配置
- 已禁用代码签名（`"sign": false`），适合开发环境
- 支持 Windows x64 架构的 NSIS 安装包
- 输出目录：`release/${version}/`

### 常见问题

#### 构建问题
- **代码签名错误**：已在 `electron-builder.json5` 中禁用签名
- **网络连接问题**：设置了 `CSC_IDENTITY_AUTO_DISCOVERY=false`

#### 开发问题
- [C/C++ addons, Node.js modules - Pre-Bundling](https://github.com/electron-vite/vite-plugin-electron-renderer#dependency-pre-bundling)
- [dependencies vs devDependencies](https://github.com/electron-vite/vite-plugin-electron-renderer#dependencies-vs-devdependencies)

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

**Made with ❤️ by 比尔**
