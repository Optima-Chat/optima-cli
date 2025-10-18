# Product Hunt Assets

此目录包含 Product Hunt 提交所需的图片素材。

## 所需文件

### 1. product-hunt-icon.png
- **尺寸**: 240 x 240 px
- **格式**: PNG
- **背景**: 透明
- **内容**: Optima CLI Logo
- **设计建议**:
  - 使用 Optima 品牌色 (#FF5A5F coral)
  - 简洁的闪电图标 ⚡
  - 可读性强的设计

### 2. product-hunt-preview.png
- **尺寸**: 1270 x 760 px (或 2540 x 1520 px @2x)
- **格式**: PNG 或 JPG
- **内容**: 主预览图
- **设计建议**:
  - 展示 Claude Code 中的自然语言交互
  - 分屏显示：左侧对话，右侧终端输出
  - 使用深色背景，突出彩色终端输出
  - 包含 "Optima CLI" 标题和简短标语

### 3. gallery-1-installation.png
- **尺寸**: 1270 x 760 px
- **内容**: 安装和登录流程
- **设计建议**:
  - 终端截图展示 `npm install -g @optima-chat/optima-cli`
  - 展示 `optima auth login` OAuth 流程
  - 干净的界面，清晰的文字

### 4. gallery-2-natural-language.png
- **尺寸**: 1270 x 760 px
- **内容**: 自然语言 vs 传统命令对比
- **设计建议**:
  ```
  ❌ 传统方式：
  optima product create --title "陶瓷杯" --price 89 --currency USD --stock 20 --description "..."

  ✅ Optima CLI + Claude Code：
  "创建陶瓷杯商品，89 美元，库存 20"
  ```

### 5. gallery-3-features.png
- **尺寸**: 1270 x 760 px
- **内容**: 功能特性图表
- **设计建议**:
  - 15 个模块图标网格
  - 78 个命令统计
  - OAuth 2.0 安全认证
  - 多语言支持

### 6. gallery-4-demo.png
- **尺寸**: 1270 x 760 px
- **内容**: 实际使用演示截图
- **设计建议**:
  - 商品管理、订单处理等真实场景
  - 展示彩色表格输出
  - 终端美观的输出效果

## 设计规范

### 配色方案
```
主色调: #FF5A5F (coral)
深色背景: #0A0E1A (深蓝黑)
终端背景: #1A1B26 (Tokyo Night)
文字: #FFFFFF (白色)
代码: #7AA2F7 (蓝色), #BB9AF7 (紫色), #73DACA (青色)
```

### 字体
- **标题**: Inter Bold / SF Pro Display Bold
- **正文**: Inter Regular / SF Pro Text
- **代码**: JetBrains Mono / Fira Code / Monaco

### 设计工具推荐
1. **Figma** (免费) - 在线设计工具
2. **Canva** (免费/付费) - 模板丰富
3. **Sketch** (付费, macOS) - 专业设计工具
4. **Photoshop** (付费) - Adobe 套件
5. **GIMP** (免费) - 开源图像编辑

## 快速创建方案

### 方案 1: 使用终端截图
1. 设置漂亮的终端主题（iTerm2 + Oh My Zsh）
2. 调整终端窗口大小为 16:9
3. 使用高分辨率截图（Command + Shift + 4, 然后按 Space）
4. 在 Figma/Canva 中添加标题和说明文字
5. 导出为 PNG (1270x760)

### 方案 2: 使用设计模板
1. 在 Figma 搜索 "Product Hunt Template"
2. 复制模板到你的项目
3. 替换内容为 Optima CLI 相关内容
4. 调整配色为 Optima 品牌色
5. 导出为 PNG

### 方案 3: 使用 Carbon
1. 访问 https://carbon.now.sh/
2. 粘贴代码或命令示例
3. 选择主题 (推荐: Night Owl, Dracula, One Dark)
4. 调整窗口样式
5. 导出为 PNG
6. 在 Figma 中组合多个截图

## 示例布局

### 主预览图布局示例
```
┌─────────────────────────────────────────┐
│                                         │
│   ⚡ Optima CLI                         │
│   用自然语言管理你的电商店铺              │
│                                         │
│  ┌─────────────┐    ┌─────────────┐    │
│  │ Claude Code │    │  Terminal   │    │
│  │             │    │             │    │
│  │  对话截图    │    │  命令输出    │    │
│  │             │    │             │    │
│  └─────────────┘    └─────────────┘    │
│                                         │
│  "创建陶瓷杯商品，89 美元，库存 20"      │
│         ↓                               │
│  optima product create ...             │
│  ✓ 商品创建成功！                       │
│                                         │
└─────────────────────────────────────────┘
```

## 检查清单

提交前检查：
- [ ] product-hunt-icon.png (240x240, PNG, 透明背景)
- [ ] product-hunt-preview.png (1270x760, PNG/JPG)
- [ ] gallery-1-installation.png (1270x760)
- [ ] gallery-2-natural-language.png (1270x760)
- [ ] gallery-3-features.png (1270x760)
- [ ] gallery-4-demo.png (1270x760)
- [ ] 所有图片文件大小 < 5MB
- [ ] 图片清晰，文字可读
- [ ] 品牌色一致
- [ ] 无拼写错误

## 参考示例

查看其他成功的 Developer Tools 产品：
- Warp (终端工具): https://www.producthunt.com/posts/warp
- Fig (CLI 自动补全): https://www.producthunt.com/posts/fig
- GitHub CLI: https://www.producthunt.com/posts/github-cli

---

**设计完成后**，将文件放置在此目录下，然后在 SUBMISSION_GUIDE.md 中标记为完成。
