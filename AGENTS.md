# 过磅小程序 — Agent 项目记忆

> 供 Cursor / AI 助手快速理解本仓库。修改代码前请先读本文，再打开相关 `pages/` 与 `utils/` 文件。

## 项目概述

**过磅对账** 是一款基于 **uni-app（Vue 3）** 的跨端应用（微信小程序 / H5 / App），面向物流过磅场景：司机上传磅单、发货/收货过磅人双向验票、自动核算损耗、项目负责人打印对账单并按比例计件分润。

- 应用名：`过磅小程序`（`manifest.json`）
- 主色：`#4ADE80`（导航栏、Tab、主按钮）
- 开发工具：**HBuilderX 3.1+**（非独立 `package.json` 的 Vite CLI 工程）
- 构建产物：`unpackage/`（勿手改，勿提交无必要变更）

## 技术栈

| 项 | 说明 |
|---|---|
| 框架 | uni-app + Vue 3（`manifest.json` → `vueVersion: "3"`） |
| 入口 | `main.js` → `createSSRApp` |
| 路由 | `pages.json`（无 vue-router） |
| 样式 | `lang="scss"` + `@/uni_modules/uni-scss` |
| UI 组件 | `uni_modules` 下官方组件（easycom 自动引入） |
| 状态 | **无 Pinia/Vuex**；`utils/store.js` + `uni.storage` |
| 网络 | `utils/request.js` → `https://wa15.shangyundian.cn/api` |

## 目录结构（业务相关）

```
过磅小程序/
├── App.vue                 # 全局样式、生命周期
├── main.js
├── pages.json              # 页面路由、TabBar
├── manifest.json
├── pages/
│   ├── index/              # 首页（自定义导航 + 统计）
│   ├── auth/login          # 手机号登录（演示验证码）
│   ├── project/            # 创建项目 4 步向导
│   ├── driver/             # 司机：搜项目、上传、缴费
│   ├── join/               # 加入项目 / 工作台
│   ├── verify/             # 过磅人验票
│   ├── print/              # 对账单打印
│   └── mine/               # 我的、项目、申请、评分等
├── utils/
│   ├── store.js            # 本地 DB + draft + requireLogin
│   ├── request.js          # http + api + 上传
│   ├── vehicles.js         # 车牌本地列表
│   └── qrcode.js           # Canvas 二维码绘制
├── static/                 # tabbar 图标等
└── uni_modules/            # 第三方 uni 组件（少改）
```

## 架构：本地存储 + 远端 API 双轨

当前为 **渐进式对接**：核心演示与用户会话走本地；部分流程已接真实后端。

### 本地层（`utils/store.js`）

Storage 键前缀 `gb_*`：

| 键 | 内容 |
|---|---|
| `gb_user` | 当前登录用户 |
| `gb_users` | 全部用户 |
| `gb_projects` | 项目列表 |
| `gb_bills` | 磅单 |
| `gb_applications` | 加入项目申请 |
| `gb_seq` | 项目编号自增（从 80000 起，显示为 `00` + n） |

导出：

- `db` — CRUD 与查询（`billsOfProject`、`appsForOwner` 等）
- `draft` — 创建项目跨页草稿（`create` → `spec` → `fee` → `allocate`）
- `requireLogin()` — 未登录 `navigateTo` 登录页
- `rateByScore(score)` — 星级与单价系数（计件展示用）

### 远端层（`utils/request.js`）

- `BASE_URL` / `UPLOAD_BASE` — 固定域名，改环境时只改此文件
- `http.get/post/...` — 统一 `code === 0|200` 判成功
- `uploadFile(filePath)` — 字段名 `thumb`，返回相对路径，用 `imgUrl()` 拼完整 URL
- `api` 已封装：`getSites`、`createProject`、`myProjects`、`projectInfo`、`updateHairInfo`、`updateReceiveInfo`

### 典型数据流

1. **创建项目**：`allocate.vue` 调 `api.createProject` → 成功写入 `db.createProject`（含 `remoteId`）→ `done.vue` 画二维码 `project_id={no}`
2. **司机上传**：`upload.vue` 用 `project_id` 调 `api.projectInfo`；提交走 `updateHairInfo` / `updateReceiveInfo` + 可选 `uploadFile`
3. **验票 / 申请 / 计件**：多数仅 `db`（`verify/*`、`join/*`、`mine/*`）
4. **打印对账单**：`print/*` 混合 `api.myProjects` / `api.projectInfo` 与本地 `db.bills`

新增接口时：在 `request.js` 的 `api` 对象追加，页面只 `import { api } from '@/utils/request.js'`。

## 业务流程（产品逻辑）

首页 `index.vue` 已写明六步，摘要：

1. 司机装货过磅：拍照 + 毛/皮/净重，缴费（默认 10 元/单，项目可配 5–50 或 0 免费）
2. 发货过磅人核对，标记「已对账」
3. 司机卸货过磅并上传收货磅单
4. 收货过磅人核对
5. 双向验票完成后系统算损耗，生成对账数据
6. 负责人打印对账单；参与人按 `allocate` 比例计件

**角色**：项目负责人、发货过磅人、收货过磅人、司机。

**二维码**：内容为 `project_id=<编号>`；首页/司机页 `scanCode` 解析后跳转 `pages/driver/upload`。

## 页面与路由速查

| 模块 | 路径 | 说明 |
|---|---|---|
| Tab | `pages/index/index`, `pages/mine/mine` | 需登录的功能用 `requireLogin` |
| 登录 | `pages/auth/login` | 任意 6 位验证码；`db.loginByPhone` |
| 建项 | `project/create` → `spec` → `fee` → `allocate` → `done` | 使用 `draft.project` |
| 司机 | `driver/search`, `upload`, `pay`, `project` | `project_id` 查询参数 |
| 加入 | `join/join`, `apply`, `joined`, `joinedDetail` | 申请存 `gb_applications` |
| 验票 | `verify/list`, `detail`, `verified` | `role=ship|recv`，改 `db` 磅单与用户 score |
| 打印 | `print/print`, `detail` | 负责人权限在页面内判断 |
| 我的 | `mine/projects`, `projectDetail`, `applications`, `score`, `piecework`, `vehicles`, `service` | |

完整列表以 `pages.json` 为准。

## 领域模型（本地 JSON 形状）

**User**：`id`, `phone`, `nickname`, `plate`, `score`（初始 2000≈2 星）, `totalPiece`, `createdAt`

**Project**：`id`, `remoteId`, `no`, `name`, `shipperCompany`, `receiverCompany`, `driverFee`, `ownerId`, `shippers[]`, `receivers[]`, `owners[]`, `specs[]`, `allocate: { ship, recv, owner }`（百分比，合计 ≤100）

**Bill**：关联 `projectId`；含毛/皮/净重、图片、车牌；`shipVerified` / `recvVerified`；`paid` 等

**Application**：`projectId`, `userId`, `role`, `status`（`pending` / `approved` / `rejected`）

**车辆**：`utils/vehicles.js`，键 `account_vehicles`，最多 100 条，与登录用户无强绑定。

## 编码约定

- 路径别名：`@/` 指向项目根（如 `@/utils/store.js`）
- 页面为 **Options API**（`export default { data, methods, onLoad }`），保持风格一致
- 登录守卫：需要登录的入口调用 `requireLogin()`，不要重复造轮子
- 金额/重量：表单用 `v-model.number`；展示用 `toFixed` 注意空值
- 跳转：`uni.navigateTo` / `redirectTo` / `switchTab`（Tab 仅首页、我的）
- 提示：`uni.showToast` / `uni.showModal` / `uni.showLoading`
- 样式：rpx 为主；主色绿系与首页 hero 保持一致
- **不要**在业务页直接写 `uni.request`，走 `request.js`
- **不要**大规模修改 `uni_modules/` 与 `unpackage/`

## 演示与测试

- 登录：11 位手机号 + 任意 6 位验证码
- 无后端时：建项 API 失败会 toast；验票/申请等纯本地仍可用
- 微信 `mp-weixin.appid` 在 `manifest.json` 为空，发布前需填写
- 首页统计来自 `db.allProjects()` / `allBills()`，非实时服务端

## 常见改动指引

| 需求 | 优先修改 |
|---|---|
| 新页面 | `pages.json` + `pages/.../*.vue` |
| 新后端接口 | `utils/request.js` → `api` |
| 登录/用户字段 | `store.js` → `loginByPhone` / `updateUser` |
| 建项表单字段 | `draft.reset()` 默认值 + `project/create` 等向导页 + `allocate` 的 `payload` |
| 司机上传字段 | `driver/upload.vue` + `updateHairInfo`/`updateReceiveInfo` payload |
| 分润规则 | `allocate` 默认值、`verify/detail` 计分、`rateByScore` |
| 换 API 域名 | `request.js` 顶部 `BASE_URL` / `UPLOAD_BASE` |

## 环境说明（Windows）

- 使用 **HBuilderX** 打开本项目目录运行/发行
- 命令行构建若存在，输出在 `unpackage/dist/`
- 用户系统为 Windows；路径含中文「过磅小程序」时注意终端编码

## 已知注意点

- 项目编号：远端返回 `id` 时 `no` 可能为远端 ID；二维码与司机入口使用 `project_id=` 该编号
- `print.vue` 同时拉远端 `myProjects` 与本地 `ownerId` 过滤，列表可能不完全一致
- `driver/pay.vue` 在 API 成功后仍会 `db.addBill` 做本地演示闭环
- 全局无 TypeScript；保持 JS 简洁即可

---

*最后更新：基于仓库现状整理，随 API 全量对接请同步更新「架构」与「页面」两节。*
