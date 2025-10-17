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
- **Admin Panel**: 管理后台

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

```typescript
// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getConfig, updateConfig } from '../utils/config.js';
import { ApiError } from '../utils/error.js';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加 Token
    this.client.interceptors.request.use(
      (config) => {
        const token = getConfig('auth.token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 处理错误和 Token 刷新
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Token 过期，尝试刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = getConfig('auth.refreshToken');
            const { data } = await axios.post(
              `https://auth.optima.chat/auth/refresh`,
              { refresh_token: refreshToken }
            );

            updateConfig('auth.token', data.access_token);
            updateConfig('auth.refreshToken', data.refresh_token);

            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // 刷新失败，清除认证信息
            updateConfig('auth', null);
            throw new ApiError('认证已过期，请重新登录', 401);
          }
        }

        throw new ApiError(
          error.response?.data?.message || error.message,
          error.response?.status
        );
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const commerceClient = new ApiClient('https://api.optima.chat');
export const authClient = new ApiClient('https://auth.optima.chat');
```

### Commerce API 封装

```typescript
// src/api/commerce.ts
import { commerceClient } from './client.js';
import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  Order,
  OrderListParams,
  ShippingCalculateParams,
  ShippingRate,
  Inventory,
} from './types.js';

export const commerceApi = {
  // 商品管理
  products: {
    create: (data: ProductCreateInput) =>
      commerceClient.post<Product>('/products', data),

    list: (params?: { limit?: number; offset?: number }) =>
      commerceClient.get<{ items: Product[]; total: number }>('/products', { params }),

    get: (id: string) =>
      commerceClient.get<Product>(`/products/${id}`),

    update: (id: string, data: ProductUpdateInput) =>
      commerceClient.put<Product>(`/products/${id}`, data),

    delete: (id: string) =>
      commerceClient.delete(`/products/${id}`),

    addImages: (id: string, formData: FormData) =>
      commerceClient.upload(`/products/${id}/images`, formData),

    removeImages: (id: string, imageIds: string[]) =>
      commerceClient.post(`/products/${id}/images/remove`, { image_ids: imageIds }),
  },

  // 订单管理
  orders: {
    list: (params?: OrderListParams) =>
      commerceClient.get<{ items: Order[]; total: number }>('/orders/merchant', { params }),

    get: (id: string) =>
      commerceClient.get<Order>(`/orders/merchant/${id}`),

    ship: (id: string, data: { tracking_number: string; carrier?: string }) =>
      commerceClient.post(`/orders/merchant/${id}/ship`, data),

    complete: (id: string) =>
      commerceClient.post(`/orders/merchant/${id}/complete`),

    cancel: (id: string, reason?: string) =>
      commerceClient.post(`/orders/merchant/${id}/cancel`, { reason }),
  },

  // 库存管理
  inventory: {
    getLowStock: (threshold?: number) =>
      commerceClient.get<Inventory[]>('/inventory/low-stock', {
        params: { threshold },
      }),

    update: (productId: string, quantity: number) =>
      commerceClient.post('/inventory/update', {
        product_id: productId,
        quantity,
      }),

    getHistory: (productId: string) =>
      commerceClient.get(`/inventory/${productId}/history`),
  },

  // 物流管理
  shipping: {
    calculate: (data: ShippingCalculateParams) =>
      commerceClient.post<ShippingRate[]>('/shipping/calculate', data),

    create: (orderId: string) =>
      commerceClient.post(`/shipping/create`, { order_id: orderId }),

    track: (trackingNumber: string) =>
      commerceClient.get(`/shipping/track/${trackingNumber}`),
  },

  // 店铺管理
  shop: {
    getInfo: () =>
      commerceClient.get('/shop/info'),

    updateProfile: (data: any) =>
      commerceClient.put('/merchant/profile', data),

    setup: (data: any) =>
      commerceClient.post('/merchant/setup', data),
  },
};
```

### Auth API 封装

```typescript
// src/api/auth.ts
import { authClient } from './client.js';
import type { User, LoginResponse, RegisterInput } from './types.js';

export const authApi = {
  register: (data: RegisterInput) =>
    authClient.post<LoginResponse>('/auth/register', data),

  login: (email: string, password: string) =>
    authClient.post<LoginResponse>('/auth/login', {
      username: email,
      password,
    }),

  logout: () =>
    authClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    authClient.post<LoginResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    }),

  getCurrentUser: () =>
    authClient.get<User>('/users/me'),

  createApiKey: (name: string) =>
    authClient.post('/users/api-keys', { name }),

  deleteApiKey: (id: string) =>
    authClient.delete(`/users/api-keys/${id}`),
};
```

### MCP 客户端封装 (Phase 2+)

MCP (Model Context Protocol) 使用 SSE (Server-Sent Events) 协议进行通信。

```typescript
// src/api/mcp/client.ts
import EventSource from 'eventsource';
import axios from 'axios';

interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

class MCPClient {
  private baseURL: string;
  private eventSource?: EventSource;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async callTool(toolName: string, args: Record<string, any>): Promise<any> {
    const response = await axios.post<MCPResponse>(
      this.baseURL.replace('/sse', '/call_tool'),
      {
        name: toolName,
        arguments: args,
      }
    );

    // 解析响应
    const textContent = response.data.content.find((c) => c.type === 'text');
    if (textContent) {
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }

    return response.data;
  }

  async listTools(): Promise<string[]> {
    const response = await axios.get(`${this.baseURL.replace('/sse', '/tools')}`);
    return response.data.tools.map((t: any) => t.name);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }
}

// 导出各个 MCP 客户端实例
export const googleAdsMcp = new MCPClient('http://dev.optima.chat:8240/sse');
export const comfyMcp = new MCPClient('http://dev.optima.chat:8220/sse');
```

### Google Ads MCP 封装

```typescript
// src/api/mcp/google-ads.ts
import { googleAdsMcp } from './client.js';

export const googleAdsApi = {
  // 广告活动管理
  campaigns: {
    create: (data: {
      name: string;
      budget: number;
      targetLocation: string;
    }) => googleAdsMcp.callTool('create_campaign', data),

    list: () => googleAdsMcp.callTool('get_campaigns', {}),

    getPerformance: (campaignId: string) =>
      googleAdsMcp.callTool('get_campaign_performance', { campaign_id: campaignId }),
  },

  // 关键词管理
  keywords: {
    research: (keyword: string) =>
      googleAdsMcp.callTool('research_keywords', { keyword }),

    add: (campaignId: string, keywords: string[]) =>
      googleAdsMcp.callTool('add_keywords', {
        campaign_id: campaignId,
        keywords,
      }),
  },
};
```

### Comfy MCP 封装

```typescript
// src/api/mcp/comfy.ts
import { comfyMcp } from './client.js';

export const comfyApi = {
  // 图像生成
  generateImage: (prompt: string, options?: {
    width?: number;
    height?: number;
    steps?: number;
  }) =>
    comfyMcp.callTool('create_image_from_prompt', {
      prompt,
      ...options,
    }),

  // 图像转换
  transformImage: (imageUrl: string, prompt: string) =>
    comfyMcp.callTool('create_image_to_image', {
      image_url: imageUrl,
      prompt,
    }),
};
```

**依赖安装**：
```bash
npm install eventsource
```

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
├── shipping               # 物流管理 (Phase 1)
│   ├── calculate          # 计算运费
│   ├── create <order-id>  # 创建运单
│   └── track <number>     # 物流跟踪
├── shop                   # 店铺管理 (Phase 1)
│   ├── info               # 店铺信息
│   ├── update             # 更新店铺
│   └── setup              # 设置店铺
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

# 13. 计算运费
optima shipping calculate \
  --from "Hong Kong" \
  --to "New York, USA" \
  --weight 0.5

# 14. 物流跟踪
optima shipping track DHL123456

# 15. 店铺信息
optima shop info

# 16. 配置 Claude Code
optima setup-claude
```

### 命令实现示例

```typescript
// src/commands/product/create.ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { commerceApi } from '../../api/commerce.js';
import { handleError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import FormData from 'form-data';
import fs from 'fs';

interface CreateOptions {
  title?: string;
  price?: number;
  description?: string;
  stock?: number;
  images?: string;
}

export async function createProduct(options: CreateOptions) {
  try {
    let productData;

    // 如果没有提供参数，进入交互式模式
    if (!options.title || !options.price) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: '商品名称:',
          default: options.title,
          validate: (input) => input.length > 0 || '商品名称不能为空',
        },
        {
          type: 'number',
          name: 'price',
          message: '价格 (USD):',
          default: options.price,
          validate: (input) => input > 0 || '价格必须大于 0',
        },
        {
          type: 'input',
          name: 'description',
          message: '描述:',
          default: options.description || '',
        },
        {
          type: 'number',
          name: 'stock',
          message: '库存数量:',
          default: options.stock || 0,
        },
        {
          type: 'confirm',
          name: 'uploadImages',
          message: '是否上传图片?',
          default: false,
        },
      ]);

      productData = answers;

      // 如果选择上传图片
      if (answers.uploadImages) {
        const images: string[] = [];
        let addMore = true;

        while (addMore) {
          const { imagePath } = await inquirer.prompt([
            {
              type: 'input',
              name: 'imagePath',
              message: '图片路径:',
              validate: (input) => {
                if (!fs.existsSync(input)) {
                  return '文件不存在';
                }
                return true;
              },
            },
          ]);

          images.push(imagePath);

          const { continueAdding } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'continueAdding',
              message: '继续添加图片?',
              default: false,
            },
          ]);

          addMore = continueAdding;
        }

        productData.images = images;
      }
    } else {
      productData = {
        title: options.title,
        price: options.price,
        description: options.description || '',
        stock: options.stock || 0,
        images: options.images?.split(',') || [],
      };
    }

    // 创建商品
    const spinner = ora('正在创建商品...').start();

    const product = await commerceApi.products.create({
      name: productData.title,
      price: productData.price,
      description: productData.description,
      stock_quantity: productData.stock,
    });

    spinner.succeed('商品创建成功！');

    // 上传图片
    if (productData.images && productData.images.length > 0) {
      const uploadSpinner = ora('正在上传图片...').start();

      const formData = new FormData();
      for (const imagePath of productData.images) {
        const fileBuffer = fs.readFileSync(imagePath);
        const fileName = imagePath.split('/').pop();
        formData.append('files', fileBuffer, fileName);
      }

      await commerceApi.products.addImages(product.id, formData);
      uploadSpinner.succeed(`${productData.images.length} 张图片上传成功！`);
    }

    // 显示商品信息
    console.log('\n' + formatProduct(product));
    console.log(chalk.gray(`\n商品链接: https://go.optima.shop/${product.merchant_id}/${product.id}`));
  } catch (error) {
    handleError(error);
  }
}
```

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

使用 `conf` 包存储配置，默认路径：
- macOS: `~/Library/Preferences/optima-cli-nodejs/`
- Linux: `~/.config/optima-cli/`
- Windows: `%APPDATA%\optima-cli\Config\`

```typescript
// src/utils/config.ts
import Conf from 'conf';

interface ConfigSchema {
  auth: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
  api: {
    baseUrl: string;
  };
}

export const config = new Conf<ConfigSchema>({
  projectName: 'optima-cli',
  defaults: {
    api: {
      baseUrl: 'https://api.optima.chat',
    },
  },
  // 加密敏感信息
  encryptionKey: 'optima-cli-secret-key',
});

export function getConfig<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] | undefined {
  return config.get(key);
}

export function updateConfig<K extends keyof ConfigSchema>(
  key: K,
  value: ConfigSchema[K]
): void {
  config.set(key, value);
}

export function deleteConfig<K extends keyof ConfigSchema>(key: K): void {
  config.delete(key);
}
```

### 登录实现

```typescript
// src/commands/auth/login.ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { authApi } from '../../api/auth.js';
import { updateConfig } from '../../utils/config.js';
import { handleError } from '../../utils/error.js';

interface LoginOptions {
  email?: string;
  password?: string;
}

export async function login(options: LoginOptions) {
  try {
    let email = options.email;
    let password = options.password;

    // 交互式输入
    if (!email || !password) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'email',
          message: '邮箱:',
          default: email,
          validate: (input) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(input) || '请输入有效的邮箱地址';
          },
        },
        {
          type: 'password',
          name: 'password',
          message: '密码:',
          mask: '*',
          validate: (input) => input.length > 0 || '密码不能为空',
        },
      ]);

      email = answers.email;
      password = answers.password;
    }

    const spinner = ora('正在登录...').start();

    const response = await authApi.login(email, password);

    // 存储 Token 和用户信息
    updateConfig('auth', {
      token: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
    });

    spinner.succeed(chalk.green('登录成功！'));
    console.log(chalk.gray(`\n欢迎回来，${response.user.name || response.user.email}！`));
  } catch (error) {
    handleError(error);
  }
}
```

---

## 文件上传方案

### 图片上传流程

```
1. 用户指定图片路径（命令行参数或交互式输入）
2. 验证文件存在性和格式
3. 读取文件为 Buffer
4. 构造 FormData
5. 调用 API 上传
6. 显示上传进度
7. 返回图片 URL
```

### 实现方案

```typescript
// src/utils/upload.ts
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import chalk from 'chalk';

const ALLOWED_IMAGE_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_IMAGE_FORMATS.includes(ext)) {
    throw new Error(
      `不支持的图片格式: ${ext}。支持的格式: ${ALLOWED_IMAGE_FORMATS.join(', ')}`
    );
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`文件太大: ${(stats.size / 1024 / 1024).toFixed(2)}MB (最大 10MB)`);
  }
}

export function createImageFormData(imagePaths: string[]): FormData {
  const formData = new FormData();

  for (const imagePath of imagePaths) {
    validateImageFile(imagePath);

    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);

    formData.append('files', fileBuffer, {
      filename: fileName,
      contentType: `image/${path.extname(imagePath).slice(1)}`,
    });
  }

  return formData;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
```

### 添加图片命令

```typescript
// src/commands/product/images.ts
import chalk from 'chalk';
import ora from 'ora';
import { commerceApi } from '../../api/commerce.js';
import { createImageFormData, formatFileSize } from '../../utils/upload.js';
import { handleError } from '../../utils/error.js';
import fs from 'fs';

export async function addImages(productId: string, imagePaths: string[]) {
  try {
    if (imagePaths.length === 0) {
      console.log(chalk.yellow('请提供至少一张图片'));
      return;
    }

    // 显示文件信息
    console.log(chalk.cyan('\n准备上传:'));
    for (const imagePath of imagePaths) {
      const stats = fs.statSync(imagePath);
      console.log(`  ${chalk.gray('•')} ${imagePath} ${chalk.gray(`(${formatFileSize(stats.size)})`)}`);
    }

    const spinner = ora('正在上传图片...').start();

    const formData = createImageFormData(imagePaths);
    await commerceApi.products.addImages(productId, formData);

    spinner.succeed(chalk.green(`成功上传 ${imagePaths.length} 张图片！`));
  } catch (error) {
    handleError(error);
  }
}
```

---

## 数据格式与展示

### 表格展示

使用 `cli-table3` 展示列表数据：

```typescript
// src/utils/format.ts
import Table from 'cli-table3';
import chalk from 'chalk';
import dayjs from 'dayjs';

export function formatProductList(products: Product[]): string {
  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('名称'),
      chalk.cyan('价格'),
      chalk.cyan('库存'),
      chalk.cyan('状态'),
      chalk.cyan('创建时间'),
    ],
    colWidths: [15, 30, 12, 8, 10, 20],
  });

  products.forEach((product) => {
    table.push([
      product.id.slice(0, 12) + '...',
      product.name,
      `$${product.price.toFixed(2)}`,
      product.stock_quantity,
      product.is_active ? chalk.green('上架') : chalk.gray('下架'),
      dayjs(product.created_at).format('YYYY-MM-DD HH:mm'),
    ]);
  });

  return table.toString();
}

export function formatProduct(product: Product): string {
  return `
${chalk.bold('商品详情')}
${'─'.repeat(50)}
${chalk.gray('ID:')}           ${product.id}
${chalk.gray('名称:')}         ${product.name}
${chalk.gray('价格:')}         ${chalk.green('$' + product.price.toFixed(2))}
${chalk.gray('描述:')}         ${product.description || chalk.gray('无')}
${chalk.gray('库存:')}         ${product.stock_quantity}
${chalk.gray('状态:')}         ${product.is_active ? chalk.green('上架') : chalk.gray('下架')}
${chalk.gray('创建时间:')}     ${dayjs(product.created_at).format('YYYY-MM-DD HH:mm:ss')}
${chalk.gray('更新时间:')}     ${dayjs(product.updated_at).format('YYYY-MM-DD HH:mm:ss')}
${'─'.repeat(50)}
  `.trim();
}

export function formatOrderList(orders: Order[]): string {
  const table = new Table({
    head: [
      chalk.cyan('订单号'),
      chalk.cyan('客户'),
      chalk.cyan('金额'),
      chalk.cyan('状态'),
      chalk.cyan('时间'),
    ],
    colWidths: [20, 25, 12, 12, 20],
  });

  orders.forEach((order) => {
    table.push([
      order.id,
      order.customer_email,
      `$${order.total_amount.toFixed(2)}`,
      formatOrderStatus(order.status),
      dayjs(order.created_at).format('MM-DD HH:mm'),
    ]);
  });

  return table.toString();
}

function formatOrderStatus(status: string): string {
  const statusMap: Record<string, { text: string; color: typeof chalk.green }> = {
    pending: { text: '待处理', color: chalk.yellow },
    paid: { text: '已支付', color: chalk.blue },
    shipped: { text: '已发货', color: chalk.cyan },
    completed: { text: '已完成', color: chalk.green },
    cancelled: { text: '已取消', color: chalk.gray },
  };

  const mapped = statusMap[status] || { text: status, color: chalk.white };
  return mapped.color(mapped.text);
}
```

---

## 错误处理

### 错误类型

```typescript
// src/utils/error.ts
import chalk from 'chalk';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = '未登录，请先执行 optima auth login') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
```

### 错误处理器

```typescript
export function handleError(error: unknown): void {
  if (error instanceof AuthenticationError) {
    console.error(chalk.red('❌ ' + error.message));
    process.exit(1);
  }

  if (error instanceof ValidationError) {
    console.error(chalk.yellow('⚠️  ' + error.message));
    process.exit(1);
  }

  if (error instanceof ApiError) {
    console.error(chalk.red('❌ API 错误: ' + error.message));
    if (error.statusCode) {
      console.error(chalk.gray(`   状态码: ${error.statusCode}`));
    }
    if (error.code) {
      console.error(chalk.gray(`   错误码: ${error.code}`));
    }
    process.exit(1);
  }

  if (error instanceof Error) {
    console.error(chalk.red('❌ ' + error.message));
    if (process.env.DEBUG) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }

  console.error(chalk.red('❌ 未知错误:'), error);
  process.exit(1);
}
```

### 网络重试

```typescript
// src/utils/retry.ts
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        onRetry?.(attempt, lastError);
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError!;
}
```

---

## 配置管理

### 配置项

```typescript
interface ConfigSchema {
  // 认证信息
  auth: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  };

  // API 配置
  api: {
    baseUrl: string;
    timeout: number;
  };

  // CLI 配置
  cli: {
    defaultLimit: number;
    colorOutput: boolean;
    verbose: boolean;
  };
}
```

### 配置命令

```typescript
// src/commands/config.ts
import chalk from 'chalk';
import { config, getConfig, updateConfig } from '../utils/config.js';

export function configSet(key: string, value: string) {
  try {
    // 类型转换
    let parsedValue: any = value;
    if (value === 'true') parsedValue = true;
    if (value === 'false') parsedValue = false;
    if (!isNaN(Number(value))) parsedValue = Number(value);

    updateConfig(key as any, parsedValue);
    console.log(chalk.green(`✓ ${key} = ${value}`));
  } catch (error) {
    console.error(chalk.red(`设置配置失败: ${error.message}`));
  }
}

export function configGet(key: string) {
  try {
    const value = getConfig(key as any);
    if (value === undefined) {
      console.log(chalk.yellow(`配置项 ${key} 不存在`));
    } else {
      console.log(chalk.cyan(key + ':'), JSON.stringify(value, null, 2));
    }
  } catch (error) {
    console.error(chalk.red(`获取配置失败: ${error.message}`));
  }
}

export function configList() {
  const allConfig = config.store;
  console.log(chalk.bold('当前配置:'));
  console.log(JSON.stringify(allConfig, null, 2));
}
```

---

## Claude Code 集成

### 自动配置机制

Optima CLI 在安装时会通过 `postinstall` hook 自动配置 Claude Code 集成，用户无需手动操作。

```typescript
// src/postinstall.ts
import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');

const OPTIMA_CLI_SECTION = `
## Optima CLI
Optima CLI 是用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

安装：\`npm install -g @optima-chat/optima-cli@latest\`

### 使用方式

直接用自然语言描述你的需求，我会自动调用相应的 optima 命令。

**商品管理示例**:
- "创建珍珠耳环，299 美元，库存 10"
- "查看所有商品"
- "商品 prod_123 改价 399"
- "删除商品 prod_456"

**订单管理示例**:
- "今天的订单"
- "待发货订单"
- "订单 order_123 发货，DHL123456"
- "取消订单 order_789"

**库存管理示例**:
- "库存低于 5"
- "商品 prod_123 库存改 50"

**物流查询示例**:
- "香港到纽约运费，0.5 公斤"
- "跟踪 DHL123456"

### 可用命令（供参考，建议用自然语言）

**商品**: \`optima product create/list/get/update/delete/add-images\`
**订单**: \`optima order list/get/ship/complete/cancel\`
**库存**: \`optima inventory low-stock/update/history\`
**物流**: \`optima shipping calculate/create/track\`
**店铺**: \`optima shop info/update/setup\`
**认证**: \`optima auth login/logout/whoami\`
`;

async function setupClaude() {
  try {
    // 确保 .claude 目录存在
    const claudeDir = path.dirname(CLAUDE_MD_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // 读取现有内容
    let existingContent = '';
    if (fs.existsSync(CLAUDE_MD_PATH)) {
      existingContent = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

      // 如果已包含 Optima CLI 配置，先移除
      if (existingContent.includes('## Optima CLI')) {
        existingContent = existingContent.replace(
          /## Optima CLI[\s\S]*?(?=\n##|$)/,
          ''
        );
      }
    }

    // 写入新配置
    const newContent = existingContent.trim() + '\n\n' + OPTIMA_CLI_SECTION.trim() + '\n';
    fs.writeFileSync(CLAUDE_MD_PATH, newContent, 'utf-8');

    console.log('✓ Optima CLI 已配置到 Claude Code');
    console.log('  现在可以在 Claude Code 中用自然语言管理店铺了！');
  } catch (error) {
    // 静默失败，不影响安装
    console.log('⚠️  Claude Code 配置失败，可以稍后手动运行: optima setup-claude');
  }
}

// 只在全局安装时执行
if (process.env.npm_config_global === 'true') {
  setupClaude();
}

export { setupClaude };
```

### 手动配置命令（备用）

如果自动配置失败，用户可以手动运行：

```typescript
// src/commands/setup-claude.ts
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');

const OPTIMA_CLI_SECTION = `
## Optima CLI
Optima CLI 是 Optima Commerce 的命令行工具，用于管理电商业务。

安装：\`npm install -g @optima-chat/optima-cli\`

### 常用命令

**商品管理**:
- 创建商品: \`optima product create --title "商品名" --price 299 --stock 10\`
- 商品列表: \`optima product list\`
- 商品详情: \`optima product get <product-id>\`
- 更新商品: \`optima product update <product-id> --price 399\`
- 删除商品: \`optima product delete <product-id>\`

**订单管理**:
- 订单列表: \`optima order list\`
- 订单详情: \`optima order get <order-id>\`
- 发货: \`optima order ship <order-id> --tracking DHL123\`
- 完成订单: \`optima order complete <order-id>\`

**库存管理**:
- 低库存: \`optima inventory low-stock --threshold 5\`
- 更新库存: \`optima inventory update <product-id> --quantity 20\`

**店铺管理**:
- 店铺信息: \`optima shop info\`
- 更新店铺: \`optima shop update\`

**认证**:
- 登录: \`optima auth login\`
- 查看当前用户: \`optima auth whoami\`

### 自然语言示例

你可以直接对我说：
- "帮我创建一个珍珠耳环商品，售价 299 美元"
- "查看今天的订单"
- "把订单 #123 标记为已发货，快递单号 DHL123456"
- "查看库存低于 5 的商品"
- "更新商品 prod_123 的价格为 399 美元"

我会自动调用相应的 optima 命令来完成操作。
`;

export async function setupClaude(options: { force?: boolean }) {
  try {
    // 检查 .claude 目录是否存在
    const claudeDir = path.dirname(CLAUDE_MD_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // 检查 CLAUDE.md 是否已存在
    let existingContent = '';
    if (fs.existsSync(CLAUDE_MD_PATH)) {
      existingContent = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

      // 如果已包含 Optima CLI 配置
      if (existingContent.includes('## Optima CLI') && !options.force) {
        const { shouldUpdate } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldUpdate',
            message: 'CLAUDE.md 中已存在 Optima CLI 配置，是否更新？',
            default: false,
          },
        ]);

        if (!shouldUpdate) {
          console.log(chalk.yellow('取消更新'));
          return;
        }

        // 移除旧的 Optima CLI 配置
        existingContent = existingContent.replace(
          /## Optima CLI[\s\S]*?(?=\n##|$)/,
          ''
        );
      }
    }

    // 写入新配置
    const newContent = existingContent.trim() + '\n\n' + OPTIMA_CLI_SECTION.trim() + '\n';
    fs.writeFileSync(CLAUDE_MD_PATH, newContent, 'utf-8');

    console.log(chalk.green('✓ Claude Code 配置已更新！'));
    console.log(chalk.gray(`  位置: ${CLAUDE_MD_PATH}`));
    console.log(chalk.cyan('\n现在你可以在 Claude Code 中使用自然语言操作 Optima Commerce 了！'));
  } catch (error) {
    console.error(chalk.red('设置失败:'), error.message);
  }
}
```

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
  - [ ] `optima shipping calculate`
  - [ ] `optima shipping create`
  - [ ] `optima shipping track`
- [ ] 店铺管理
  - [ ] `optima shop info`
  - [ ] `optima shop update`
  - [ ] `optima shop setup`
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
| `product create` | `/products` | POST |
| `product list` | `/products` | GET |
| `product get` | `/products/{id}` | GET |
| `product update` | `/products/{id}` | PUT |
| `product delete` | `/products/{id}` | DELETE |
| `product add-images` | `/products/{id}/images` | POST |
| `order list` | `/orders/merchant` | GET |
| `order get` | `/orders/merchant/{id}` | GET |
| `order ship` | `/orders/merchant/{id}/ship` | POST |
| `order complete` | `/orders/merchant/{id}/complete` | POST |
| `order cancel` | `/orders/merchant/{id}/cancel` | POST |
| `inventory low-stock` | `/inventory/low-stock` | GET |
| `inventory update` | `/inventory/update` | POST |
| `shipping calculate` | `/shipping/calculate` | POST |
| `shipping track` | `/shipping/track/{number}` | GET |
| `shop info` | `/shop/info` | GET |
| `shop update` | `/merchant/profile` | PUT |

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
