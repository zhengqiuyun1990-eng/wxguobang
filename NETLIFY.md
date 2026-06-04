# Netlify 自动部署（方案 B）

推送代码到 GitHub 后，Netlify 自动执行 `npm ci && npm run build:h5`，发布 **H5 网页版**（不是微信小程序）。

## 一次性配置（Netlify 控制台）

1. 打开 [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. 选择 **GitHub** → 仓库 `zhengqiuyun1990-eng/wxguobang`
3. 构建设置（一般会自动读取 `netlify.toml`）：
   - **Build command**: `npm ci && npm run build:h5`
   - **Publish directory**: `dist/build/h5`
   - **Node version**: 20
4. 点击 **Deploy site**

之后每次 `git push` 到默认分支，Netlify 会自动重新构建、发布。

## 本地验证构建

```powershell
cd "F:\VUE\过磅小程序"
npm install
# Windows 推荐（避免中文路径下 node 复制异常）：
npm run build:h5:win
# macOS / Linux / Netlify：
npm run build:h5
```

成功后在 `dist/build/h5` 可看到 `index.html`。本地预览：

```powershell
npx serve dist/build/h5
```

## 环境变量（可选）

在 Netlify → Site settings → Environment variables 可覆盖：

| 变量 | 说明 | 默认（.env.production） |
|------|------|-------------------------|
| `VITE_API_BASE` | API 根路径 | `/api`（经 Netlify 转发） |
| `VITE_UPLOAD_BASE` | 图片 CDN | `https://wa15.shangyundian.cn/upload/` |

## 跨域说明

`netlify.toml` 已将 `/api/*` 代理到 `wa15.shangyundian.cn`，生产 H5 请求使用相对路径 `/api`，避免浏览器 CORS。图片上传仍走完整 `UPLOAD_BASE` 域名。

## 与 HBuilderX 的关系

- 日常开发可继续用 **HBuilderX** 运行、发行小程序
- **Netlify 仅部署 CLI 构建的 H5**（`npm run build:h5`）
- 不要依赖提交 `unpackage/`（已在 `.gitignore`）
