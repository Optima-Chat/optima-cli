# Optima CLI - Release Notes

## 🎉 v0.6.2 已发布

### 项目简介

用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

**安装**：
```bash
npm install -g @optima-chat/optima-cli@latest
```

---

## ✅ 已完成功能

### 核心模块（15 个模块，78 个命令）

| 模块 | 功能 |
|------|------|
| 🔐 auth | OAuth 2.0 认证，自动 Token 刷新 |
| 📦 product | 商品 CRUD + 图片管理 |
| 🏷 category | 分类管理 |
| 🎨 variant | SKU/规格管理 |
| 📋 order | 订单查询、发货、取消、送达 |
| 💰 refund | 退款创建和查询 |
| 📊 inventory | 库存预警、调整、历史、预留 |
| 🏪 merchant | 商户资料管理 |
| 🚚 shipping | 运费计算、物流追踪 |
| 🌍 shipping-zone | 运费区域和费率配置 |
| 📤 upload | 图片/视频/文件上传 |
| 💬 conversation | 客服对话管理 |
| 📍 address | 地址管理 |
| 💳 transfer | 财务转账和汇总 |
| 🌐 i18n | 多语言翻译（商品/分类/商户）|

### 特性

- ✅ 完整的 OAuth 2.0 认证（Device Flow）
- ✅ Token 自动刷新（15 分钟有效期）
- ✅ 加密的本地配置存储
- ✅ Claude Code 深度集成
- ✅ 交互式命令提示
- ✅ 美观的表格输出
- ✅ 完善的错误处理

---

## 🚀 使用方式

### 1. 安装并登录

```bash
npm install -g @optima-chat/optima-cli@latest
optima auth login
```

### 2. 在 Claude Code 中使用自然语言

直接对 Claude 说：
```
- "登录 Optima"
- "创建陶瓷杯商品，89 美元，库存 20"
- "查看今天的订单"
- "订单 order_123 发货，快递单号 DHL123456"
- "给商品添加中文翻译"
```

### 3. 或直接运行命令

```bash
optima product create --title "陶瓷杯" --price 89 --stock 20
optima order list --status pending
optima i18n product create prod_123 --lang zh-CN --name "手工陶瓷杯"
```

---

## 🛠 技术栈

- **语言**: TypeScript 5.3 (ES Modules)
- **CLI**: Commander.js + Inquirer.js
- **HTTP**: Axios (带自动认证拦截器)
- **UI**: Chalk + cli-table3 + Ora
- **配置**: Conf (加密存储)
- **认证**: OAuth 2.0 Device Flow

---

## 📦 CI/CD

GitHub Actions 自动发布流程：

```bash
npm version patch   # 升级版本
git push --follow-tags  # 触发自动发布
```

自动执行：
- ✅ 构建
- ✅ 发布到 NPM
- ✅ 创建 GitHub Release
- ✅ 生成 Changelog

---

## 🔗 链接

- **NPM**: https://www.npmjs.com/package/@optima-chat/optima-cli
- **GitHub**: https://github.com/Optima-Chat/optima-cli
- **官网**: https://optima.chat
- **当前版本**: v0.6.2

---

## 📊 项目状态

**功能覆盖率**: 100%（所有核心商户运营功能）

**下一步**:
- 持续优化用户体验
- 根据反馈迭代功能
- 性能优化

---

**Team Optima Commerce** | 2025
