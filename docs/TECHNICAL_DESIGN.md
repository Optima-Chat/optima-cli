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
- 商品管理
- 订单处理
- 库存控制
- 物流追踪
- 店铺配置
- 用户认证
- Google Ads 广告管理（通过 Google Ads MCP）
- AI 图像生成（通过 Comfy MCP）

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
│   │   │   ├── login.ts          # 登录
│   │   │   ├── register.ts       # 注册
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

**商户管理 (merchant)**：
- `getProfile` - GET /api/merchants/me - 获取当前商户信息
- `updateProfile` - PUT /api/merchants/me - 更新商户资料
- `setupProfile` - POST /api/merchants/me - 初始化 OAuth 用户的商户资料

**物流管理 (shipping)**：
- `updateShippingStatus` - POST /api/orders/merchant/{order_id}/update-shipping-status - 更新物流状态
- `getShippingHistory` - GET /api/orders/merchant/{order_id}/shipping-history - 获取物流历史
- `addShippingNote` - POST /api/orders/merchant/{order_id}/add-shipping-note - 添加物流备注

### Auth API 封装

**实现位置**：`src/api/rest/auth.ts`

基于 `authClient` 封装认证相关 API，使用标准 OAuth 2.0 协议：

**OAuth Token 管理**：
- `getToken` - POST /api/v1/oauth/token - 获取访问令牌
  - 支持多种授权类型：password（密码模式）、client_credentials、authorization_code、refresh_token
- `revokeToken` - POST /api/v1/oauth/revoke - 撤销访问令牌或刷新令牌

**用户注册**：
- `registerCustomer` - POST /api/v1/auth/register - 客户注册（角色：customer）
- `registerMerchant` - POST /api/v1/auth/register/merchant - 商户注册（角色：merchant）

**用户资料**：
- `getCurrentUser` - GET /api/v1/users/me - 获取当前用户信息
- `updateProfile` - PUT /api/v1/users/me - 更新用户资料

**OAuth 客户端管理**（需要 admin 权限）：
- `createClient` - POST /api/v1/oauth/clients - 创建 OAuth 客户端
- `listClients` - GET /api/v1/oauth/clients - 列出 OAuth 客户端
- `getClient` - GET /api/v1/oauth/clients/{client_id} - 获取客户端详情
- `updateClient` - PUT /api/v1/oauth/clients/{client_id} - 更新客户端
- `deleteClient` - DELETE /api/v1/oauth/clients/{client_id} - 删除客户端

**第三方登录**（Google、GitHub、Apple）：
- `authorize` - GET /api/v1/oauth/authorize/{provider} - 发起第三方授权
- `callback` - GET /api/v1/oauth/callback/{provider} - 处理第三方回调

**注意**：CLI 登录使用 OAuth 2.0 密码模式（grant_type=password），需要提供 client_id 和 client_secret

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
│   ├── login              # 登录
│   ├── register           # 注册
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
│   ├── status <order-id>  # 查看物流状态
│   ├── update-status <order-id>  # 更新物流状态
│   ├── history <order-id> # 物流历史
│   └── add-note <order-id> # 添加物流备注
├── ads                    # Google Ads 管理 (Phase 2+)
│   ├── create-campaign    # 创建广告活动
│   ├── list-campaigns     # 广告活动列表
│   ├── performance <id>   # 活动效果
│   ├── research <keyword> # 关键词研究
│   └── add-keywords <id>  # 添加关键词
├── image                  # 图像生成 (Phase 2+)
│   ├── generate <prompt>  # 文本生成图片
│   └── transform <url>    # 图片转换
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
# 1. 登录
optima auth login
# 或带参数
optima auth login --email user@example.com --password secret

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

# 15. 商户信息
optima merchant info

# 16. 配置 Claude Code
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

### 认证流程

```
1. 用户执行 optima auth login
2. 输入邮箱和密码
3. 调用 Auth API 获取 Token
4. Token 存储到本地配置文件
5. 后续请求自动带上 Token
6. Token 过期时自动刷新
```

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

### 登录实现

**实现位置**：`src/commands/auth/login.ts`

**核心流程**：
1. 检查是否提供 email 和 password 参数
2. 如果缺少，使用 inquirer 交互式输入（支持邮箱格式验证）
3. 显示加载动画，调用 `authApi.login()`
4. 将返回的 Token 和用户信息存储到配置
5. 显示欢迎信息

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
- [ ] 认证功能
  - [ ] `optima auth login`
  - [ ] `optima auth logout`
  - [ ] `optima auth whoami`
  - [ ] Token 自动刷新
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

### Phase 2: 完整电商功能 (Week 3-4)

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
  - [ ] `optima shipping history` - 物流历史
  - [ ] `optima shipping update-status` - 更新物流状态
  - [ ] `optima shipping add-note` - 添加物流备注
- [ ] 商户管理
  - [ ] `optima merchant info`
  - [ ] `optima merchant update`
  - [ ] `optima merchant setup`
- [ ] 更多订单操作
  - [ ] `optima order complete`
  - [ ] `optima order cancel`

### Phase 3: MCP 集成 - 高级功能 (Week 5-6)

**目标**: 集成 MCP Servers，实现广告和图像生成功能

**技术栈**: MCP SSE Protocol

**任务清单**:
- [ ] MCP 客户端实现
  - [ ] SSE 协议客户端
  - [ ] MCP 工具调用封装
  - [ ] 错误处理
  - [ ] 依赖安装 (eventsource)
- [ ] Google Ads 管理
  - [ ] `optima ads create-campaign`
  - [ ] `optima ads list-campaigns`
  - [ ] `optima ads performance`
  - [ ] `optima ads research`
  - [ ] `optima ads add-keywords`
- [ ] 图像生成
  - [ ] `optima image generate`
  - [ ] `optima image transform`
  - [ ] 图片下载和保存
- [ ] 文档更新
  - [ ] MCP 命令使用说明
  - [ ] 更新 CLAUDE.md 配置

### Phase 4: 测试、优化与发布 (Week 7-8)

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
- **Phase 1-2**: REST API 直连（高性能、简单直接）
- **Phase 3**: MCP 集成（复用现有工具，避免重复开发）
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
| `shipping history` | `/api/orders/merchant/{order_id}/shipping-history` | GET |
| `shipping update-status` | `/api/orders/merchant/{order_id}/update-shipping-status` | POST |
| `shipping add-note` | `/api/orders/merchant/{order_id}/add-shipping-note` | POST |
| `merchant info` | `/api/merchants/me` | GET |
| `merchant update` | `/api/merchants/me` | PUT |
| `auth login` | `/api/v1/oauth/token` (grant_type=password) | POST |
| `auth register` | `/api/v1/auth/register/merchant` | POST |
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
