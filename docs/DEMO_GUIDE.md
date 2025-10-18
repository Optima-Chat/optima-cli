# 📹 Optima CLI 演示录制指南

## 推荐工具

### macOS
- **Kap** (免费开源): https://getkap.co/
- **LICEcap** (免费): https://www.cockos.com/licecap/
- **CleanShot X** (付费，功能强大)

### Windows
- **ScreenToGif** (免费): https://www.screentogif.com/
- **LICEcap** (免费): https://www.cockos.com/licecap/

### Linux
- **Peek** (免费): https://github.com/phw/peek
- **asciinema** (终端录制): https://asciinema.org/

## 演示场景设计

### 场景 1: 安装和登录（30 秒）
```bash
# 1. 安装
npm install -g @optima-chat/optima-cli

# 2. 查看版本
optima --version

# 3. 登录（展示 OAuth Device Flow）
optima auth login
# → 自动打开浏览器
# → 显示用户码
# → 等待授权
# → 成功登录

# 4. 查看当前用户
optima whoami
```

### 场景 2: 商品管理（45 秒）
```bash
# 1. 创建商品
optima product create \
  --title "手工陶瓷杯" \
  --price 89 \
  --currency USD \
  --stock 20 \
  --description "精美的手工制作陶瓷杯"

# 2. 查看商品列表
optima product list --limit 5

# 3. 查看商品详情
optima product get <product-id>

# 4. 更新商品价格
optima product update <product-id> --price 99
```

### 场景 3: 订单管理（30 秒）
```bash
# 1. 查看订单列表
optima order list --limit 5

# 2. 查看待发货订单
optima order list --status pending_shipment

# 3. 订单发货
optima order mark-shipped <order-id> \
  --tracking-number DHL123456789 \
  --carrier DHL

# 4. 标记订单送达
optima order mark-delivered <order-id>
```

### 场景 4: 库存管理（20 秒）
```bash
# 1. 查看低库存商品
optima inventory low-stock --threshold 10

# 2. 更新库存
optima inventory update <product-id> --quantity 50

# 3. 查看库存历史
optima inventory history <product-id>
```

### 场景 5: 国际化翻译（25 秒）
```bash
# 1. 查看商品翻译
optima i18n product translations <product-id>

# 2. 添加中文翻译
optima i18n product translate <product-id> \
  --locale zh-CN \
  --title "手工陶瓷杯" \
  --description "精美的手工制作陶瓷杯，采用传统工艺"

# 3. 添加日文翻译
optima i18n product translate <product-id> \
  --locale ja-JP \
  --title "手作り陶器カップ"
```

## 最佳实践演示（Claude Code 场景）

### 演示 6: 自然语言交互（重点！）

**场景**: 在 Claude Code 中用自然语言操作

**录制内容**:
```
用户: "创建一个商品叫陶瓷杯，价格 89 美元，库存 20"

Claude Code:
好的，我来帮你创建这个商品。

[调用命令]
optima product create --title "陶瓷杯" --price 89 --currency USD --stock 20

✓ 商品创建成功！
ID: prod_abc123
名称: 陶瓷杯
价格: $89.00
库存: 20

---

用户: "查看今天的订单"

Claude Code:
让我查询今天的订单。

[调用命令]
optima order list --created-after 2025-01-17

┌────────────┬──────────────┬────────┬──────────┬─────────────┐
│ 订单 ID    │ 客户         │ 金额   │ 状态     │ 创建时间     │
├────────────┼──────────────┼────────┼──────────┼─────────────┤
│ ord_123    │ John Doe     │ $178   │ 待发货   │ 2 小时前    │
│ ord_456    │ Jane Smith   │ $89    │ 已支付   │ 30 分钟前   │
└────────────┴──────────────┴────────┴──────────┴─────────────┘

今天有 2 个订单，总金额 $267。

---

用户: "订单 ord_123 发货，快递单号 DHL123456"

Claude Code:
好的，我来标记订单 ord_123 为已发货状态。

[调用命令]
optima order mark-shipped ord_123 --tracking-number DHL123456 --carrier DHL

✓ 订单已标记为发货
订单 ID: ord_123
快递公司: DHL
追踪号: DHL123456
```

## GIF 录制建议

### 录制设置
- **分辨率**: 1280x720 或 1920x1080
- **帧率**: 15-20 FPS（GIF）或 30 FPS（视频）
- **时长**: 每个场景 20-45 秒
- **格式**: GIF（<10MB）或 MP4

### 终端设置
```bash
# 1. 使用漂亮的终端主题
# 推荐: iTerm2 + Oh My Zsh (macOS)
# 推荐: Windows Terminal + Oh My Posh (Windows)

# 2. 清理终端历史
clear

# 3. 调整字体大小（便于阅读）
# 建议: 16-18pt

# 4. 使用彩色输出
# Optima CLI 已内置彩色支持
```

### 录制流程
1. **准备环境**
   - 清理终端历史
   - 调整窗口大小
   - 检查网络连接

2. **开始录制**
   - 启动录制工具
   - 选择录制区域（终端窗口）
   - 开始操作

3. **执行演示**
   - 按照场景脚本执行
   - 每个命令间隔 1-2 秒
   - 让用户看清输出

4. **停止录制**
   - 保存 GIF/视频
   - 检查文件大小
   - 必要时压缩

### 后期处理
- **压缩 GIF**: 使用 [gifsicle](https://www.lcdf.org/gifsicle/) 或在线工具
- **添加水印**: 可选，展示 Logo
- **调整速度**: 关键步骤放慢，等待过程加速

## 录制脚本示例

创建一个自动化演示脚本（可选）:

```bash
#!/bin/bash
# demo.sh - 自动演示脚本

# 设置延迟
DELAY=2

# 场景 1: 查看版本
echo "$ optima --version"
sleep $DELAY
optima --version
sleep $DELAY

# 场景 2: 查看帮助
echo "\n$ optima --help"
sleep $DELAY
optima --help | head -20
sleep $DELAY

# 场景 3: 查看商品列表
echo "\n$ optima product list --limit 5"
sleep $DELAY
optima product list --limit 5
sleep $DELAY

# ... 继续其他场景
```

## 最终输出

### 推荐的 GIF 放置位置
```
optima-cli/
├── README.md (引用 GIF)
├── .github/
│   └── assets/
│       ├── demo-install.gif (安装演示)
│       ├── demo-product.gif (商品管理)
│       ├── demo-claude-code.gif (Claude Code 交互，重点！)
│       └── demo-full.gif (完整演示)
└── website/
    └── public/
        └── demo.gif (官网展示)
```

### README.md 中引用
```markdown
## 🎬 演示

### 安装和使用
![安装演示](.github/assets/demo-install.gif)

### Claude Code 自然语言交互
![Claude Code 演示](.github/assets/demo-claude-code.gif)

### 商品管理
![商品管理演示](.github/assets/demo-product.gif)
```

## 视频方案（替代 GIF）

如果 GIF 文件过大，考虑使用视频:

### YouTube 短视频
- 2-3 分钟完整演示
- 添加字幕和旁白
- 在 README 和官网中嵌入

### Asciinema（终端录制）
```bash
# 安装
brew install asciinema  # macOS
sudo apt install asciinema  # Linux

# 录制
asciinema rec demo.cast

# 上传到 asciinema.org
asciinema upload demo.cast

# 嵌入到 README
[![asciicast](https://asciinema.org/a/xxxxx.svg)](https://asciinema.org/a/xxxxx)
```

## 检查清单

录制前:
- [ ] 安装并配置好录制工具
- [ ] 准备测试账号和数据
- [ ] 检查终端主题和字体
- [ ] 清理终端历史
- [ ] 测试所有命令正常运行

录制中:
- [ ] 选择合适的录制区域
- [ ] 控制录制速度
- [ ] 确保命令输出完整可见
- [ ] 演示关键功能

录制后:
- [ ] 检查 GIF 质量
- [ ] 压缩文件大小（<5MB）
- [ ] 上传到 GitHub
- [ ] 更新 README
- [ ] 更新官网

---

**提示**: 重点突出 Claude Code 自然语言交互场景，这是 Optima CLI 最大的亮点！
