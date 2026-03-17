# 已知坑与注意事项

## 构建相关

- Windows CI 环境使用 pnpm 而非 npm，避免 npm 在 Windows 上的 CI bug
- `.npmrc` 必须指定官方 npm registry，否则 CI 可能使用错误的源
- electron-builder 需要 `--publish never` 防止自动发布

## 精灵图相关

- 精灵图为单行 PNG sprite sheet（从左到右排列帧）
- 静态精灵（1 帧）会自动添加呼吸动画效果，无需额外处理
- 旧版多 GIF 系统已废弃，统一使用 sprite sheet

## Hook 系统

- Hook 脚本需要复制到 `~/.claude-detector/hook.js`，不能直接引用项目内路径
- 端口号写入 `~/.claude-detector/port` 文件，hook 脚本从中读取
- 应用未运行时 hook 脚本需要静默退出，不能报错
