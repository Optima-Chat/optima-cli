

## Optima CLI
Optima CLI 是用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

**当前版本**: v0.2.0 🎉

**安装**：`npm install -g @optima-chat/optima-cli@latest`

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

### 已实现功能（Phase 1 MVP）

✅ **完整的 23 个业务命令**，涵盖电商核心流程：

**认证管理** (auth):
- `login` - OAuth 2.0 Device Flow 登录（自动打开浏览器授权）
- `logout` - 登出并清除本地凭证
- `whoami` - 显示当前用户信息

**商品管理** (product):
- `create` - 创建商品（支持交互式模式 + 图片上传）
- `list` - 商品列表（分页、过滤、搜索）
- `get` - 商品详情
- `update` - 更新商品
- `delete` - 删除商品
- `add-images` - 添加商品图片

**订单管理** (order):
- `list` - 订单列表（状态过滤、日期范围）
- `get` - 订单详情
- `ship` - 订单发货（物流单号 + 快递公司）
- `complete` - 完成订单
- `cancel` - 取消订单

**库存管理** (inventory):
- `low-stock` - 获取低库存商品
- `update` - 更新商品库存
- `history` - 查看库存变更历史

**商户管理** (merchant):
- `info` - 获取商户信息
- `update` - 更新商户资料
- `setup` - 初始化商户资料（OAuth 用户首次使用）

**物流管理** (shipping):
- `calculate` - 计算运费
- `history` - 查看物流历史
- `update-status` - 更新物流状态
<!-- END_OPTIMA_CLI -->
