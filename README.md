# Optima CLI

> 用自然语言管理你的电商店铺 - 无需记住命令

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

Optima CLI 是 [Optima Commerce](https://optima.chat) 生态的命令行工具，**专为 Claude Code 设计**，让你通过自然语言对话管理整个电商业务。

## ✨ 核心特性

- 🤖 **对话式操作** - 在 Claude Code 中用自然语言管理店铺，无需记住命令
- ⚡️ **即开即用** - 一行命令配置，立即开始使用
- 📦 **功能完整** - 覆盖商品、订单、库存、物流、广告、图像生成等全流程
- 🎨 **美观输出** - 彩色终端输出，表格化数据展示
- 🔐 **安全可靠** - Token 加密存储，自动刷新
- 🛠 **开发者友好** - TypeScript 类型安全，也支持直接命令行调用

## 📦 安装

```bash
npm install -g @optima-chat/optima-cli@latest
```

**要求**：Node.js >= 18

## 🚀 快速开始

> **核心使用方式**：通过 Claude Code 用自然语言管理店铺，安装即用

### 1. 安装（自动配置）

```bash
npm install -g @optima-chat/optima-cli@latest
```

安装完成后会自动配置 Claude Code 集成，无需任何额外步骤！

### 2. 登录你的账号

在 Claude Code 中说：

```
登录 Optima
```

Claude 会自动调用 `optima auth login` 命令引导你登录。

### 3. 开始用自然语言管理店铺 ✨

在 Claude Code 中，你可以这样说：

```
- "创建珍珠耳环商品，299 美元，库存 10"
- "查看今天的订单"
- "订单 #123 发货，快递单号 DHL123456"
- "库存低于 5 的商品"
- "商品 prod_123 改价 399"
```

Claude 会自动调用对应的 `optima` 命令来完成操作。

**就是这么简单！** 🎉

> **注意**：如果自动配置失败，可以手动运行 `optima setup-claude` 来配置。

## 📖 命令参考

> **提示**：以下命令也可以直接在终端使用，但我们**强烈推荐**通过 Claude Code 用自然语言调用。

### 认证管理

```bash
optima auth login              # 登录
optima auth register           # 注册
optima auth logout             # 登出
optima auth whoami             # 查看当前用户
```

### 商品管理

```bash
optima product create          # 创建商品
optima product list            # 商品列表
optima product get <id>        # 商品详情
optima product update <id>     # 更新商品
optima product delete <id>     # 删除商品
optima product add-images <id> # 添加图片
```

**示例**：

```bash
# 创建商品（带参数）
optima product create \
  --title "手工陶瓷杯" \
  --price 89 \
  --stock 20

# 更新商品价格
optima product update prod_123 --price 99

# 添加商品图片
optima product add-images prod_123 ./img1.jpg ./img2.jpg
```

### 订单管理

```bash
optima order list              # 订单列表
optima order get <id>          # 订单详情
optima order ship <id>         # 发货
optima order complete <id>     # 完成订单
optima order cancel <id>       # 取消订单
```

**示例**：

```bash
# 查看待处理订单
optima order list --status pending

# 发货
optima order ship order_123 \
  --tracking DHL123456 \
  --carrier DHL
```

### 库存管理

```bash
optima inventory low-stock     # 低库存商品
optima inventory update <id>   # 更新库存
optima inventory history <id>  # 库存历史
```

**示例**：

```bash
# 查看库存低于 5 的商品
optima inventory low-stock --threshold 5

# 更新库存
optima inventory update prod_123 --quantity 50
```

### 物流管理

```bash
optima shipping calculate      # 计算运费
optima shipping create <id>    # 创建运单
optima shipping track <number> # 物流跟踪
```

**示例**：

```bash
# 计算运费
optima shipping calculate \
  --from "Hong Kong" \
  --to "New York, USA" \
  --weight 0.5

# 跟踪物流
optima shipping track DHL123456
```

### 店铺管理

```bash
optima shop info               # 店铺信息
optima shop update             # 更新店铺
optima shop setup              # 设置店铺
```

### 配置管理

```bash
optima config set <key> <value>  # 设置配置
optima config get <key>          # 获取配置
optima config list               # 列出所有配置
```

## 💬 更多自然语言示例

在 Claude Code 中，你可以用非常简洁的语言描述你的需求：

**商品管理**：
- "创建陶瓷杯商品，89 美元，库存 20"
- "查看所有商品"
- "商品 prod_123 改价 99"
- "删除商品 prod_456"
- "给商品 prod_789 加 3 张图"

**订单处理**：
- "今天的订单"
- "待发货订单"
- "订单 order_123 详情"
- "订单 order_456 发货，DHL123456"
- "取消订单 order_789"

**库存管理**：
- "库存低于 5"
- "商品 prod_123 库存改 50"
- "商品 prod_456 库存历史"

**物流查询**：
- "香港到纽约运费，0.5 公斤"
- "跟踪 DHL123456"

**店铺管理**：
- "店铺信息"
- "更新店铺"

> **提示**：说话越自然越好，Claude 会理解你的意图并调用正确的命令。

## 🏗 项目状态

当前版本：**0.1.0** (开发中)

### 开发计划

- [ ] **Phase 1 - MVP** (Week 1-2)
  - [ ] 基础设施（HTTP 客户端、配置管理、错误处理）
  - [ ] 认证功能（login, logout, whoami）
  - [ ] 商品管理（create, list, get, update, delete）
  - [ ] 订单管理（list, get, ship）
  - [ ] Claude Code 集成

- [ ] **Phase 2 - 增强功能** (Week 3-4)
  - [ ] 图片上传
  - [ ] 库存管理
  - [ ] 物流管理
  - [ ] 店铺管理
  - [ ] 更多订单操作

- [ ] **Phase 3 - 优化与发布** (Week 5-6)
  - [ ] 单元测试 (覆盖率 > 80%)
  - [ ] 性能优化
  - [ ] 文档完善
  - [ ] NPM 发布

查看完整的技术方案：[docs/TECHNICAL_DESIGN.md](./docs/TECHNICAL_DESIGN.md)

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
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 📚 文档

- [技术方案文档](./docs/TECHNICAL_DESIGN.md)
- [API 文档](./docs/API.md) (即将推出)
- [命令参考](./docs/COMMANDS.md) (即将推出)

## 🤝 贡献

欢迎贡献！请查看我们的贡献指南。

### 贡献流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📝 许可证

[MIT License](./LICENSE)

## 🔗 相关链接

- [Optima Commerce 官网](https://optima.chat)
- [Agentic Chat](https://ai.optima.chat) - 卖家对话界面
- [Optima Store](https://go.optima.shop) - 买家购物前端
- [Claude Code](https://claude.com/claude-code)
- [GitHub Issues](https://github.com/Optima-Chat/optima-cli/issues)

## 💬 支持

遇到问题？
- 提交 [Issue](https://github.com/Optima-Chat/optima-cli/issues)
- 查看 [技术文档](./docs/TECHNICAL_DESIGN.md)
- 联系团队：support@optima.chat

---

**由 [Optima Commerce Team](https://optima.chat) 用 ❤️ 打造**
