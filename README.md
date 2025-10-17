# Optima CLI

> Optima Commerce 的命令行工具 - 让电商管理更简单

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

Optima CLI 是 [Optima Commerce](https://optima.chat) 生态的命令行入口，为商家和开发者提供快速、高效的电商管理能力。

## ✨ 特性

- 🚀 **快速上手** - 简洁的命令设计，5 分钟上手
- 💬 **对话式** - 支持交互式命令引导，友好的用户体验
- 🤖 **Claude Code 原生集成** - 通过自然语言管理店铺
- 📦 **功能完整** - 覆盖商品、订单、库存、物流全流程
- 🎨 **美观输出** - 彩色终端输出，表格化数据展示
- 🔐 **安全可靠** - Token 加密存储，自动刷新
- 🛠 **开发者友好** - TypeScript 类型安全，支持脚本化

## 📦 安装

```bash
npm install -g @optima/cli
```

**要求**：Node.js >= 18

## 🚀 快速开始

### 1. 登录

```bash
optima auth login
```

### 2. 创建商品

```bash
# 交互式创建
optima product create

# 或使用参数
optima product create \
  --title "珍珠耳环" \
  --price 299 \
  --description "天然淡水珍珠" \
  --stock 10 \
  --images ./product.jpg
```

### 3. 查看订单

```bash
optima order list
```

### 4. 配置 Claude Code

```bash
optima setup-claude
```

现在可以在 Claude Code 中说："帮我创建一个新商品" 🎉

## 📖 命令参考

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

## 🤖 Claude Code 集成

Optima CLI 原生支持 [Claude Code](https://claude.com/claude-code)，让你通过自然语言管理店铺。

### 配置步骤

1. 运行配置命令：

```bash
optima setup-claude
```

2. 在 Claude Code 中使用自然语言：

```
你：帮我创建一个珍珠耳环商品，售价 299 美元，库存 10 件
Claude：好的，我来帮你创建商品...
        [自动执行 optima product create 命令]

你：查看今天的订单
Claude：[自动执行 optima order list 命令]

你：把订单 #123 标记为已发货，快递单号 DHL123456
Claude：[自动执行 optima order ship order_123 --tracking DHL123456]
```

### 自然语言示例

- "创建一个新商品：手工陶瓷杯，89 美元"
- "查看所有商品"
- "更新商品 prod_123 的价格为 99 美元"
- "查看今天的订单"
- "查看待发货的订单"
- "把订单 order_456 标记为已发货"
- "查看库存低于 5 的商品"
- "更新商品 prod_789 的库存为 50"
- "计算从香港到纽约的运费"
- "查看我的店铺信息"

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
