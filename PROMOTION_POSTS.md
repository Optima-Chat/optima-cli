# 推广文案模板

## 📱 Twitter/X

### 版本 1（简洁版）
```
🎉 Optima CLI - 用自然语言管理电商店铺

专为 @ClaudeAI Code 设计的 CLI 工具
✨ 15 个模块，78 个命令
🗣️ 直接用中文对话，无需记住命令
🔐 OAuth 2.0 安全认证

npm install -g @optima-chat/optima-cli

🔗 https://cli.optima.shop
⭐️ https://github.com/Optima-Chat/optima-cli

#OpenSource #CLI #TypeScript #AI
```

### 版本 2（演示版）
```
传统方式：
optima product create --title "陶瓷杯" --price 89 --stock 20

Optima CLI + Claude Code：
"创建陶瓷杯商品，89 美元，库存 20" ✨

专为 Claude Code 设计的电商管理 CLI
🚀 https://cli.optima.shop

#DeveloperTools #OpenSource
```

---

## 🌐 Product Hunt

### Title
Optima CLI - Natural language e-commerce CLI for Claude Code

### Tagline
Manage your e-commerce store with natural language, no commands to remember

### Description
Optima CLI is a command-line tool designed specifically for Claude Code, allowing you to manage your entire e-commerce business through natural language conversations.

**Key Features:**
- 🗣️ Natural language operation - Manage your store in Chinese/English
- 📦 15 modules, 78 commands - Complete e-commerce workflow
- 🔐 OAuth 2.0 authentication - Secure Device Flow with auto token refresh
- 🌍 i18n support - Multi-language translation management
- 🎨 Beautiful output - Colorful terminal, table display, loading animations

**Example:**
Instead of:
`optima product create --title "Ceramic Cup" --price 89 --stock 20`

Just say:
"Create a ceramic cup product, 89 dollars, stock 20" ✨

**Tech Stack:** TypeScript, Commander.js, Inquirer.js, OAuth 2.0

Perfect for developers who want to speed up e-commerce operations with AI-powered natural language interface.

### Topics/Categories
- Developer Tools
- E-commerce
- Command Line Tools
- Artificial Intelligence
- Open Source

---

## 💬 V2EX

### 标题
Optima CLI - 用自然语言管理电商店铺，专为 Claude Code 设计

### 正文
大家好，

我做了一个叫 Optima CLI 的命令行工具，专门为 Claude Code 设计的电商管理 CLI。

**核心思路：**

传统 CLI 需要记住大量命令和参数，比如：
```bash
optima product create --title "陶瓷杯" --price 89 --stock 20 --currency USD --description "精美手工制作"
```

有了 Optima CLI + Claude Code，你只需要说：
```
"创建陶瓷杯商品，89 美元，库存 20"
```

Claude 会自动帮你调用对应的命令。

**功能：**
- 15 个模块：商品、订单、库存、物流、国际化等
- 78 个命令：覆盖电商运营全流程
- OAuth 2.0 认证：安全可靠
- 多语言支持：国际化翻译管理
- TypeScript：类型安全

**快速开始：**
```bash
npm install -g @optima-chat/optima-cli
optima auth login
```

然后在 Claude Code 中用自然语言操作就行了。

**项目地址：**
- GitHub: https://github.com/Optima-Chat/optima-cli
- 官网: https://cli.optima.shop
- NPM: https://www.npmjs.com/package/@optima-chat/optima-cli

目前是 v0.6.2 版本，功能基本完整，欢迎试用和反馈！

---

## 📝 掘金/知乎

### 标题
Optima CLI：用自然语言管理电商店铺的开源 CLI 工具

### 正文
## 背景

作为开发者，我们每天都要用各种 CLI 工具。但问题是，每个工具都有一堆命令要记，参数还特别多。尤其是电商管理这种场景，命令更是复杂。

所以我做了 **Optima CLI**，一个专为 Claude Code 设计的对话式 CLI 工具。

## 核心理念

**传统方式**需要记住命令：
```bash
optima product create \
  --title "手工陶瓷杯" \
  --price 89 \
  --currency USD \
  --stock 20 \
  --description "精美的手工制作陶瓷杯"
```

**Optima CLI** 只需要说人话：
```
"创建陶瓷杯商品，89 美元，库存 20"
```

Claude Code 会自动帮你调用对应的命令。

## 功能特性

### 1. 自然语言操作
在 Claude Code 中直接用中文对话：
- "查看今天的待发货订单"
- "订单 order_123 发货，快递单号 DHL123456"
- "库存低于 5 的商品"
- "给商品 prod_123 添加中文翻译"

### 2. 功能完整
15 个模块，78 个命令，覆盖电商全流程：
- 📦 商品管理
- 📋 订单处理
- 📊 库存管理
- 🚚 物流追踪
- 🌍 国际化翻译
- 💬 客服对话
- 更多...

### 3. 安全认证
- OAuth 2.0 Device Flow
- 自动 Token 刷新
- 加密本地存储

### 4. 开发者友好
- TypeScript 类型安全
- 完善的错误处理
- 美观的终端输出
- 详细的文档

## 快速开始

```bash
# 1. 安装
npm install -g @optima-chat/optima-cli

# 2. 登录
optima auth login

# 3. 在 Claude Code 中用自然语言操作
"创建商品..."
"查看订单..."
```

## 技术实现

### 架构设计
```
src/
├── api/rest/
│   ├── auth.ts      # OAuth 2.0 认证
│   └── commerce.ts  # 商业 API 客户端
├── commands/        # 15 个命令模块
├── utils/
│   ├── config.ts    # 配置管理
│   └── error.ts     # 错误处理
```

### 核心技术
- **TypeScript 5.3** - ES Modules
- **Commander.js** - CLI 框架
- **Inquirer.js** - 交互式提示
- **Axios** - HTTP 客户端
- **Conf** - 加密配置存储

### 自动 Token 刷新
```typescript
export async function ensureValidToken(): Promise<string | null> {
  const tokens = config.get('tokens');
  if (!tokens) return null;

  // 未过期直接返回
  if (!isTokenExpired()) {
    return tokens.access_token;
  }

  // 自动刷新
  const result = await authApi.refreshToken(tokens.refresh_token);
  saveTokens(result.access_token, result.refresh_token, result.expires_in);
  return result.access_token;
}
```

## 未来计划

- 📹 添加演示视频
- 📚 编写详细教程
- 🌍 推广到开发者社区
- ✨ 新功能：批量操作、数据导入导出

## 相关链接

- 🌐 [官网](https://cli.optima.shop)
- 📦 [NPM](https://www.npmjs.com/package/@optima-chat/optima-cli)
- 💻 [GitHub](https://github.com/Optima-Chat/optima-cli)
- 💬 [Issues](https://github.com/Optima-Chat/optima-cli/issues)

欢迎试用和反馈！如果觉得有用，给个 Star ⭐️ 支持一下~

---

## 🔴 Reddit - r/typescript

### Title
Optima CLI - Natural language e-commerce CLI built with TypeScript

### Post
I built a CLI tool called **Optima CLI** that lets you manage e-commerce operations using natural language instead of memorizing commands.

**The Problem:**
Traditional CLIs require remembering tons of commands and flags:
```bash
optima product create --title "Ceramic Cup" --price 89 --currency USD --stock 20 --description "Handmade ceramic cup"
```

**The Solution:**
With Optima CLI + Claude Code, just say:
```
"Create a ceramic cup product, 89 dollars, stock 20"
```

**Tech Stack:**
- TypeScript 5.3 (ES Modules)
- Commander.js for CLI framework
- Inquirer.js for interactive prompts
- OAuth 2.0 Device Flow for authentication
- Axios with auto token refresh

**Features:**
- 15 modules, 78 commands
- Natural language interface via Claude Code
- OAuth 2.0 authentication
- i18n translation management
- Beautiful terminal output

**Architecture highlights:**
- Request interceptors for auto token refresh
- Encrypted local config storage
- Type-safe API client
- Comprehensive error handling

**Links:**
- Website: https://cli.optima.shop
- GitHub: https://github.com/Optima-Chat/optima-cli
- NPM: https://www.npmjs.com/package/@optima-chat/optima-cli

Built entirely with TypeScript, fully open source. Would love to hear your feedback!

---

## 🎬 Hacker News - Show HN

### Title
Show HN: Optima CLI – Natural language e-commerce CLI for Claude Code

### Post
Hi HN,

I built Optima CLI, a command-line tool designed to work with Claude Code that lets you manage e-commerce operations using natural language.

**The idea:**
Instead of memorizing commands like:
```
optima product create --title "Ceramic Cup" --price 89 --currency USD --stock 20
```

You can just tell Claude:
"Create a ceramic cup product, 89 dollars, stock 20"

And it automatically calls the right CLI command.

**What it does:**
- 15 modules covering product, order, inventory, shipping, i18n, etc.
- 78 commands total
- OAuth 2.0 Device Flow authentication
- Auto token refresh
- Multi-language translation management

**Tech:**
Built with TypeScript, Commander.js, Inquirer.js. Fully open source.

**Try it:**
```
npm install -g @optima-chat/optima-cli
optima auth login
```

Then use it in Claude Code with natural language.

Links:
- Website: https://cli.optima.shop
- GitHub: https://github.com/Optima-Chat/optima-cli

Would love to hear what you think! Happy to answer any questions.

---

## 📱 微信公众号投稿

### 标题
Optima CLI：用自然语言管理电商的开源工具

### 正文
（插入一张精美的封面图）

作为开发者，我们每天都要和各种 CLI 工具打交道。但你有没有想过，如果能用自然语言操作 CLI，会是什么体验？

今天给大家介绍 **Optima CLI**，一个专为 Claude Code 设计的对话式命令行工具。

### 一、为什么做这个工具？

传统 CLI 工具的痛点：
1. 命令太多记不住
2. 参数复杂易出错
3. 需要频繁查文档

举个例子，创建一个商品需要这样：
```bash
optima product create --title "手工陶瓷杯" --price 89 --currency USD --stock 20 --description "精美的手工制作陶瓷杯"
```

参数多、容易打错，还要记住每个参数的名字。

### 二、Optima CLI 的解决方案

只需要对 Claude 说人话：
```
"创建陶瓷杯商品，89 美元，库存 20"
```

Claude Code 会自动帮你调用对应的命令。就这么简单！

### 三、功能一览

Optima CLI 包含 **15 个模块、78 个命令**，覆盖电商运营全流程：

📦 **商品管理** - 创建、查询、更新、删除商品
📋 **订单处理** - 订单查询、发货、取消
📊 **库存管理** - 库存预警、调整、历史记录
🚚 **物流追踪** - 运费计算、物流状态更新
🌍 **国际化** - 多语言翻译管理
💬 **客服对话** - 对话管理、消息收发

### 四、技术亮点

1. **OAuth 2.0 认证** - Device Flow，安全可靠
2. **自动 Token 刷新** - 无感续期，永不过期
3. **TypeScript 类型安全** - 开发体验一流
4. **美观的终端输出** - 彩色文字、表格展示、加载动画

### 五、快速开始

```bash
# 1. 安装
npm install -g @optima-chat/optima-cli

# 2. 登录
optima auth login

# 3. 开始使用
# 在 Claude Code 中用自然语言操作
```

### 六、开源和社区

Optima CLI 完全开源（MIT 协议），欢迎：
- ⭐️ 给个 Star 支持
- 🐛 提 Issue 反馈问题
- 🔧 提 PR 贡献代码

**项目地址：**
- 官网：https://cli.optima.shop
- GitHub：https://github.com/Optima-Chat/optima-cli
- NPM：https://www.npmjs.com/package/@optima-chat/optima-cli

---

**写在最后**

这个项目是我对"未来 CLI 工具"的一次探索。随着 AI 的发展，我相信会有越来越多工具支持自然语言交互。

如果你也对这个方向感兴趣，欢迎交流讨论！
