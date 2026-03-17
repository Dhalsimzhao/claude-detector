# Claude Detector

桌面宠物应用，监听 Claude Code 会话状态，根据当前活动显示不同动画。

![Psyduck](resources/sprites/psyduck/idle.png)

## 功能

- 实时显示 Claude Code 工作状态（空闲 / 运行中 / 等待权限 / 完成）
- **权限对话框**：Claude Code 请求工具权限时，直接在宠物窗口点击 Allow / Deny，无需切换终端
- 支持多套宠物主题：Psyduck、Sherma、Flea、Blocks
- 多会话追踪，系统托盘常驻
- 窗口可拖动，始终置顶

## 安装

从 [Releases](../../releases) 下载最新安装包（`Claude.Detector.Setup.exe`）或便携版（`Claude.Detector.exe`），安装后启动即可。

应用会自动向 Claude Code 注册 hooks，无需额外配置。

## 使用

- **右键**宠物窗口打开菜单，可切换主题或查看会话详情
- **拖拽**宠物窗口移动位置
- 关闭窗口后应用继续在系统托盘运行，托盘图标右键可退出

## 开发

```bash
pnpm install
pnpm dev       # 开发模式
pnpm build     # 构建
pnpm dist      # 打包安装包
```

**技术栈**：Electron + electron-vite + React + TypeScript + Express

## 宠物状态

| 状态 | 触发时机 |
|------|---------|
| idle | 无活跃会话 |
| running | 处理 prompt / 使用工具 |
| permissionRequest | 等待用户授权 |
| taskCompleted | 任务完成（3 秒后回到 idle）|
