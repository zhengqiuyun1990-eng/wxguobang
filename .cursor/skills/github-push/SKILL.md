---
name: github-push-wxguobang
description: >-
  Commits and pushes the 过磅小程序 repo to GitHub (zhengqiuyun1990-eng/wxguobang)
  on Windows with local proxy. Use when the user says 推送到git, push git, 推送代码,
  提交并推送, git push, 同步到 GitHub, or asks to upload code without manual steps.
---

# GitHub 推送（过磅小程序）

**不要**让用户手动执行 git 命令。由 Agent 直接运行本 skill 的脚本或等价命令，完成后汇报结果。

## 仓库信息

| 项 | 值 |
|---|---|
| 项目目录 | `F:/VUE/过磅小程序` |
| 远程 | `https://github.com/zhengqiuyun1990-eng/wxguobang.git` |
| 默认分支 | `master` |
| GitHub CLI | `D:/Program Files/GitHub CLI/gh.exe`（可选，未登录不影响 push） |

## 执行方式（优先）

在 PowerShell 中运行（**一条命令**）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".cursor/skills/github-push/scripts/push.ps1"
```

工作目录必须是项目根 `F:\VUE\过磅小程序`。脚本会：

1. 探测本机代理端口（`7897` → `7890`），可用则写入 `git config --global http(s).proxy`
2. 设置 `http.sslBackend=schannel`、`http.version=HTTP/1.1`（仅当未设置时）
3. 确保 `origin` 指向上述远程 URL
4. 若有未提交变更：`git add -A` + 根据 diff 生成提交说明并 `git commit`
5. `git push -u origin master`（已跟踪则普通 `git push`）
6. 输出 `git status` 与最新 `git log -1`

## 代理失败时

1. 依次尝试端口 `7897`、`7890` 访问 `https://github.com`
2. 均失败：告知用户**先开启系统代理/VPN**，不要索要 GitHub 密码或 PAT
3. 用户若提供新端口：更新 `scripts/push.ps1` 中 `$ProxyPorts` 数组

## 提交身份

仓库已配置本地（非全局）作者，勿改全局 `user.*`：

- `user.name` = `zhengqiuyun1990-eng`
- `user.email` = `zhengqiuyun1990-eng@users.noreply.github.com`

## 认证

- HTTPS 推送使用 Windows **凭据管理器**中已保存的 GitHub 凭据（用户曾成功 push 过）
- **禁止**在对话中向用户索要密码或 token
- `gh auth login` 设备码流程在本机常卡住；推送不依赖 gh 登录

## 无变更时

仅执行 `git push`；向用户说明「已与远程同步，无需新提交」。

## 提交信息

有变更时由 Agent 根据 `git diff` 写 1～2 句中文或英文提交说明（focus why）。不要空提交。

## 完成后回复模板

```
已推送到 GitHub
- 仓库: https://github.com/zhengqiuyun1990-eng/wxguobang
- 分支: master
- 提交: <hash> <subject>
- 代理: 127.0.0.1:<port> 或 未使用代理
```

## 禁止

- 不要 `git push --force` 除非用户明确要求
- 不要修改 `git config` 全局 `user.name` / `user.email` 除非用户要求
- 不要提交 `.env`、token 文件；遵守 `.gitignore`
