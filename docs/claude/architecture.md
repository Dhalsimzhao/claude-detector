# 架构详情

## 目录结构

```
src/
├── main/
│   ├── index.ts           # 应用入口，生命周期管理
│   ├── windowManager.ts   # 宠物窗口创建与管理（128×128，无边框、透明、置顶）
│   ├── sessionManager.ts  # 会话状态管理，优先级状态决策
│   ├── hookServer.ts      # Express 服务器，接收 hook 事件
│   ├── hookInstaller.ts   # 安装/卸载 Claude Code hooks
│   └── trayManager.ts     # 系统托盘图标与菜单
├── preload/
│   └── index.ts           # contextBridge IPC 桥接
├── renderer/src/
│   ├── App.tsx            # 根组件
│   ├── spriteConfig.ts    # 4 个主题的精灵图配置
│   ├── components/
│   │   ├── PetSprite.tsx  # Canvas 精灵渲染
│   │   ├── PetCanvas.tsx  # blocks 主题（Canvas 绘制）
│   │   ├── SessionBadge.tsx   # 多会话指示器
│   │   └── SessionPanel.tsx   # 会话详情弹窗
│   └── hooks/
│       └── useAnimationState.ts  # 动画帧逻辑
└── shared/
    └── types.ts           # 共享 TypeScript 接口
```

## IPC 通信

**主进程 → 渲染进程：**
- `session-update` — 会话更新（sessions 数组 + activePetState）
- `theme-change` — 主题切换
- `show-sessions` — 显示会话详情面板
- `drag-change` — 窗口拖拽状态

## 宠物主题

| 主题 | 类型 | 动画方式 |
|------|------|---------|
| psyduck | 多帧 | 逐帧动画 |
| sherma | 静态 | 呼吸动画（浮动+摆动+缩放+倾斜+阴影） |
| flea | 静态 | 呼吸动画 |
| blocks | Canvas 绘制 | 内置简易动画 |

## 宠物状态（PetState）

- `idle` — 无活跃会话
- `running` — 用户提交 prompt 或工具使用中
- `permissionRequest` — 等待用户授权
- `taskCompleted` — 任务完成（3 秒后回到 idle）
- `dragging` — 窗口被拖拽

## 本地配置

- `~/.claude-detector/config.json` — 主题偏好
- `~/.claude-detector/port` — 运行时服务器端口
- `~/.claude-detector/hook.js` — hook 脚本副本

## 构建与发布

- Electron Builder：NSIS 安装包 + 便携版
- GitHub Actions：tag 触发 → Windows 构建 → GitHub Release
- App ID：`com.dhalsimzhao.claude-detector`
