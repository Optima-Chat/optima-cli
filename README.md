<div align="center">

# ⚡️ Optima CLI

### 用自然语言管理你的电商店铺

**专为 Claude Code 设计的对话式 CLI 工具**

[![NPM Version](https://img.shields.io/npm/v/@optima-chat/optima-cli?style=flat&logo=npm&color=CB3837)](https://www.npmjs.com/package/@optima-chat/optima-cli)
[![Downloads](https://img.shields.io/npm/dt/@optima-chat/optima-cli?style=flat&logo=npm&color=CB3837)](https://www.npmjs.com/package/@optima-chat/optima-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat&logo=node.js)](https://nodejs.org/)

[网站](https://cli.optima.shop) • [文档](https://github.com/Optima-Chat/optima-cli#readme) • [NPM](https://www.npmjs.com/package/@optima-chat/optima-cli) • [问题反馈](https://github.com/Optima-Chat/optima-cli/issues)

</div>

---

## 🎯 简介

Optima CLI 是 [Optima Commerce](https://www.optima.shop) 生态的命令行工具，**专为 Claude Code 设计**。

无需记住命令 - 直接用中文对话，Claude 会自动调用相应的 CLI 命令来管理你的电商店铺。

```bash
# 传统方式（需要记住命令）
optima product create --title "陶瓷杯" --price 89 --stock 20

# Optima CLI + Claude Code（自然语言）
"创建陶瓷杯商品，89 美元，库存 20" ✨
```

## 🎬 演示

### Claude Code 自然语言交互
> 这是 Optima CLI 最强大的功能 - 用自然语言管理电商店铺

<!--
TODO: 录制演示 GIF 后取消注释
![Claude Code 演示](.github/assets/demo-claude-code.gif)
-->

**计划展示场景**：
- 💬 用中文对话创建商品
- 📦 自然语言查询订单
- 🚚 对话式订单发货
- 📊 智能库存管理

> 📹 演示内容录制中。参见 [DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) 查看录制计划

### 安装和基本使用
<!--
TODO: 录制安装演示 GIF
![安装演示](.github/assets/demo-install.gif)
-->

### 商品管理
<!--
TODO: 录制商品管理演示 GIF
![商品管理演示](.github/assets/demo-product.gif)
-->

## ✨ 核心特性

- 🤖 **对话式操作** - 在 Claude Code 中用自然语言管理店铺，无需记住命令
- ⚡️ **即开即用** - 一行命令安装，自动配置 Claude Code 集成
- 📦 **功能完整** - 14 个模块，72 个命令，覆盖商品、订单、库存、物流等全流程
- 🌍 **国际化支持** - 内置多语言翻译管理，支持商品、分类、商户的国际化
- 🎨 **双输出模式** - 默认 JSON 格式（AI 友好），支持 `--pretty` 彩色表格输出
- 🤖 **AI 优先设计** - 所有命令默认 JSON 输出，可被 AI Agent 直接解析和处理
- 🔐 **安全可靠** - OAuth 2.0 Device Flow 认证，Token 自动刷新
- 🛠 **开发者友好** - TypeScript 类型安全，完善的错误处理，单元测试覆盖

## 🚀 快速开始

**要求**：Node.js >= 18

### 1. 安装

```bash
npm install -g @optima-chat/optima-cli@latest
```

安装完成后会自动配置 Claude Code 集成。如需在项目中启用，对 Claude 说：

```
"在这个项目启用 Optima CLI"
```

### 2. 登录你的账号

在 Claude Code 中，你可以用自然语言说：

```
"登录 Optima"
"Optima 登录"
"帮我登录到 Optima"
```

Claude 会自动打开浏览器引导你完成 OAuth 授权。

### 3. 开始用自然语言管理店铺 ✨

在 Claude Code 中，你可以这样说：

```
- "创建珍珠耳环商品，299 美元，库存 10"
- "查看今天的订单"
- "订单 order_123 发货，快递单号 DHL123456"
- "库存低于 5 的商品"
- "商品 prod_123 改价 399"
- "给商品添加中文翻译"
```

Claude 会自动调用对应的 `optima` 命令来完成操作。

**就是这么简单！** 🎉

## 📦 功能模块

Optima CLI 提供 **14 个功能模块**，**72 个命令**，覆盖电商全流程：

| 模块 | 命令数 | 说明 |
|------|--------|------|
| 🔐 **auth** | 3 | OAuth 2.0 认证（login, logout, whoami） |
| 📦 **product** | 7 | 商品 CRUD，图片管理，URL |
| 🏷 **category** | 5 | 分类 CRUD |
| 🎨 **variant** | 6 | SKU/规格管理 |
| 📋 **order** | 6 | 订单查询、发货、取消、标记送达 |
| 💰 **refund** | 2 | 退款创建和查询 |
| 📊 **inventory** | 4 | 库存预警、调整、历史、预留 |
| 🏪 **merchant** | 4 | 商户资料管理，URL |
| 🚚 **shipping** | 3 | 运费计算、物流历史、状态更新 |
| 🌍 **shipping-zone** | 5 | 运费区域和费率配置 |
| 📤 **upload** | 3 | 图片、视频、文件上传 |
| 💬 **conversation** | 7 | 客服对话管理 |
| 💳 **transfer** | 2 | 财务转账和汇总 |
| 🌐 **i18n** | 15 | 多语言翻译管理（商品/分类/商户） |

## 🎨 输出格式

Optima CLI 支持两种输出格式，适用于不同场景：

### JSON 模式（默认，AI 友好）

适合 AI Agent 和程序化处理，返回结构化 JSON 数据：

```bash
optima product list --limit 2
# 输出标准 JSON 格式
{
  "success": true,
  "data": {
    "products": [...],
    "total": 2,
    "page": 1,
    "has_next": false
  }
}
```

**JSON 输出特性**：
- ✅ 所有 72 个命令默认输出 JSON 格式
- ✅ 统一的响应格式：`{ success, data, message?, error? }`
- ✅ 完整的数据结构，无信息丢失
- ✅ 适合 AI Agent 解析和自动化脚本
- ✅ 向后兼容：可使用 `--pretty` 切换到表格模式

### Pretty 模式（人类可读）

适合人类阅读，提供彩色终端输出和表格化数据：

```bash
optima product list --limit 2 --pretty
# 输出彩色表格，包含商品名称、价格、库存等
```

**使用场景**：

**JSON 模式**（默认）：
- AI Agent 调用（如 Claude Code）
- 自动化脚本和 CI/CD 流程
- 需要解析数据的程序
- 数据导出和集成

**Pretty 模式**：
- 在终端手动执行命令
- 快速查看数据和调试
- 人类可读性优先

**示例对比**：

```bash
# JSON 模式（AI 友好，默认）
$ optima merchant info
{
  "success": true,
  "data": {
    "merchant": {
      "id": "...",
      "name": "徐昊的全球小店",
      "slug": "xuhao-global-store",
      "default_currency": "USD",
      ...
    }
  }
}

# Pretty 模式（人类友好）
$ optima merchant info --pretty
✔ 商户信息获取成功

店铺名称: 徐昊的全球小店
店铺 Slug: xuhao-global-store
默认货币: USD
...
```

> **提示**：在 Claude Code 中，Claude 会根据需要自动选择合适的输出格式。

## 🤖 非交互模式 / CI/CD

**v0.16.0 新增**：Optima CLI 现在支持智能环境检测，自动适配终端用户和 AI/CI/CD 环境！

### 🎯 自动环境检测

Optima CLI 自动检测运行环境，无需手动配置：

| 环境 | 行为 | 示例 |
|------|------|------|
| **终端** | 缺少参数时显示友好交互提示 | `$ optima product create`<br>📦 创建新商品<br>? 商品名称: _ |
| **AI / CI/CD** | 自动禁用交互，立即报错 | `$ optima product create`<br>⚠️ 缺少必需参数: --title |

### 🔧 环境变量控制

**强制启用交互模式**（终端检测失败时）：
```bash
export OPTIMA_INTERACTIVE=1
```

**强制禁用交互模式**：
```bash
export NON_INTERACTIVE=1
# 或
export OPTIMA_NON_INTERACTIVE=true
```

**CI 环境自动检测**：
- GitHub Actions (`CI=true`)
- GitLab CI (`GITLAB_CI=true`)
- Jenkins (`JENKINS_URL` 存在)
- Travis CI (`TRAVIS=true`)
- 等其他 CI 平台

### 💻 CI/CD 使用示例

#### GitHub Actions

```yaml
name: Deploy Products
on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Optima CLI
        run: npm install -g @optima-chat/optima-cli

      - name: Create Products
        env:
          OPTIMA_TOKEN: ${{ secrets.OPTIMA_TOKEN }}
        run: |
          # CI 环境自动禁用交互提示
          optima product create \
            --title "自动化商品" \
            --price 99 \
            --stock 100

          # 删除操作需要 --yes 确认
          optima product delete --id prod-123 --yes
```

#### GitLab CI

```yaml
stages:
  - deploy

deploy_products:
  stage: deploy
  image: node:18
  before_script:
    - npm install -g @optima-chat/optima-cli
  script:
    # CI 环境自动检测，无需额外配置
    - optima product list --json > products.json
    - optima product create --title "新商品" --price 49
  variables:
    OPTIMA_TOKEN: $OPTIMA_TOKEN
```

#### Docker

```dockerfile
FROM node:18-alpine

RUN npm install -g @optima-chat/optima-cli

# 非交互环境，需提供所有参数
CMD ["optima", "product", "list", "--json"]
```

```bash
# 运行容器
docker run -e OPTIMA_TOKEN=$OPTIMA_TOKEN optima-cli
```

### ✅ 确认操作（`--yes` 标志）

删除、取消等危险操作在终端和 CI 环境都需要明确确认：

```bash
# 终端：显示确认提示
$ optima product delete --id prod-123
⚠️  即将删除商品: prod-123
? 确定要删除此商品吗？ (y/N)

# CI/CD：使用 --yes 跳过确认
$ optima product delete --id prod-123 --yes
✓ 商品删除成功！
```

需要 `--yes` 的命令：
- `product delete`, `category delete`, `variant delete`
- `order cancel`, `order complete`
- `shipping-zone delete`
- `cleanup`

### 📋 受影响的命令（20 个）

以下命令支持自动环境检测：

| 类别 | 命令 | 非交互要求 |
|------|------|-----------|
| **核心** | `shipping calculate`, `product create`, `order ship`, `category create` | 提供所有必需参数 |
| **常用** | `variant create`, `inventory update/reserve`, `shipping-zone create/add-rate` | 提供所有必需参数 |
| **确认** | `product/category/variant delete`, `order cancel/complete`, `cleanup` | 添加 `--yes` 标志 |
| **i18n** | `i18n product/category/merchant create` | 提供 `--lang` 和 `--name` |

### 📚 更多信息

完整技术文档请参阅 [`docs/NON_INTERACTIVE_MODE_DESIGN.md`](./docs/NON_INTERACTIVE_MODE_DESIGN.md)

---

## 📖 命令参考

> **提示**：推荐通过 Claude Code 用自然语言调用，以下为完整命令参考。

### 🔐 认证管理

```bash
optima auth login       # OAuth 登录（Device Flow）
optima auth logout      # 登出并清除凭证
optima auth whoami      # 查看当前用户
```

**环境变量认证**（适用于容器/CI/CD）：

```bash
# 设置环境变量后直接使用，无需 optima auth login
export OPTIMA_TOKEN=<your_access_token>
optima product list

# Docker 容器
docker run -e OPTIMA_TOKEN=<your_token> optima-cli product list

# CI/CD 流水线
export OPTIMA_TOKEN=${{ secrets.OPTIMA_TOKEN }}
optima product create --title "商品"
```

**认证优先级**：`OPTIMA_TOKEN` 环境变量 > 配置文件（`~/.config/optima-cli`）

**自定义 Backend 地址**（适用于开发/测试环境）：

```bash
# 自定义 Commerce API 地址
export OPTIMA_API_URL=http://localhost:8000
optima product list

# 自定义 Auth API 地址
export OPTIMA_AUTH_URL=http://localhost:3000
optima auth login

# Docker 开发环境
docker run \
  -e OPTIMA_TOKEN=<your_token> \
  -e OPTIMA_API_URL=http://host.docker.internal:8000 \
  optima-cli product list
```

**默认 Backend**：
- Commerce API: `https://api.optima.shop`
- Auth API: `https://auth.optima.shop`

### 📦 商品管理

```bash
optima product create                                 # 创建商品
optima product list [--limit 20]                      # 商品列表
optima product get --id <id>                          # 商品详情
optima product update --id <id>                       # 更新商品
optima product delete --id <id> [-y]                  # 删除商品
optima product add-images --id <id> --path <...>     # 添加本地图片
optima product add-images --id <id> --url <...>      # 添加图片URL
```

**示例**：

```bash
# 创建商品
optima product create \
  --title "手工陶瓷杯" \
  --price 89 \
  --currency USD \
  --stock 20 \
  --description "精美手工制作"

# 更新商品
optima product update --id prod_123 \
  --price 99 \
  --stock 50

# 添加本地图片
optima product add-images --id prod_123 --path ./img1.jpg ./img2.jpg

# 添加图片 URL（避免重复上传）
optima product add-images --id prod_123 --url https://example.com/image.jpg

# 混合使用
optima product add-images --id prod_123 --path ./local.jpg --url https://example.com/remote.jpg
```

### 🏷 分类管理

```bash
optima category list                    # 分类列表
optima category create                  # 创建分类
optima category get --id <id>           # 分类详情
optima category update --id <id>        # 更新分类
optima category delete --id <id> [-y]   # 删除分类
```

### 🎨 商品变体（SKU/规格）

```bash
optima variant list --product-id <product-id>                              # 变体列表
optima variant create --product-id <product-id>                            # 创建变体
optima variant get --product-id <product-id> --id <id>                     # 变体详情
optima variant update --product-id <product-id> --id <id>                  # 更新变体
optima variant delete --product-id <product-id> --id <id> [-y]             # 删除变体
optima variant add-images --product-id <product-id> --id <id> --path <...> # 添加变体图片
```

**示例**：

```bash
# 创建变体
optima variant create --product-id prod_123 \
  --sku "CUP-S-WHITE" \
  --price 89 \
  --stock 10 \
  --attributes '{"size":"S","color":"White"}'
```

### 📋 订单管理

```bash
optima order list [--status pending]        # 订单列表
optima order get --id <id>                   # 订单详情
optima order ship --id <id>                  # 订单发货
optima order complete --id <id>              # 完成订单
optima order cancel --id <id>                # 取消订单
optima order mark-delivered --id <id>        # 标记已送达
```

**示例**：

```bash
# 发货
optima order ship --id order_123 \
  --tracking DHL123456 \
  --carrier DHL

# 取消订单
optima order cancel --id order_456 \
  --reason "客户要求取消" \
  --yes
```

### 💰 退款管理

```bash
optima refund create --order-id <order-id>    # 创建退款
optima refund get --id <id>                   # 退款详情
```

**示例**：

```bash
# 创建退款
optima refund create --order-id order_123 \
  --amount 50 \
  --reason requested_by_customer
```

### 📊 库存管理

```bash
optima inventory low-stock [--threshold 5]    # 低库存商品
optima inventory update --id <id>             # 更新库存
optima inventory history --id <id>            # 库存历史
optima inventory reserve --id <id>            # 预留库存
```

**示例**：

```bash
# 查看低库存
optima inventory low-stock --threshold 10

# 更新库存
optima inventory update --id prod_123 \
  --quantity 50 \
  --reason "补货"
```

### 🏪 商户管理

```bash
optima merchant info          # 获取商户信息
optima merchant update        # 更新商户资料
optima merchant setup         # 初始化商户资料（首次使用）
optima merchant url [--open]  # 获取店铺链接（可在浏览器打开）
```

**初始化商户资料示例**：

```bash
# 交互式模式（适合本地使用）
optima merchant setup

# 非交互式模式（适合容器/CI/CD，所有必填字段通过参数提供）
optima merchant setup \
  --name "我的店铺" \
  --origin-country-alpha2 HK \
  --origin-city Saikung \
  --origin-state "New Territories" \
  --origin-line-1 "G/F NO.93, TAI PO TSAI VILLAGE" \
  --contact-name "XU, HAO" \
  --contact-phone "53736279" \
  --contact-email "merchant@example.com"

# 带可选字段
optima merchant setup \
  --name "我的店铺" \
  --description "高品质商品" \
  --slug "my-store" \
  --default-currency USD \
  --origin-country-alpha2 CN \
  --origin-city "深圳" \
  --origin-state "广东省" \
  --origin-line-1 "南山区科技园" \
  --origin-line-2 "创业大厦10楼" \
  --origin-postal-code "518000" \
  --contact-name "张三" \
  --contact-phone "13800138000" \
  --contact-email "merchant@example.com" \
  --company-name "深圳某某科技有限公司"
```

**必填字段**：
- `--name`: 商户名称
- `--origin-country-alpha2`: 发货国家代码（2位，如 CN, US, HK）
- `--origin-city`: 发货城市
- `--origin-state`: 发货省/州
- `--origin-line-1`: 发货地址第一行
- `--contact-name`: 联系人姓名
- `--contact-phone`: 联系电话
- `--contact-email`: 联系邮箱

### 🚚 物流管理

```bash
optima shipping calculate                     # 计算运费
optima shipping history --order-id <order-id> # 物流历史
optima shipping update-status --id <id>       # 更新物流状态
```

**示例**：

```bash
# 计算运费
optima shipping calculate \
  --country US \
  --postal-code 10001 \
  --weight 0.5
```

### 🌍 运费区域管理

```bash
optima shipping-zone list                            # 运费区域列表
optima shipping-zone create                          # 创建运费区域
optima shipping-zone delete --id <id> [-y]           # 删除运费区域
optima shipping-zone list-rates --zone-id <zone-id>  # 查看区域费率
optima shipping-zone add-rate --zone-id <zone-id>    # 添加运费费率
```

**示例**：

```bash
# 创建区域
optima shipping-zone create \
  --name "北美区域" \
  --countries US,CA,MX

# 添加费率
optima shipping-zone add-rate --zone-id zone_123 \
  --price 15 \
  --currency USD \
  --min-weight 0 \
  --free-threshold 100
```

### 📤 文件上传

```bash
optima upload image --path <path>    # 上传图片
optima upload video --path <path>    # 上传视频
optima upload file --path <path>     # 上传文件
```

### 💬 对话管理

```bash
optima conversation list                       # 对话列表
optima conversation get --id <id>              # 对话详情
optima conversation create                     # 创建对话
optima conversation close --id <id>            # 关闭对话
optima conversation messages --id <id>         # 查看消息
optima conversation send --id <id>             # 发送消息
optima conversation mark-read --id <id>        # 标记已读
```

### 💳 财务管理

```bash
optima transfer list       # 转账列表
optima transfer summary    # 财务汇总
```

### 🌐 国际化翻译

Optima CLI 内置完整的多语言翻译管理系统：

```bash
# 语言管理
optima i18n languages [--all]    # 查看支持的语言

# 商品翻译
optima i18n product list --product-id <product-id>
optima i18n product get --product-id <product-id> --lang <lang>
optima i18n product create --product-id <product-id>
optima i18n product update --product-id <product-id> --lang <lang>
optima i18n product delete --product-id <product-id> --lang <lang> [-y]

# 分类翻译
optima i18n category list --category-id <category-id>
optima i18n category get --category-id <category-id> --lang <lang>
optima i18n category create --category-id <category-id>
optima i18n category update --category-id <category-id> --lang <lang>
optima i18n category delete --category-id <category-id> --lang <lang> [-y]

# 商户翻译
optima i18n merchant list
optima i18n merchant get --lang <lang>
optima i18n merchant create
optima i18n merchant update --lang <lang>
optima i18n merchant delete --lang <lang> [-y]
```

**示例**：

```bash
# 查看支持的语言
optima i18n languages

# 为商品添加中文翻译
optima i18n product create --product-id prod_123 \
  --lang zh-CN \
  --name "手工陶瓷杯" \
  --description "精美的手工制作陶瓷杯" \
  --meta-title "手工陶瓷杯 - 传统工艺"
```

## 💬 自然语言示例

在 Claude Code 中，你可以用非常简洁的自然语言描述需求：

**商品管理**：
- "创建陶瓷杯商品，89 美元，库存 20"
- "查看所有商品"
- "商品 prod_123 改价 99"
- "删除商品 prod_456"
- "给商品 prod_789 添加这张图片"
- "把产品 handle 改成英文"
- "创建白色 S 码变体，SKU 为 CUP-S-WHITE"

**订单处理**：
- "今天的订单"
- "待发货订单"
- "订单 order_123 详情"
- "订单 order_456 发货，快递单号 DHL123456"
- "取消订单 order_789"
- "标记订单 order_123 已送达"

**库存管理**：
- "库存低于 5 的商品"
- "商品 prod_123 库存改为 50"
- "查看商品 prod_456 的库存历史"
- "预留商品 prod_789 的 10 个库存"

**物流管理**：
- "计算从香港到纽约的运费，0.5 公斤"
- "查看订单 order_123 的物流历史"
- "创建北美运费区域，包含 US、CA、MX"

**国际化管理**：
- "查看支持的语言"
- "给商品 prod_123 添加中文翻译"
- "更新商品 prod_456 的日语翻译"
- "查看商户的所有翻译"

**客服管理**：
- "查看所有对话"
- "创建新的客户对话"
- "给对话 conv_123 发送消息"

> **提示**：说话越自然越好，Claude 会理解你的意图并调用正确的命令。

## 🛠 工具命令

```bash
optima init            # 在当前项目启用 Optima CLI
optima cleanup         # 清理配置文件
optima version         # 显示版本信息
```

## 🏗 项目状态

**当前版本：v0.14.0** 🎉

✅ **已完成功能**：
- ✅ 完整的 OAuth 2.0 认证系统（Device Flow + 自动刷新）
- ✅ 14 个核心功能模块
- ✅ 72 个完整命令
- ✅ 默认 JSON 输出（AI 优先设计）
- ✅ 双输出模式（JSON + Pretty）
- ✅ 国际化翻译管理系统（支持 5 种语言）
- ✅ Claude Code 深度集成
- ✅ 完善的错误处理和用户提示
- ✅ 单元测试覆盖（19 tests, 81% coverage）
- ✅ 交互式命令提示

**功能覆盖率**：100%（所有核心商户运营功能）

**v0.14.0 重要更新**：
- 🎯 **Breaking Change**: 默认输出改为 JSON 格式
- 🎨 使用 `--pretty` 标志获取彩色表格输出
- ✅ 所有 72 个命令支持 JSON 输出
- ✅ 向后兼容：环境变量 `OPTIMA_CLI_FORMAT=pretty` 保持旧行为
- ✅ 完整的单元测试基础设施

## 🔧 开发

```bash
# 克隆仓库
git clone https://github.com/Optima-Chat/optima-cli.git
cd optima-cli

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build

# 测试
npm test                 # 运行所有测试
npm run test:watch       # 监听模式
npm run test:coverage    # 生成覆盖率报告

# 发布到 NPM
npm version minor        # 升级版本号
git push --follow-tags   # 推送触发自动发布
```

## 📚 技术栈

- **语言**：TypeScript 5.3
- **CLI 框架**：Commander.js
- **HTTP 客户端**：Axios
- **交互提示**：Inquirer.js
- **UI 组件**：Chalk（颜色）+ cli-table3（表格）+ Ora（加载动画）
- **配置存储**：Conf（加密）
- **认证**：OAuth 2.0 Device Flow
- **测试**：Jest + ts-jest（19 tests, 81% coverage）

## 📝 许可证

[MIT License](./LICENSE)

## 🔗 相关链接

- [Optima Commerce 官网](https://www.optima.shop)
- [Agentic Chat](https://ai.optima.chat) - 卖家对话界面
- [Optima Store](https://go.optima.shop) - 买家购物前端
- [Claude Code](https://claude.com/claude-code)
- [NPM Package](https://www.npmjs.com/package/@optima-chat/optima-cli)
- [GitHub Issues](https://github.com/Optima-Chat/optima-cli/issues)

## 💬 支持

遇到问题？

- 提交 [Issue](https://github.com/Optima-Chat/optima-cli/issues)
- 查看 [完整命令列表](.claude/CLAUDE.md)
- 联系团队：support@optima.chat

---

**由 [Optima Commerce Team](https://www.optima.shop) 用 ❤️ 打造**
