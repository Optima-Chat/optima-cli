# Optima CLI 技术方案文档

> **版本**: 1.0.0
> **创建日期**: 2025-10-17
> **作者**: Optima Commerce Team
> **状态**: Draft

## 目录

- [项目概述](#项目概述)
- [核心目标](#核心目标)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [API 集成方案](#api-集成方案)
- [命令设计](#命令设计)
- [认证授权方案](#认证授权方案)
- [文件上传方案](#文件上传方案)
- [数据格式与展示](#数据格式与展示)
- [错误处理](#错误处理)
- [配置管理](#配置管理)
- [Claude Code 集成](#claude-code-集成)
- [开发计划](#开发计划)
- [部署发布](#部署发布)
- [附录](#附录)

---

## 项目概述

### 背景

Optima Commerce 是一个 AI 驱动的对话式电商平台，目前提供以下用户界面：
- **Agentic Chat**: 卖家对话界面 (https://ai.optima.chat)
- **Optima Store**: 买家购物前端 (https://go.optima.shop)
- **Admin Panel**: 管理后台 (https://admin.optima.chat)

为了提升开发者体验和自动化能力，我们需要提供一个 **CLI 工具**，使开发者和商家能够：
1. 通过命令行快速管理店铺
2. 在 Claude Code 中通过自然语言操作电商功能
3. 支持脚本化和自动化工作流
4. 提供开发和调试工具

### 定位

**Optima CLI** 是 Optima Commerce 生态的命令行入口，涵盖电商全流程功能：

**核心电商功能**：
- 商品管理（分类、变体、图片、视频）
- 订单处理（创建、发货、退款）
- 库存控制
- 物流追踪（固定运费、Easyship 集成）
- 店铺配置（商户资料、Banner）
- 对话管理（商家-客户聊天）
- 支付账号（Stripe Connect）

**高级功能**：
- Google Ads 广告管理（通过 Google Ads MCP）
- AI 图像生成（通过 Comfy MCP）
- 批量导入导出（CSV/JSON）
- 多语言翻译（商户/商品/分类）
- 转账记录查询
- 用户认证（OAuth 2.0）

### 参考项目

- **cc-chat CLI**: Optima Chat 社区的 CLI 工具 (https://github.com/Optima-Chat/cc-chat)
  - 提供了基础的 CLI 架构参考
  - 命令设计和用户体验参考
  - Claude Code 集成方案参考

---

## 核心目标

### 功能目标

1. **完整的电商操作能力**
   - 覆盖 Commerce Backend 的所有核心 API
   - 支持商品、订单、库存、物流全流程

2. **优秀的用户体验**
   - 交互式命令引导
   - 友好的错误提示
   - 美观的数据展示
   - 智能的默认值

3. **Claude Code 原生集成**
   - 一键配置 CLAUDE.md
   - 自然语言命令映射
   - 提供使用示例

4. **开发者友好**
   - 支持脚本化调用
   - 提供详细的 --help 文档
   - 支持配置文件

### 非功能目标

1. **性能**
   - 命令响应时间 < 2s
   - 支持并发请求
   - 本地缓存优化

2. **可靠性**
   - 完善的错误处理
   - 网络重试机制
   - 数据验证

3. **安全性**
   - Token 安全存储
   - 敏感信息加密
   - API Key 管理

4. **可维护性**
   - TypeScript 类型安全
   - 模块化架构
   - 完整的测试覆盖

---

## 技术栈

### 核心依赖

#### Phase 1-2: 基础电商功能

| 依赖 | 版本 | 用途 |
|-----|------|------|
| **commander** | ^12.0.0 | CLI 框架，命令解析 |
| **axios** | ^1.6.5 | HTTP 客户端，API 请求 |
| **chalk** | ^5.3.0 | 终端颜色美化 |
| **inquirer** | ^9.2.14 | 交互式输入 |
| **conf** | ^12.0.0 | 配置存储 |
| **ora** | ^8.0.0 | 加载动画 |
| **open** | ^10.0.0 | 自动打开浏览器 |
| **cli-table3** | ^0.6.3 | 表格展示 |
| **form-data** | ^4.0.0 | 文件上传 |
| **dayjs** | ^1.11.10 | 日期格式化 |

#### Phase 3: MCP 集成

| 依赖 | 版本 | 用途 |
|-----|------|------|
| **eventsource** | ^2.0.2 | SSE 客户端，MCP 通信 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|-----|------|------|
| **typescript** | ^5.3.3 | TypeScript 编译 |
| **tsx** | ^4.7.0 | 开发时运行 TS |
| **@types/node** | ^20.11.5 | Node 类型定义 |
| **@types/inquirer** | ^9.0.7 | Inquirer 类型定义 |
| **vitest** | ^1.0.0 | 单元测试 |
| **eslint** | ^8.56.0 | 代码规范 |
| **prettier** | ^3.1.1 | 代码格式化 |

### 运行环境

- **Node.js**: >= 18.0.0
- **NPM**: >= 9.0.0

---

## 系统架构

### 整体架构

采用**混合架构**：基础电商功能直接调用 REST API，高级功能通过 MCP Servers。

```
┌─────────────────────────────────────────────────────────┐
│                    Optima CLI                           │
│            (@optima-chat/optima-cli)                    │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬────────────────┐
        │                │                │                │
        │ REST API       │ REST API       │ MCP Protocol   │ MCP Protocol
        ▼                ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Commerce API │  │  Auth API    │  │ Google Ads   │  │  Comfy MCP   │
│ api.optima   │  │ auth.optima  │  │     MCP      │  │ Image Gen    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
        │                │
        └────────┬───────┘
                 ▼
        ┌──────────────┐
        │  PostgreSQL  │
        │  MinIO/S3    │
        │  Redis       │
        └──────────────┘
```

**架构说明**：
- **Phase 1 (MVP)**: 商品、订单、库存、物流、店铺管理 → 直接调用 REST API
- **Phase 2+**: Google Ads 广告管理 → Google Ads MCP (SSE)
- **Phase 2+**: 图像生成 → Comfy MCP (SSE)
- **暂不实现**: Shopify 集成

### 目录结构

```
@optima-chat/optima-cli/
├── src/
│   ├── api/                      # API 客户端层
│   │   ├── rest/                 # REST API 客户端
│   │   │   ├── client.ts         # 基础 HTTP 客户端
│   │   │   ├── commerce.ts       # Commerce Backend API
│   │   │   └── auth.ts           # User Auth API
│   │   ├── mcp/                  # MCP 客户端 (Phase 2+)
│   │   │   ├── client.ts         # MCP SSE 客户端
│   │   │   ├── google-ads.ts     # Google Ads MCP
│   │   │   └── comfy.ts          # Comfy MCP
│   │   └── types.ts              # API 类型定义
│   ├── commands/                 # 命令实现
│   │   ├── auth/                 # 认证命令 (Phase 1)
│   │   │   ├── login.ts          # Device Flow 登录
│   │   │   ├── logout.ts         # 登出
│   │   │   └── whoami.ts         # 当前用户
│   │   ├── product/              # 商品管理 (Phase 1)
│   │   │   ├── create.ts         # 创建商品
│   │   │   ├── list.ts           # 商品列表
│   │   │   ├── get.ts            # 商品详情
│   │   │   ├── update.ts         # 更新商品
│   │   │   ├── delete.ts         # 删除商品
│   │   │   └── images.ts         # 图片管理
│   │   ├── order/                # 订单管理 (Phase 1)
│   │   │   ├── list.ts           # 订单列表
│   │   │   ├── get.ts            # 订单详情
│   │   │   ├── ship.ts           # 发货
│   │   │   ├── complete.ts       # 完成订单
│   │   │   └── cancel.ts         # 取消订单
│   │   ├── inventory/            # 库存管理 (Phase 1)
│   │   │   ├── low-stock.ts      # 低库存
│   │   │   ├── update.ts         # 更新库存
│   │   │   └── history.ts        # 库存历史
│   │   ├── shipping/             # 物流管理 (Phase 1)
│   │   │   ├── calculate.ts      # 计算运费
│   │   │   ├── create.ts         # 创建运单
│   │   │   └── track.ts          # 物流跟踪
│   │   ├── shop/                 # 店铺管理 (Phase 1)
│   │   │   ├── info.ts           # 店铺信息
│   │   │   ├── update.ts         # 更新店铺
│   │   │   └── setup.ts          # 设置店铺
│   │   ├── ads/                  # Google Ads 管理 (Phase 2+)
│   │   │   ├── create-campaign.ts
│   │   │   ├── list-campaigns.ts
│   │   │   ├── research-keywords.ts
│   │   │   └── performance.ts
│   │   ├── image/                # 图像生成 (Phase 2+)
│   │   │   ├── generate.ts       # 文本生成图片
│   │   │   └── transform.ts      # 图片转换
│   │   └── setup-claude.ts       # Claude Code 配置
│   ├── utils/                    # 工具函数
│   │   ├── config.ts             # 配置管理
│   │   ├── format.ts             # 格式化输出
│   │   ├── validation.ts         # 数据验证
│   │   ├── logger.ts             # 日志
│   │   └── error.ts              # 错误处理
│   ├── types/                    # 类型定义
│   │   ├── api.ts                # API 类型
│   │   ├── config.ts             # 配置类型
│   │   └── commands.ts           # 命令类型
│   ├── constants/                # 常量定义
│   │   └── index.ts              # 常量
│   └── index.ts                  # 主入口
├── tests/                        # 测试文件
│   ├── unit/                     # 单元测试
│   └── integration/              # 集成测试
├── docs/                         # 文档
│   ├── TECHNICAL_DESIGN.md       # 技术方案（本文档）
│   ├── API.md                    # API 文档
│   └── COMMANDS.md               # 命令参考
├── package.json                  # 项目配置
├── tsconfig.json                 # TypeScript 配置
├── .eslintrc.json                # ESLint 配置
├── .prettierrc                   # Prettier 配置
└── README.md                     # 项目说明
```

### 模块职责

#### 1. API 客户端层 (`src/api/`)
- 封装所有后端 API 调用
- 统一的错误处理
- 请求/响应拦截器
- Token 管理和刷新

#### 2. 命令层 (`src/commands/`)
- 实现具体命令逻辑
- 用户交互处理
- 参数验证
- 结果格式化

#### 3. 工具层 (`src/utils/`)
- 配置管理
- 日志记录
- 数据验证
- 通用工具函数

#### 4. 类型层 (`src/types/`)
- TypeScript 类型定义
- API 接口类型
- 配置类型

---

## API 集成方案

### API 服务列表

#### Phase 1 - REST API

| 服务 | 地址 | 协议 | 用途 |
|-----|------|------|------|
| **Commerce Backend** | https://api.optima.chat | REST | 电商核心 API |
| **User Auth** | https://auth.optima.chat | REST | 认证授权 |

#### Phase 2+ - MCP Servers

| 服务 | 地址 | 协议 | 用途 |
|-----|------|------|------|
| **Google Ads MCP** | http://dev.optima.chat:8240/sse | SSE | Google 广告管理 |
| **Comfy MCP** | http://dev.optima.chat:8220/sse | SSE | AI 图像生成 |

**注意**：MCP 服务使用 SSE (Server-Sent Events) 协议，需要实现专门的 MCP 客户端。

### 基础 HTTP 客户端

**实现位置**：`src/api/rest/client.ts`

**核心功能**：
- 基于 Axios 封装统一的 HTTP 客户端类 `ApiClient`
- 支持 GET、POST、PUT、DELETE、UPLOAD 等常用方法
- 默认超时 30 秒，Content-Type 为 application/json

**请求拦截器**：
- 自动从配置中读取 Token
- 自动添加 `Authorization: Bearer <token>` 请求头

**响应拦截器**：
- 捕获 401 错误，自动调用 `/auth/refresh` 刷新 Token
- Token 刷新成功后重试原请求
- 刷新失败则清除认证信息，提示用户重新登录
- 统一处理 API 错误，包装为 `ApiError` 类型

**客户端实例**：
- `commerceClient`: 连接 https://api.optima.chat
- `authClient`: 连接 https://auth.optima.chat

### Commerce API 封装

**实现位置**：`src/api/rest/commerce.ts`

基于 `commerceClient` 封装电商业务 API，采用对象分组的方式组织：

**商品管理 (products)**：
- `create` - POST /api/products - 创建商品（支持简单商品和变体商品）
- `list` - GET /api/products - 商品列表（支持分页和高级过滤）
- `get` - GET /api/products/{product_id} - 商品详情
- `update` - PUT /api/products/{product_id} - 更新商品
- `delete` - DELETE /api/products/{product_id} - 软删除商品

**订单管理 (orders)**：
- `list` - GET /api/orders/merchant - 商户订单列表（支持过滤）
- `get` - GET /api/orders/merchant/{order_id} - 订单详情
- `ship` - POST /api/orders/merchant/{order_id}/ship - 标记订单已发货
- `complete` - POST /api/orders/merchant/{order_id}/complete - 完成订单
- `cancel` - POST /api/orders/merchant/{order_id}/cancel - 取消订单
- `markDelivered` - POST /api/orders/merchant/{order_id}/mark-delivered - 标记已送达

**库存管理 (inventory)**：
- `getLowStock` - GET /api/inventory/low-stock - 获取低库存商品
- `updateStock` - PUT /api/inventory/products/{product_id}/stock - 调整商品库存
- `getHistory` - GET /api/inventory/products/{product_id}/history - 查看库存变更历史
- `reserveStock` - POST /api/inventory/products/{product_id}/reserve - 预留库存（购物车功能）

**商户管理 (merchant)**：
- `getProfile` - GET /api/merchants/me - 获取当前商户信息
- `updateProfile` - PUT /api/merchants/me - 更新商户资料
- `setupProfile` - POST /api/merchants/me - 初始化 OAuth 用户的商户资料

**物流管理 (shipping)**：
- `updateShippingStatus` - POST /api/orders/merchant/{order_id}/update-shipping-status - 更新物流状态
- `getShippingHistory` - GET /api/orders/merchant/{order_id}/shipping-history - 获取物流历史
- `addShippingNote` - POST /api/orders/merchant/{order_id}/add-shipping-note - 添加物流备注
- `listCountries` - GET /api/shipping/countries - 获取支持的国家列表
- `getMode` - GET /api/shipping/mode - 获取当前物流模式（fixed/easyship）
- `setMode` - POST /api/shipping/mode - 切换物流模式

**固定运费配置 (shipping-fixed)**：
- `getConfig` - GET /api/shipping/fixed/config - 获取固定运费全局配置
- `updateConfig` - POST /api/shipping/fixed/config - 更新全局配置
- `calculate` - POST /api/shipping/fixed/calculate - 计算订单运费
- `listZones` - GET /api/shipping/fixed/zones - 获取运费区域列表
- `createZone` - POST /api/shipping/fixed/zones - 创建运费区域
- `getZone` - GET /api/shipping/fixed/zones/{zone_id} - 获取运费区域详情
- `updateZone` - PUT /api/shipping/fixed/zones/{zone_id} - 更新运费区域
- `deleteZone` - DELETE /api/shipping/fixed/zones/{zone_id} - 删除运费区域
- `listRates` - GET /api/shipping/fixed/zones/{zone_id}/rates - 获取区域运费费率
- `createRate` - POST /api/shipping/fixed/zones/{zone_id}/rates - 创建运费费率
- `updateRate` - PUT /api/shipping/fixed/zones/{zone_id}/rates/{rate_id} - 更新运费费率
- `deleteRate` - DELETE /api/shipping/fixed/zones/{zone_id}/rates/{rate_id} - 删除运费费率

**对话管理 (conversations)**：
- `list` - GET /api/conversations - 获取对话列表（商户收件箱）
- `get` - GET /api/conversations/{conversation_id} - 获取对话详情
- `getContext` - GET /api/conversations/{conversation_id}/context - 获取对话上下文
- `listMessages` - GET /api/conversations/{conversation_id}/messages - 获取对话消息列表
- `markRead` - POST /api/conversations/{conversation_id}/messages/mark-read - 标记消息已读

**分类管理 (categories)**：
- `list` - GET /api/categories - 获取分类列表
- `create` - POST /api/categories - 创建分类
- `get` - GET /api/categories/{category_id} - 获取分类详情
- `update` - PUT /api/categories/{category_id} - 更新分类
- `delete` - DELETE /api/categories/{category_id} - 删除分类

**商品变体 (variants)**：
- `list` - GET /api/products/{product_id}/variants - 获取商品变体列表
- `search` - POST /api/products/{product_id}/variants/search - 搜索商品变体
- `create` - POST /api/products/{product_id}/variants - 创建商品变体
- `get` - GET /api/products/{product_id}/variants/{variant_id} - 获取变体详情
- `update` - PUT /api/products/{product_id}/variants/{variant_id} - 更新变体
- `delete` - DELETE /api/products/{product_id}/variants/{variant_id} - 删除变体
- `addImages` - POST /api/products/{master_id}/variants/{variant_id}/images - 添加变体图片

**商品增强功能 (product-enhancements)**：
- `addVideo` - POST /api/products/{product_id}/videos - 添加商品视频
- `listVideos` - GET /api/products/{product_id}/videos - 获取视频列表
- `deleteVideo` - DELETE /api/products/{product_id}/videos/{video_id} - 删除视频
- `listAttributes` - GET /api/products/{product_id}/attributes - 获取商品属性
- `updateAttributes` - POST /api/products/{product_id}/attributes - 更新商品属性
- `getGlobalAttributes` - GET /api/products/attributes - 获取全局属性模板
- `reorderImages` - POST /api/products/{product_id}/images/reorder - 调整图片顺序
- `getSummary` - GET /api/products/{product_id}/summary - 获取商品摘要信息

**退款管理 (refunds)**：
- `create` - POST /api/refunds/create - 创建退款
- `get` - GET /api/refunds/{refund_id} - 获取退款详情

**Stripe Connect (支付账号)**：
- `createExpressAccount` - POST /api/merchants/connect/create-express - 创建 Stripe Express 账号
- `refreshExpressAccount` - POST /api/merchants/connect/express-refresh - 刷新 Stripe Express 账号信息
- `getStatus` - GET /api/merchants/connect/status - 获取连接状态
- `getDashboardLink` - GET /api/merchants/connect/dashboard-link - 获取 Stripe 仪表板链接
- `getAccountLink` - GET /api/merchants/connect/account-link - 获取账号设置链接
- `getOAuthLink` - GET /api/merchants/connect/oauth-link - 获取 Stripe OAuth 授权链接
- `handleCallback` - GET /api/merchants/connect/callback - 处理 Stripe 回调（内部使用）
- `disconnect` - POST /api/merchants/connect/disconnect - 断开 Stripe 连接

**文件上传 (upload)**：
- `uploadImage` - POST /api/upload/image - 上传图片
- `uploadVideo` - POST /api/upload/video - 上传视频
- `uploadFile` - POST /api/upload/file - 上传文件

**批量导入导出 (import-export)**：
- `importProducts` - POST /api/products/imports - 批量导入商品（支持 CSV/JSON）
- `getImportStatus` - GET /api/products/imports/{task_id}/status - 查看导入任务状态
- `exportProducts` - POST /api/products/exports - 批量导出商品
- `getExportStatus` - GET /api/products/exports/{task_id}/status - 查看导出任务状态
- `downloadExport` - GET /api/products/exports/{task_id}/download - 下载导出文件

**商户 Banner 管理 (banners)**：
- `listBanners` - GET /api/merchants/me/banners - 获取 Banner 列表
- `createBanner` - POST /api/merchants/me/banners - 创建 Banner
- `getBanner` - GET /api/merchants/me/banners/{banner_id} - 获取 Banner 详情
- `updateBanner` - PUT /api/merchants/me/banners/{banner_id} - 更新 Banner
- `deleteBanner` - DELETE /api/merchants/me/banners/{banner_id} - 删除 Banner
- `reorderBanners` - POST /api/merchants/me/banners/reorder - 调整 Banner 顺序

**Easyship 物流集成 (easyship)**：
- `getConfig` - GET /api/shipping/easyship/config - 获取 Easyship 配置
- `updateConfig` - POST /api/shipping/easyship/config - 更新 Easyship 配置
- `validateConfig` - POST /api/shipping/easyship/config/validate - 验证配置
- `getOrigin` - GET /api/shipping/easyship/origin - 获取发货地址
- `updateOrigin` - POST /api/shipping/easyship/origin - 更新发货地址
- `validateOrigin` - POST /api/shipping/easyship/origin/validate - 验证发货地址
- `getRates` - POST /api/shipping/easyship/rates - 计算运费
- `createShipment` - POST /api/shipping/easyship/shipments - 创建运单
- `validateAddress` - POST /api/shipping/easyship/validate-address - 验证收货地址
- `listCountries` - GET /api/shipping/easyship/countries - 获取支持国家列表
- `listCouriers` - GET /api/shipping/easyship/couriers - 获取快递公司列表

**转账记录 (transfers)**：
- `listTransfers` - GET /api/transfers/merchant - 获取转账记录列表
- `getSummary` - GET /api/transfers/merchant/summary - 获取转账汇总

**多语言翻译 (i18n)**：
- `listLanguages` - GET /api/languages - 获取系统支持的语言列表

**商户多语言 (merchant-i18n)**：
- `getMerchantI18n` - GET /api/merchants/me/i18n - 获取商户多语言配置
- `listMerchantTranslations` - GET /api/merchants/me/translations - 获取商户所有翻译
- `getMerchantTranslation` - GET /api/merchants/me/translations/{language_code} - 获取特定语言翻译
- `createMerchantTranslation` - POST /api/merchants/me/translations - 创建/更新商户翻译
- `updateMerchantTranslation` - PUT /api/merchants/me/translations/{language_code} - 更新特定语言翻译
- `deleteMerchantTranslation` - DELETE /api/merchants/me/translations/{language_code} - 删除特定语言翻译

**商品多语言 (product-i18n)**：
- `getProductsI18n` - GET /api/products/i18n - 获取商品多语言列表信息
- `getProductI18n` - GET /api/products/{product_id}/i18n - 获取商品多语言配置
- `listProductTranslations` - GET /api/products/{product_id}/translations - 获取商品所有翻译
- `getProductTranslation` - GET /api/products/{product_id}/translations/{language_code} - 获取特定语言翻译
- `createProductTranslation` - POST /api/products/{product_id}/translations - 创建/更新商品翻译
- `updateProductTranslation` - PUT /api/products/{product_id}/translations/{language_code} - 更新特定语言翻译
- `deleteProductTranslation` - DELETE /api/products/{product_id}/translations/{language_code} - 删除特定语言翻译

**分类多语言 (category-i18n)**：
- `getCategoriesI18n` - GET /api/categories/i18n - 获取分类多语言列表信息
- `listCategoryTranslations` - GET /api/categories/{category_id}/translations - 获取分类所有翻译
- `getCategoryTranslation` - GET /api/categories/{category_id}/translations/{language_code} - 获取特定语言翻译
- `createCategoryTranslation` - POST /api/categories/{category_id}/translations - 创建/更新分类翻译
- `updateCategoryTranslation` - PUT /api/categories/{category_id}/translations/{language_code} - 更新特定语言翻译
- `deleteCategoryTranslation` - DELETE /api/categories/{category_id}/translations/{language_code} - 删除特定语言翻译

### Auth API 封装

**实现位置**：`src/api/rest/auth.ts`

基于 `authClient` 封装认证相关 API，使用 **OAuth 2.0 Device Flow** 进行认证：

**Device Flow 认证**：
- `requestDeviceCode` - POST /api/v1/oauth/device/authorize - 请求 device code 和 user code
- `pollDeviceToken` - POST /api/v1/oauth/device/token - 轮询获取 access token
- `logout` - POST /api/v1/oauth/revoke - 登出（撤销 token）

**用户信息**：
- `getCurrentUser` - GET /api/v1/users/me - 获取当前用户信息

**说明**：
- **Device Flow**：CLI 获取 device code，用户在浏览器完成授权，CLI 轮询获取 token
- **统一体验**：所有登录方式（邮箱/Google/GitHub）都在浏览器完成，体验一致
- **自动注册**：首次登录自动创建商户账号，无需单独注册流程
- **安全可靠**：符合 OAuth 2.0 标准，适合 CLI 工具使用
- Token 自动存储到本地配置文件

**详细技术方案**：参见 [docs/DEVICE_FLOW_DESIGN.md](./DEVICE_FLOW_DESIGN.md)

### MCP 客户端封装 (Phase 3)

**实现位置**：`src/api/mcp/client.ts`

MCP (Model Context Protocol) 使用 SSE (Server-Sent Events) 协议进行通信。

**核心功能**：
- `MCPClient` 类：封装 MCP 协议通信
- `callTool(toolName, args)` - 调用 MCP 工具（POST /call_tool）
- `listTools()` - 列出可用工具（GET /tools）
- `disconnect()` - 关闭 SSE 连接

**响应处理**：
- 解析 MCP 响应的 `content` 数组
- 自动尝试 JSON 解析 text 内容
- 返回结构化数据或原始文本

**客户端实例**：
- `googleAdsMcp` - 连接 http://dev.optima.chat:8240/sse
- `comfyMcp` - 连接 http://dev.optima.chat:8220/sse

**依赖**：需要安装 `eventsource` 包

### Google Ads MCP 封装

**实现位置**：`src/api/mcp/google-ads.ts`

基于 `googleAdsMcp` 封装 Google Ads 广告管理功能：

**广告活动管理 (campaigns)**：
- `create` - 创建广告活动（create_campaign）
- `list` - 广告活动列表（get_campaigns）
- `getPerformance` - 活动效果数据（get_campaign_performance）

**关键词管理 (keywords)**：
- `research` - 关键词研究（research_keywords）
- `add` - 添加关键词到活动（add_keywords）

### Comfy MCP 封装

**实现位置**：`src/api/mcp/comfy.ts`

基于 `comfyMcp` 封装 AI 图像生成功能：

- `generateImage` - 文本生成图片（create_image_from_prompt）
  - 参数：prompt, width, height, steps
- `transformImage` - 图片转换（create_image_to_image）
  - 参数：imageUrl, prompt

---

## 命令设计

### 命令分组

```
optima
├── auth                    # 认证管理 (Phase 1)
│   ├── login              # Device Flow 登录（在浏览器完成授权）
│   ├── logout             # 登出
│   └── whoami             # 当前用户
├── product                # 商品管理 (Phase 1)
│   ├── create             # 创建商品
│   ├── list               # 商品列表
│   ├── get <id>           # 商品详情
│   ├── update <id>        # 更新商品
│   ├── delete <id>        # 删除商品
│   └── add-images <id>    # 添加图片
├── order                  # 订单管理 (Phase 1)
│   ├── list               # 订单列表
│   ├── get <id>           # 订单详情
│   ├── ship <id>          # 发货
│   ├── complete <id>      # 完成订单
│   └── cancel <id>        # 取消订单
├── inventory              # 库存管理 (Phase 1)
│   ├── low-stock          # 低库存商品
│   ├── update <id>        # 更新库存
│   └── history <id>       # 库存历史
├── merchant               # 商户管理 (Phase 1)
│   ├── info               # 获取商户信息
│   ├── update             # 更新商户资料
│   └── setup              # 初始化商户资料（OAuth 用户）
├── shipping               # 物流管理 (Phase 1)
│   ├── calculate          # 计算运费
│   ├── status <order-id>  # 查看物流状态
│   ├── update-status <order-id>  # 更新物流状态
│   ├── history <order-id> # 物流历史
│   ├── add-note <order-id> # 添加物流备注
│   ├── zones              # 运费区域管理
│   │   ├── list           # 列出所有运费区域
│   │   ├── create         # 创建运费区域
│   │   ├── get <zone-id>  # 获取区域详情
│   │   ├── update <zone-id> # 更新运费区域
│   │   └── delete <zone-id> # 删除运费区域
│   └── rates              # 运费费率管理
│       ├── list <zone-id> # 列出区域费率
│       ├── create <zone-id> # 创建费率
│       ├── update <zone-id> <rate-id> # 更新费率
│       └── delete <zone-id> <rate-id> # 删除费率
├── inbox                  # 收件箱管理 (Phase 2)
│   ├── list               # 对话列表
│   ├── get <id>           # 对话详情
│   ├── messages <id>      # 查看消息
│   └── mark-read <id>     # 标记已读
├── category               # 分类管理 (Phase 2)
│   ├── list               # 分类列表
│   ├── create             # 创建分类
│   ├── get <id>           # 分类详情
│   ├── update <id>        # 更新分类
│   └── delete <id>        # 删除分类
├── variant                # 商品变体管理 (Phase 2)
│   ├── list <product-id>  # 变体列表
│   ├── create <product-id> # 创建变体
│   ├── get <product-id> <variant-id> # 变体详情
│   ├── update <product-id> <variant-id> # 更新变体
│   ├── delete <product-id> <variant-id> # 删除变体
│   └── add-images <product-id> <variant-id> # 添加变体图片
├── refund                 # 退款管理 (Phase 2)
│   ├── create <order-id>  # 创建退款
│   └── get <refund-id>    # 退款详情
├── payment                # 支付账号管理 (Phase 2)
│   ├── connect            # 连接 Stripe
│   ├── status             # 查看连接状态
│   ├── dashboard          # 打开 Stripe 仪表板
│   └── disconnect         # 断开连接
├── ads                    # Google Ads 管理 (Phase 3)
│   ├── create-campaign    # 创建广告活动
│   ├── list-campaigns     # 广告活动列表
│   ├── performance <id>   # 活动效果
│   ├── research <keyword> # 关键词研究
│   └── add-keywords <id>  # 添加关键词
├── image                  # 图像生成 (Phase 3)
│   ├── generate <prompt>  # 文本生成图片
│   └── transform <url>    # 图片转换
├── import                 # 批量导入 (Phase 3)
│   ├── products <file>    # 导入商品
│   └── status <task-id>   # 查看导入状态
├── export                 # 批量导出 (Phase 3)
│   ├── products           # 导出商品
│   ├── status <task-id>   # 查看导出状态
│   └── download <task-id> # 下载导出文件
├── i18n                   # 多语言翻译 (Phase 3)
│   ├── languages          # 列出支持的语言
│   ├── merchant           # 商户多语言管理
│   │   ├── list           # 列出商户所有翻译
│   │   ├── get <lang>     # 获取特定语言翻译
│   │   ├── set <lang>     # 设置特定语言翻译
│   │   └── delete <lang>  # 删除特定语言翻译
│   ├── product            # 商品多语言管理
│   │   ├── list <product-id> # 列出商品所有翻译
│   │   ├── get <product-id> <lang> # 获取特定语言翻译
│   │   ├── set <product-id> <lang> # 设置特定语言翻译
│   │   └── delete <product-id> <lang> # 删除特定语言翻译
│   └── category           # 分类多语言管理
│       ├── list <category-id> # 列出分类所有翻译
│       ├── get <category-id> <lang> # 获取特定语言翻译
│       ├── set <category-id> <lang> # 设置特定语言翻译
│       └── delete <category-id> <lang> # 删除特定语言翻译
├── config                 # 配置管理
│   ├── set <key> <value>  # 设置配置
│   ├── get <key>          # 获取配置
│   └── list               # 列出所有配置
└── setup-claude           # Claude Code 集成
```

### 命令规范

#### 命名规范
- 使用小写字母和连字符
- 动词在前：`create`, `list`, `update`, `delete`
- 保持简洁：`ship` 而不是 `ship-order`

#### 参数规范
- 必需参数使用 `<arg>`
- 可选参数使用 `[arg]`
- 选项使用 `--option` 或 `-o`

#### 示例命令

```bash
# 1. Device Flow 登录
optima auth login
# 流程：
# - CLI 显示：请访问 https://ai.optima.chat/device
# - CLI 显示：输入代码 ABCD-1234
# - 自动打开浏览器（或手动访问）
# - 在浏览器中输入代码并登录（支持邮箱/Google/GitHub）
# - CLI 自动获取 token 并完成登录
# - 首次登录自动创建商户账号

# 2. 创建商品（交互式）
optima product create

# 3. 创建商品（带参数）
optima product create \
  --title "珍珠耳环" \
  --price 299 \
  --description "天然淡水珍珠" \
  --stock 10 \
  --images ./img1.jpg,./img2.jpg

# 4. 商品列表
optima product list
optima product list --limit 20 --offset 0

# 5. 商品详情
optima product get prod_123

# 6. 更新商品
optima product update prod_123 --price 399 --stock 5

# 7. 删除商品
optima product delete prod_123 --yes  # 跳过确认

# 8. 添加图片
optima product add-images prod_123 ./img3.jpg ./img4.jpg

# 9. 订单列表
optima order list
optima order list --status pending --limit 10

# 10. 发货
optima order ship order_123 --tracking DHL123456 --carrier DHL

# 11. 低库存商品
optima inventory low-stock --threshold 5

# 12. 更新库存
optima inventory update prod_123 --quantity 20

# 13. 物流历史
optima shipping history order_123

# 14. 更新物流状态
optima shipping update-status order_123 --status in_transit

# 15. 计算运费
optima shipping calculate \
  --country US \
  --postal-code 10001 \
  --weight 1.5

# 16. 运费区域列表
optima shipping zones list

# 17. 创建运费区域
optima shipping zones create \
  --name "North America" \
  --countries "US,CA,MX"

# 18. 创建运费费率
optima shipping rates create zone_123 \
  --min-weight 0 \
  --max-weight 1 \
  --price 10

# 19. 商户信息
optima merchant info

# 20. 收件箱对话列表
optima inbox list

# 21. 查看对话消息
optima inbox messages conv_123

# 22. 标记对话已读
optima inbox mark-read conv_123

# 23. 创建分类
optima category create --name "珠宝首饰" --description "精美珠宝"

# 24. 创建商品变体
optima variant create prod_123 \
  --sku "PEARL-S-WHITE" \
  --size S \
  --color White \
  --price 299 \
  --stock 10

# 25. 创建退款
optima refund create order_123 --amount 100 --reason "商品损坏"

# 26. 连接 Stripe 支付账号
optima payment connect

# 27. 查看支付账号状态
optima payment status

# 28. 批量导入商品
optima import products ./products.csv

# 29. 批量导出商品
optima export products --format csv

# 30. 查看支持的语言
optima i18n languages

# 31. 设置商户中文翻译
optima i18n merchant set zh-CN \
  --name "精美珠宝店" \
  --description "专注高品质珠宝"

# 32. 设置商品日语翻译
optima i18n product set prod_123 ja \
  --title "真珠のイヤリング" \
  --description "天然淡水真珠"

# 33. 获取分类翻译
optima i18n category get cat_123 en

# 34. 配置 Claude Code
optima setup-claude
```

### 命令实现示例

以 `optima product create` 为例说明命令实现模式：

**实现位置**：`src/commands/product/create.ts`

**核心流程**：
1. **参数处理**：检查是否提供了必需参数（title, price）
2. **交互式模式**：如果缺少参数，使用 inquirer 进入交互式输入
   - 使用 `inquirer.prompt` 收集商品信息
   - 支持输入验证（如价格必须 > 0）
   - 询问是否上传图片，支持多张图片路径输入
3. **API 调用**：使用 ora 显示加载动画，调用 `commerceApi.products.create()`
4. **图片上传**：如果有图片，构造 FormData 并调用 `addImages()`
5. **结果展示**：使用 `formatProduct()` 格式化输出，显示商品链接
6. **错误处理**：使用统一的 `handleError()` 处理异常

**关键技术**：
- **inquirer** - 交互式输入
- **ora** - 加载动画
- **chalk** - 彩色输出
- **form-data** - 文件上传
- **统一错误处理** - try/catch + handleError()

---

## 认证授权方案

### 认证流程（OAuth 2.0 Device Flow）

```
1. 用户执行 optima auth login
2. CLI 调用 /api/v1/oauth/device/authorize 获取 device code 和 user code
3. CLI 显示授权地址和 user code (如 ABCD-1234)
4. 自动打开浏览器访问 https://ai.optima.chat/device
5. 用户在浏览器输入 user code 并登录（邮箱/Google/GitHub）
6. 登录成功后，浏览器显示"授权成功"
7. CLI 轮询 /api/v1/oauth/device/token 获取 access token
8. Token 存储到本地配置文件
9. 后续请求自动带上 Token
10. Token 过期时自动刷新
```

**技术细节**：参见 [docs/DEVICE_FLOW_DESIGN.md](./DEVICE_FLOW_DESIGN.md)

### Token 存储

**实现位置**：`src/utils/config.ts`

使用 `conf` 包存储配置，跨平台默认路径：
- macOS: `~/Library/Preferences/optima-cli-nodejs/`
- Linux: `~/.config/optima-cli/`
- Windows: `%APPDATA%\optima-cli\Config\`

**配置结构**：
- `auth` - 认证信息（token, refreshToken, user）
- `api` - API 配置（baseUrl）
- 使用 `encryptionKey` 加密敏感信息

**核心方法**：
- `getConfig(key)` - 读取配置
- `updateConfig(key, value)` - 更新配置
- `deleteConfig(key)` - 删除配置

### Device Flow 登录实现

**实现位置**: `src/commands/auth/login.ts`

**核心流程**:

1. **请求 Device Code**:
   - 调用 `authApi.requestDeviceCode()`
   - 获取 `device_code`, `user_code`, `verification_uri`, `verification_uri_complete`, `interval`, `expires_in`

2. **显示给用户**:
   - 打印授权地址: `https://ai.optima.chat/device`
   - 打印 User Code: `ABCD-1234` (大号、醒目显示)
   - 提示代码有效期（如 10 分钟）

3. **自动打开浏览器** (使用 `open` npm 包):
   - 尝试打开 `verification_uri_complete` (预填 user code)
   - 失败则静默（用户可手动访问）

4. **轮询获取 Token**:
   - 显示"等待授权中..."加载动画 (ora)
   - 调用 `authApi.pollDeviceToken(device_code, interval, expires_in)`
   - 每 5 秒轮询一次 `/api/v1/oauth/device/token`
   - 处理轮询响应:
     - `authorization_pending` - 继续等待
     - `slow_down` - 增加轮询间隔
     - `success` - 获取到 token，结束轮询
     - `expired_token` - 超时，提示重新登录
     - `access_denied` - 用户拒绝，退出

5. **保存 Token**:
   - 调用 `saveTokens(access_token, refresh_token, expires_in)`
   - 调用 `authApi.getCurrentUser()` 获取用户信息
   - 调用 `saveUser(user)` 保存用户信息

6. **显示成功**:
   - 停止加载动画
   - 显示"✓ 登录成功！"
   - 显示用户信息（邮箱、姓名、角色）

**依赖**:
- `open` - 自动打开浏览器
- `ora` - 加载动画
- `chalk` - 彩色输出

**统一特性**:
- 所有登录方式（邮箱/Google/GitHub）都在浏览器完成
- 首次登录 = 自动注册 + 登录
- 无需单独的注册流程
- 用户体验一致、简洁

---

## 文件上传方案

### 图片上传流程

1. 用户指定图片路径（命令行参数或交互式输入）
2. 验证文件存在性和格式
3. 读取文件为 Buffer
4. 构造 FormData
5. 调用 API 上传
6. 显示上传进度
7. 返回图片 URL

### 实现方案

**实现位置**：`src/utils/upload.ts`

**文件验证**：
- `validateImageFile()` - 验证图片文件
  - 检查文件是否存在
  - 支持格式：.jpg, .jpeg, .png, .gif, .webp
  - 最大文件大小：10MB
  - 抛出友好的错误信息

**FormData 构建**：
- `createImageFormData(imagePaths)` - 构造上传表单
  - 遍历图片路径列表
  - 读取文件为 Buffer
  - 添加到 FormData，设置正确的 Content-Type

**工具函数**：
- `formatFileSize(bytes)` - 格式化文件大小显示（B/KB/MB）

### 添加图片命令

**实现位置**：`src/commands/product/images.ts`

**核心流程**：
1. 验证至少有一张图片路径
2. 列出待上传文件信息（路径、大小）
3. 使用 ora 显示上传动画
4. 调用 `createImageFormData()` 构造表单
5. 调用 `commerceApi.products.addImages()`
6. 显示成功信息

---

## 数据格式与展示

**实现位置**：`src/utils/format.ts`

### 表格展示

使用 `cli-table3` 展示列表数据，包括：

**商品列表格式化 (formatProductList)**：
- 表格列：ID、名称、价格、库存、状态、创建时间
- ID 截取前 12 位显示
- 状态用颜色区分（绿色=上架，灰色=下架）
- 时间格式：YYYY-MM-DD HH:mm

**商品详情格式化 (formatProduct)**：
- 键值对格式，使用分隔线美化
- 价格用绿色高亮显示
- 支持显示创建时间和更新时间

**订单列表格式化 (formatOrderList)**：
- 表格列：订单号、客户、金额、状态、时间
- 状态映射中文并用颜色区分：
  - 待处理（黄色）、已支付（蓝色）、已发货（青色）
  - 已完成（绿色）、已取消（灰色）

**技术栈**：
- `cli-table3` - 表格展示
- `chalk` - 彩色输出
- `dayjs` - 日期格式化

---

## 错误处理

**实现位置**：`src/utils/error.ts`

### 错误类型

定义三种自定义错误类：
- `ApiError` - API 调用错误（包含 statusCode 和 code）
- `ValidationError` - 输入验证错误
- `AuthenticationError` - 未认证错误

### 错误处理器

`handleError(error)` 统一处理各种错误：
- `AuthenticationError` - 红色显示，提示登录
- `ValidationError` - 黄色警告显示
- `ApiError` - 红色显示，附带状态码和错误码
- `Error` - 红色显示，DEBUG 模式下显示堆栈
- 其他 - 显示未知错误

所有错误处理后调用 `process.exit(1)` 退出

### 网络重试

**实现位置**：`src/utils/retry.ts`

`retry(fn, options)` 支持失败重试：
- 默认重试 3 次
- 延迟时间递增（1s, 2s, 3s...）
- 支持 onRetry 回调监听重试事件
- 最终仍失败则抛出最后一次的错误

---

## 配置管理

**实现位置**：`src/utils/config.ts`, `src/commands/config.ts`

### 配置结构 (ConfigSchema)

- `auth` - 认证信息（token, refreshToken, user）
- `api` - API 配置（baseUrl, timeout）
- `cli` - CLI 配置（defaultLimit, colorOutput, verbose）

### 配置命令

**configSet** - 设置配置项：
- 自动类型转换（'true' → boolean, 数字字符串 → number）
- 显示设置成功提示

**configGet** - 获取配置项：
- 格式化 JSON 输出
- 不存在时显示黄色警告

**configList** - 列出所有配置：
- 以 JSON 格式展示完整配置

---

## Claude Code 集成

### 自动配置机制

**实现位置**：`src/postinstall.ts`

Optima CLI 在全局安装时通过 `postinstall` hook 自动配置 Claude Code 集成。

**核心流程**：
1. 检测是否全局安装（`process.env.npm_config_global === 'true'`）
2. 确保 `~/.claude/` 目录存在
3. 读取 `CLAUDE.md` 现有内容
4. 移除旧的 Optima CLI 配置（使用正则替换）
5. 追加新的配置内容到文件末尾
6. 静默失败，不影响安装流程

**配置内容**：
- 简短的工具介绍和安装命令
- 自然语言使用示例（商品、订单、库存、物流）
- 可用命令列表（供参考）

**目标路径**：`~/.claude/CLAUDE.md`

### 手动配置命令（备用）

**实现位置**：`src/commands/setup-claude.ts`

**命令**：`optima setup-claude`

**核心流程**：
1. 检查 CLAUDE.md 是否已存在 Optima CLI 配置
2. 如果存在且非 `--force`，使用 inquirer 询问是否更新
3. 移除旧配置，写入新配置
4. 显示成功信息和文件路径

**使用场景**：
- 自动配置失败时手动执行
- 更新配置内容时重新执行
- 使用 `--force` 参数跳过确认

---

## 开发计划

### Phase 1: MVP - 基础电商功能 (Week 1-2)

**目标**: 实现核心电商功能，直接调用 REST API

**技术栈**: REST API (Commerce Backend + User Auth)

**任务清单**:
- [x] 项目初始化
  - [x] 创建项目结构
  - [x] 技术方案文档
  - [x] README 文档
  - [x] Git 仓库配置
- [ ] 基础设施
  - [ ] REST HTTP 客户端封装
  - [ ] 配置管理 (Conf)
  - [ ] 错误处理
  - [ ] 日志系统
  - [ ] 格式化输出工具
- [ ] 认证功能（OAuth 2.0 Device Flow）
  - [ ] `optima auth login` - Device Flow 登录（在浏览器完成授权）
  - [ ] `optima auth logout` - 登出
  - [ ] `optima auth whoami` - 查看当前用户
  - [ ] Device Code 请求和轮询逻辑
  - [ ] 自动打开浏览器
  - [ ] Token 自动存储和管理
  - [ ] 依赖 user-auth 和 agentic-chat 实现 Device Flow 支持
- [ ] 商品管理
  - [ ] `optima product create`
  - [ ] `optima product list`
  - [ ] `optima product get`
  - [ ] `optima product update`
  - [ ] `optima product delete`
- [ ] 订单管理
  - [ ] `optima order list`
  - [ ] `optima order get`
  - [ ] `optima order ship`
- [ ] Claude Code 集成
  - [ ] postinstall.ts 自动配置脚本
  - [ ] `optima setup-claude` 手动配置命令（备用）
  - [ ] CLAUDE.md 配置内容优化

### Phase 2: 完整电商功能 (Week 3-5)

**目标**: 补充完整的电商业务功能

**技术栈**: REST API

**任务清单**:
- [ ] 图片上传
  - [ ] `optima product add-images`
  - [ ] 文件验证
  - [ ] FormData 上传
  - [ ] 进度显示
- [ ] 库存管理
  - [ ] `optima inventory low-stock`
  - [ ] `optima inventory update`
  - [ ] `optima inventory history`
- [ ] 物流管理
  - [ ] `optima shipping calculate` - 计算运费
  - [ ] `optima shipping history` - 物流历史
  - [ ] `optima shipping update-status` - 更新物流状态
  - [ ] `optima shipping add-note` - 添加物流备注
- [ ] 运费配置管理
  - [ ] `optima shipping zones list` - 列出运费区域
  - [ ] `optima shipping zones create` - 创建运费区域
  - [ ] `optima shipping zones update` - 更新运费区域
  - [ ] `optima shipping zones delete` - 删除运费区域
  - [ ] `optima shipping rates list` - 列出费率
  - [ ] `optima shipping rates create` - 创建费率
  - [ ] `optima shipping rates update` - 更新费率
  - [ ] `optima shipping rates delete` - 删除费率
- [ ] 商户管理
  - [ ] `optima merchant info`
  - [ ] `optima merchant update`
  - [ ] `optima merchant setup`
- [ ] 更多订单操作
  - [ ] `optima order complete`
  - [ ] `optima order cancel`
- [ ] 收件箱管理（商家与客户对话）
  - [ ] `optima inbox list` - 对话列表
  - [ ] `optima inbox get` - 对话详情
  - [ ] `optima inbox messages` - 查看消息
  - [ ] `optima inbox mark-read` - 标记已读
- [ ] 分类管理
  - [ ] `optima category list` - 分类列表
  - [ ] `optima category create` - 创建分类
  - [ ] `optima category get` - 分类详情
  - [ ] `optima category update` - 更新分类
  - [ ] `optima category delete` - 删除分类
- [ ] 商品变体管理
  - [ ] `optima variant list` - 变体列表
  - [ ] `optima variant create` - 创建变体
  - [ ] `optima variant get` - 变体详情
  - [ ] `optima variant update` - 更新变体
  - [ ] `optima variant delete` - 删除变体
  - [ ] `optima variant add-images` - 添加变体图片
- [ ] 退款管理
  - [ ] `optima refund create` - 创建退款
  - [ ] `optima refund get` - 退款详情
- [ ] Stripe Connect 集成（支付账号）
  - [ ] `optima payment connect` - 连接 Stripe
  - [ ] `optima payment status` - 查看连接状态
  - [ ] `optima payment dashboard` - 打开 Stripe 仪表板
  - [ ] `optima payment disconnect` - 断开连接

### Phase 3: 高级功能 - MCP 集成与数据迁移 (Week 6-8)

**目标**: 集成 MCP Servers，实现广告、图像生成和批量数据操作

**技术栈**: MCP SSE Protocol + REST API

**任务清单**:
- [ ] MCP 客户端实现
  - [ ] SSE 协议客户端
  - [ ] MCP 工具调用封装
  - [ ] 错误处理
  - [ ] 依赖安装 (eventsource)
- [ ] Google Ads 管理 (MCP)
  - [ ] `optima ads create-campaign`
  - [ ] `optima ads list-campaigns`
  - [ ] `optima ads performance`
  - [ ] `optima ads research`
  - [ ] `optima ads add-keywords`
- [ ] 图像生成 (MCP)
  - [ ] `optima image generate`
  - [ ] `optima image transform`
  - [ ] 图片下载和保存
- [ ] 批量导入导出
  - [ ] `optima import products` - 导入商品 (CSV/JSON)
  - [ ] `optima import status` - 查看导入状态
  - [ ] `optima export products` - 导出商品 (CSV/JSON)
  - [ ] `optima export status` - 查看导出状态
  - [ ] `optima export download` - 下载导出文件
- [ ] 商品增强功能
  - [ ] `optima product add-video` - 添加商品视频
  - [ ] `optima product list-videos` - 查看视频列表
  - [ ] `optima product reorder-images` - 调整图片顺序
- [ ] 商户 Banner 管理
  - [ ] `optima banner list` - Banner 列表
  - [ ] `optima banner create` - 创建 Banner
  - [ ] `optima banner update` - 更新 Banner
  - [ ] `optima banner delete` - 删除 Banner
  - [ ] `optima banner reorder` - 调整顺序
- [ ] Easyship 物流集成
  - [ ] `optima easyship config` - 配置 Easyship
  - [ ] `optima easyship rates` - 计算运费
  - [ ] `optima easyship ship` - 创建运单
  - [ ] `optima easyship countries` - 支持国家
- [ ] 转账记录
  - [ ] `optima transfer list` - 转账列表
  - [ ] `optima transfer summary` - 转账汇总
- [ ] 多语言翻译（i18n）
  - [ ] `optima i18n languages` - 支持的语言列表
  - [ ] `optima i18n merchant list` - 商户翻译列表
  - [ ] `optima i18n merchant set` - 设置商户翻译
  - [ ] `optima i18n merchant get` - 获取商户翻译
  - [ ] `optima i18n merchant delete` - 删除商户翻译
  - [ ] `optima i18n product list` - 商品翻译列表
  - [ ] `optima i18n product set` - 设置商品翻译
  - [ ] `optima i18n product get` - 获取商品翻译
  - [ ] `optima i18n product delete` - 删除商品翻译
  - [ ] `optima i18n category list` - 分类翻译列表
  - [ ] `optima i18n category set` - 设置分类翻译
  - [ ] `optima i18n category get` - 获取分类翻译
  - [ ] `optima i18n category delete` - 删除分类翻译
- [ ] 文档更新
  - [ ] MCP 命令使用说明
  - [ ] 批量操作指南
  - [ ] 多语言管理指南
  - [ ] 高级功能使用指南
  - [ ] 更新 CLAUDE.md 配置

### Phase 4: 测试、优化与发布 (Week 9-10)

**目标**: 完善测试、优化体验、发布到 NPM

**任务清单**:
- [ ] 测试
  - [ ] 单元测试覆盖率 > 80%
  - [ ] 集成测试
  - [ ] MCP 客户端测试
  - [ ] 手动测试
- [ ] 文档完善
  - [ ] API.md
  - [ ] COMMANDS.md
  - [ ] 使用示例和最佳实践
  - [ ] 故障排查指南
- [ ] 性能优化
  - [ ] 请求并发优化
  - [ ] 缓存策略
  - [ ] 错误信息优化
  - [ ] 交互体验优化
- [ ] 发布准备
  - [ ] 配置 CI/CD
  - [ ] NPM 包配置
  - [ ] 版本管理
  - [ ] 发布到 NPM
  - [ ] 创建 Release Notes

**架构总结**：
- **Phase 1 (Week 1-2)**: MVP - 认证、商品、订单基础功能 → REST API
- **Phase 2 (Week 3-5)**: 完整电商 - 分类、变体、退款、支付、对话等 → REST API
- **Phase 3 (Week 6-8)**: 高级功能 - MCP 集成（Ads、图像）+ 批量导入导出 + Easyship + 多语言翻译
- **Phase 4 (Week 9-10)**: 测试、优化、发布
- **暂不实现**: Shopify MCP（后续需求再考虑）

---

## 部署发布

### NPM 发布配置

```json
// package.json
{
  "name": "@optima-chat/optima-cli",
  "version": "0.1.0",
  "description": "用自然语言管理电商店铺 - 专为 Claude Code 设计的对话式 CLI 工具",
  "main": "dist/index.js",
  "type": "module",
  "bin": {
    "optima": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "prepublishOnly": "npm run build",
    "postinstall": "node dist/postinstall.js"
  },
  "keywords": [
    "optima",
    "commerce",
    "cli",
    "e-commerce",
    "claude-code",
    "ai"
  ],
  "author": "Optima Commerce Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/Optima-Chat/optima-cli.git"
  },
  "homepage": "https://optima.chat",
  "bugs": {
    "url": "https://github.com/Optima-Chat/optima-cli/issues"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 发布流程

```bash
# 1. 构建
npm run build

# 2. 测试
npm test

# 3. 版本升级
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# 4. 发布到 NPM
npm publish --access public

# 5. 推送到 Git
git push && git push --tags
```

### CI/CD 配置

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 附录

### A. 技术决策记录

| 决策 | 方案 | 理由 |
|-----|------|------|
| CLI 框架 | Commander.js | 成熟稳定，文档完善 |
| HTTP 客户端 | Axios | 功能强大，支持拦截器 |
| 配置存储 | Conf | 跨平台，自动加密 |
| 表格展示 | cli-table3 | 美观，可定制 |
| 日期处理 | dayjs | 轻量级，API 友好 |
| 包管理器 | NPM | 官方工具，兼容性好 |

### B. API 端点映射

| CLI 命令 | API 端点 | HTTP 方法 |
|---------|---------|----------|
| `product create` | `/api/products` | POST |
| `product list` | `/api/products` | GET |
| `product get` | `/api/products/{product_id}` | GET |
| `product update` | `/api/products/{product_id}` | PUT |
| `product delete` | `/api/products/{product_id}` | DELETE |
| `order list` | `/api/orders/merchant` | GET |
| `order get` | `/api/orders/merchant/{order_id}` | GET |
| `order ship` | `/api/orders/merchant/{order_id}/ship` | POST |
| `order complete` | `/api/orders/merchant/{order_id}/complete` | POST |
| `order cancel` | `/api/orders/merchant/{order_id}/cancel` | POST |
| `inventory low-stock` | `/api/inventory/low-stock` | GET |
| `inventory update` | `/api/inventory/products/{product_id}/stock` | PUT |
| `inventory history` | `/api/inventory/products/{product_id}/history` | GET |
| `shipping calculate` | `/api/shipping/fixed/calculate` | POST |
| `shipping history` | `/api/orders/merchant/{order_id}/shipping-history` | GET |
| `shipping update-status` | `/api/orders/merchant/{order_id}/update-shipping-status` | POST |
| `shipping add-note` | `/api/orders/merchant/{order_id}/add-shipping-note` | POST |
| `shipping zones list` | `/api/shipping/fixed/zones` | GET |
| `shipping zones create` | `/api/shipping/fixed/zones` | POST |
| `shipping zones get` | `/api/shipping/fixed/zones/{zone_id}` | GET |
| `shipping zones update` | `/api/shipping/fixed/zones/{zone_id}` | PUT |
| `shipping zones delete` | `/api/shipping/fixed/zones/{zone_id}` | DELETE |
| `shipping rates list` | `/api/shipping/fixed/zones/{zone_id}/rates` | GET |
| `shipping rates create` | `/api/shipping/fixed/zones/{zone_id}/rates` | POST |
| `shipping rates update` | `/api/shipping/fixed/zones/{zone_id}/rates/{rate_id}` | PUT |
| `shipping rates delete` | `/api/shipping/fixed/zones/{zone_id}/rates/{rate_id}` | DELETE |
| `merchant info` | `/api/merchants/me` | GET |
| `merchant update` | `/api/merchants/me` | PUT |
| `inbox list` | `/api/conversations` | GET |
| `inbox get` | `/api/conversations/{conversation_id}` | GET |
| `inbox messages` | `/api/conversations/{conversation_id}/messages` | GET |
| `inbox mark-read` | `/api/conversations/{conversation_id}/messages/mark-read` | POST |
| `category list` | `/api/categories` | GET |
| `category create` | `/api/categories` | POST |
| `category get` | `/api/categories/{category_id}` | GET |
| `category update` | `/api/categories/{category_id}` | PUT |
| `category delete` | `/api/categories/{category_id}` | DELETE |
| `variant list` | `/api/products/{product_id}/variants` | GET |
| `variant create` | `/api/products/{product_id}/variants` | POST |
| `variant get` | `/api/products/{product_id}/variants/{variant_id}` | GET |
| `variant update` | `/api/products/{product_id}/variants/{variant_id}` | PUT |
| `variant delete` | `/api/products/{product_id}/variants/{variant_id}` | DELETE |
| `variant add-images` | `/api/products/{master_id}/variants/{variant_id}/images` | POST |
| `refund create` | `/api/refunds/create` | POST |
| `refund get` | `/api/refunds/{refund_id}` | GET |
| `payment connect` | `/api/merchants/connect/create-express` | POST |
| `payment status` | `/api/merchants/connect/status` | GET |
| `payment dashboard` | `/api/merchants/connect/dashboard-link` | GET |
| `payment disconnect` | `/api/merchants/connect/disconnect` | POST |
| `product add-video` | `/api/products/{product_id}/videos` | POST |
| `product list-videos` | `/api/products/{product_id}/videos` | GET |
| `product reorder-images` | `/api/products/{product_id}/images/reorder` | POST |
| `import products` | `/api/products/imports` | POST |
| `import status` | `/api/products/imports/{task_id}/status` | GET |
| `export products` | `/api/products/exports` | POST |
| `export status` | `/api/products/exports/{task_id}/status` | GET |
| `export download` | `/api/products/exports/{task_id}/download` | GET |
| `i18n languages` | `/api/languages` | GET |
| `i18n merchant list` | `/api/merchants/me/translations` | GET |
| `i18n merchant get` | `/api/merchants/me/translations/{language_code}` | GET |
| `i18n merchant set` | `/api/merchants/me/translations` | POST |
| `i18n merchant delete` | `/api/merchants/me/translations/{language_code}` | DELETE |
| `i18n product list` | `/api/products/{product_id}/translations` | GET |
| `i18n product get` | `/api/products/{product_id}/translations/{language_code}` | GET |
| `i18n product set` | `/api/products/{product_id}/translations` | POST |
| `i18n product delete` | `/api/products/{product_id}/translations/{language_code}` | DELETE |
| `i18n category list` | `/api/categories/{category_id}/translations` | GET |
| `i18n category get` | `/api/categories/{category_id}/translations/{language_code}` | GET |
| `i18n category set` | `/api/categories/{category_id}/translations` | POST |
| `i18n category delete` | `/api/categories/{category_id}/translations/{language_code}` | DELETE |
| `auth login` | `/api/v1/oauth/device/authorize` + `/api/v1/oauth/device/token` | POST |
| `auth logout` | `/api/v1/oauth/revoke` | POST |
| `auth whoami` | `/api/v1/users/me` | GET |

### C. 错误码映射

| HTTP 状态码 | 含义 | CLI 处理 |
|-----------|------|---------|
| 200 | 成功 | 显示结果 |
| 201 | 创建成功 | 显示创建的资源 |
| 400 | 请求错误 | 显示错误信息，提示正确格式 |
| 401 | 未认证 | 提示登录 |
| 403 | 无权限 | 显示权限错误 |
| 404 | 未找到 | 显示资源不存在 |
| 409 | 冲突 | 显示冲突信息 |
| 422 | 验证失败 | 显示验证错误详情 |
| 500 | 服务器错误 | 显示错误，建议重试 |

### D. 环境变量

| 变量名 | 说明 | 默认值 |
|-------|------|-------|
| `OPTIMA_API_URL` | API 基础地址 | `https://api.optima.chat` |
| `OPTIMA_AUTH_URL` | 认证服务地址 | `https://auth.optima.chat` |
| `OPTIMA_COMMERCE_URL` | 电商服务地址 | `https://api.optima.chat` |
| `DEBUG` | 调试模式 | `false` |
| `NO_COLOR` | 禁用颜色输出 | `false` |

---

**文档版本**: 1.0.0
**最后更新**: 2025-10-17
**维护者**: Optima Commerce Team
