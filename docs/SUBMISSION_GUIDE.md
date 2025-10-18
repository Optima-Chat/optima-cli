# 📤 产品平台提交指南

完整的产品发现平台提交流程和材料准备。

---

## 🎯 Product Hunt

### 最佳提交时间
- **日期**: 周二、周三或周四（避开周一和周五）
- **时间**: 太平洋时间 00:01 (北京时间约 16:01)
- **建议**: 提前一天准备好所有材料，定好闹钟

### 所需材料

#### 1. 产品信息
```
名称: Optima CLI
标语: Natural language e-commerce CLI for Claude Code
描述: 见下方完整描述
网站: https://cli.optima.shop
```

#### 2. 产品描述（完整版）
```markdown
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
```

#### 3. 图片素材

**产品图标** (必需)
- 尺寸: 240x240 px
- 格式: PNG
- 要求: 透明背景，清晰的品牌 Logo
- 位置: 待创建 `assets/product-hunt-icon.png`

**产品预览图** (必需)
- 尺寸: 1270x760 px 或 2540x1520 px
- 格式: PNG/JPG
- 内容建议:
  - 终端界面截图
  - Claude Code 对话截图
  - 功能特性图示
- 位置: 待创建 `assets/product-hunt-preview.png`

**产品图库** (可选，推荐 3-5 张)
- 尺寸: 1270x760 px
- 内容建议:
  1. 安装演示截图
  2. Claude Code 自然语言交互
  3. 商品管理界面
  4. 订单管理界面
  5. 功能特性对比图

**演示视频/GIF** (强烈推荐)
- 时长: 30-60 秒
- 格式: MP4 或 GIF
- 内容: Claude Code 中自然语言操作演示
- 文件大小: < 100MB

#### 4. Topics/Categories
```
Developer Tools
E-commerce
Command Line Tools
Artificial Intelligence
Open Source
Productivity
```

#### 5. 社交媒体链接
```
GitHub: https://github.com/Optima-Chat/optima-cli
Twitter: [待创建项目 Twitter 账号]
Website: https://cli.optima.shop
```

### 提交流程

1. **注册 Product Hunt 账号**
   - 网址: https://www.producthunt.com/
   - 建议使用公司/个人品牌账号

2. **准备材料**（提交前一天）
   - ✅ 检查所有文案
   - ✅ 准备所有图片（图标、预览图、图库）
   - ✅ 录制演示视频
   - ✅ 测试所有链接

3. **提交产品**
   - 访问: https://www.producthunt.com/posts/new
   - 填写产品信息
   - 上传图片和视频
   - 选择 Topics
   - 选择发布时间: 次日 00:01 PT

4. **发布后互动**（关键！）
   - 发布后立即分享到 Twitter、LinkedIn
   - 前 30 分钟快速回复所有评论
   - 邀请团队成员和朋友支持（upvote）
   - 准备回答常见问题
   - 持续互动至少 6-8 小时

### Product Hunt 常见问题准备

**Q: 为什么选择 Claude Code 而不是其他 AI？**
A: Claude Code 是 Anthropic 官方的 CLI 工具，对开发者工作流有深度集成。Optima CLI 专门为其优化，提供最佳的自然语言交互体验。

**Q: 需要 Optima Commerce 账号吗？**
A: 是的，需要先在 www.optima.shop 注册商户账号。我们提供免费试用。

**Q: 支持哪些平台？**
A: macOS、Linux 和 Windows，需要 Node.js >= 18。

**Q: 和传统 CLI 相比有什么优势？**
A: 无需记住命令和参数，直接用自然语言对话。特别适合复杂的电商操作场景。

**Q: 开源吗？**
A: 是的，MIT 协议，完全开源：https://github.com/Optima-Chat/optima-cli

---

## 🔴 Reddit 提交

### 目标板块

#### r/typescript
- **标题**: Optima CLI - Natural language e-commerce CLI built with TypeScript
- **Flair**: Project
- **文案**: 见 PROMOTION_POSTS.md - Reddit 版本
- **最佳时间**: 美国东部时间上午 8-10 点

#### r/node
- **标题**: Built a CLI tool with Node.js that lets you manage e-commerce using natural language
- **Flair**: Show and Tell
- **最佳时间**: 美国东部时间上午 9-11 点

#### r/commandline
- **标题**: Optima CLI - A natural language interface for e-commerce management
- **最佳时间**: 任何时间，但工作日更佳

#### r/opensource
- **标题**: Optima CLI - Open source natural language CLI for e-commerce (MIT)
- **最佳时间**: 美国东部时间晚上 7-9 点

### Reddit 最佳实践
- ✅ 提供价值，不只是推广
- ✅ 分享技术细节和开发故事
- ✅ 快速回复评论和问题
- ✅ 展示代码示例
- ❌ 避免过度营销语言
- ❌ 不要在多个板块同时发布（间隔至少 1-2 天）

---

## 🌐 Hacker News

### Show HN 提交

**标题**: Show HN: Optima CLI – Natural language e-commerce CLI for Claude Code

**正文**（见 PROMOTION_POSTS.md）

### 最佳时间
- 美国东部时间上午 8-10 点（工作日）
- 避开周末和假期

### HN 最佳实践
- ✅ 标题简洁明了（< 80 字符）
- ✅ 在评论区主动回答问题
- ✅ 分享技术实现细节
- ✅ 诚实对待产品的局限性
- ✅ 快速响应（前 1-2 小时至关重要）
- ❌ 避免营销用语
- ❌ 不要请求 upvote

---

## 🇨🇳 中文社区提交

### V2EX

**节点选择**:
- 首选: [分享创造](https://v2ex.com/go/create)
- 备选: [程序员](https://v2ex.com/go/programmer)

**标题**: Optima CLI - 用自然语言管理电商店铺，专为 Claude Code 设计

**正文**: 见 PROMOTION_POSTS.md - V2EX 版本

**最佳时间**:
- 工作日晚上 20:00-22:00
- 周末上午 10:00-12:00

**V2EX 特殊规则**:
- 同一主题 30 天内只能发一次
- 分享创造节点需要等级达到一定要求
- 可以使用 Markdown 格式

### 掘金

**分类**: 工具资源

**标签**: `#工具` `#CLI` `#开源` `#TypeScript` `#AI`

**标题**: Optima CLI：用自然语言管理电商店铺的开源 CLI 工具

**正文**: 见 PROMOTION_POSTS.md - 掘金/知乎版本（完整技术文章）

**最佳时间**: 工作日上午 9:00-11:00

### 知乎

**话题选择**:
- #命令行工具
- #开源项目
- #电子商务
- #人工智能
- #开发者工具

**标题**: Optima CLI：用自然语言管理电商店铺的开源 CLI 工具

**正文**: 见 PROMOTION_POSTS.md - 掘金/知乎版本

**最佳时间**:
- 工作日晚上 20:00-22:00
- 周末上午 10:00-12:00

---

## 📝 Dev.to 提交

**标题**: Building Optima CLI: A Natural Language Interface for E-commerce Management

**标签**: `#typescript` `#cli` `#opensource` `#nodejs` `#ai`

**系列文章建议**:

### 文章 1: 产品介绍
- 为什么做这个工具
- 核心功能演示
- 快速开始指南

### 文章 2: 技术实现
- TypeScript + Commander.js 架构
- OAuth 2.0 Device Flow 实现
- 自动 Token 刷新机制

### 文章 3: 最佳实践
- 如何设计对话式 CLI
- Claude Code 集成技巧
- 用户体验优化

---

## 📊 提交检查清单

### 提交前
- [ ] 所有代码已推送到 GitHub
- [ ] README 完整且美观
- [ ] 演示 GIF/视频已录制
- [ ] 官网可访问（https://cli.optima.shop）
- [ ] NPM 包已发布最新版本
- [ ] GitHub Release 已创建
- [ ] 所有链接已测试

### 图片素材
- [ ] Product Hunt 图标 (240x240)
- [ ] Product Hunt 预览图 (1270x760)
- [ ] Product Hunt 图库 (3-5 张)
- [ ] 演示 GIF/视频 (30-60s)
- [ ] 社交媒体封面图

### 文案内容
- [ ] 产品描述（英文）
- [ ] 产品描述（中文）
- [ ] 常见问题答案准备
- [ ] 社交媒体发布文案
- [ ] 技术文章草稿

### 账号准备
- [ ] Product Hunt 账号已创建
- [ ] Reddit 账号已创建（karma > 50）
- [ ] Hacker News 账号已创建
- [ ] V2EX 账号已创建（等级达标）
- [ ] 掘金账号已创建
- [ ] 知乎账号已创建
- [ ] Dev.to 账号已创建

---

## 🎯 提交优先级

### 第一批（Week 1）- 核心平台
1. **GitHub** - 优化仓库（✅ 已完成）
2. **官网** - 部署和 SEO（✅ 已完成）
3. **录制演示** - GIF/视频（🔄 进行中）

### 第二批（Week 2）- 产品发现
1. **Product Hunt** - 主要发布平台
2. **Hacker News** - Show HN
3. **V2EX** - 中文开发者社区

### 第三批（Week 2-3）- 社交媒体
1. **Twitter/X** - 持续更新
2. **Reddit** - 多个相关板块
3. **掘金** - 技术文章
4. **知乎** - 问答和专栏

### 第四批（Week 3-4）- 长尾内容
1. **Dev.to** - 系列技术文章
2. **Medium** - 英文技术博客
3. **微信公众号** - 深度文章

---

## 📈 成功指标

### Product Hunt
- 🎯 目标: Top 5 in Developer Tools
- 📊 Upvotes: 200+
- 💬 Comments: 50+

### Hacker News
- 🎯 目标: 首页
- 📊 Points: 100+
- 💬 Comments: 30+

### GitHub
- 🎯 目标: Trending in TypeScript
- ⭐ Stars: +100 in first week
- 👀 Watchers: +20

### NPM
- 📦 Downloads: +500 in first week
- 📈 增长: 每周 +20%

---

## 💡 提示

1. **时区转换工具**: https://www.timeanddate.com/worldclock/converter.html
2. **图片压缩**: https://tinypng.com/
3. **GIF 优化**: https://ezgif.com/optimize
4. **Markdown 预览**: https://dillinger.io/
5. **社交媒体调度**: Buffer / Hootsuite

---

**准备好了吗？** 按照这个清单逐步完成，祝发布成功！🚀
