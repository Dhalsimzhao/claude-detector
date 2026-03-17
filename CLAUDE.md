# Claude Detector

Electron 桌面宠物应用，监听 Claude Code 会话状态，显示动画宠物反馈。

## 技术栈

pnpm + Electron + electron-vite + React + TypeScript + Express

## 常用命令

- `pnpm dev` — 开发模式
- `pnpm build` — 构建
- `pnpm run typecheck` — 类型检查
- `pnpm dist` — 打包 Windows 安装包

## 架构概览

- `src/main/` — Electron 主进程（窗口、会话管理、Hook 服务器、系统托盘）
- `src/renderer/` — React 前端（宠物渲染、动画、会话面板）
- `src/preload/` — IPC 桥接
- `src/shared/` — 共享类型定义
- `scripts/` — Claude Code hook 脚本
- `resources/sprites/` — 宠物精灵图（psyduck / sherma / flea）

## 核心机制

1. **Hook 系统**：向 Claude Code 注册 9 个生命周期 hook → hook 脚本发 HTTP 事件到本地 Express 服务器
2. **会话管理**：session_id → 宠物状态映射，按优先级决定当前显示状态（permissionRequest > running > taskCompleted > idle）
3. **精灵图系统**：单行 PNG sprite sheet，Canvas 渲染；静态精灵自动添加呼吸动画

## 详细文档

@docs/claude/architecture.md
@docs/claude/pitfalls.md
