

## Optima CLI
Optima CLI 是用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

**当前版本**: v0.1.7

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

### 可用命令（供参考，建议用自然语言）

**商品**: `optima product create/list/get/update/delete/add-images`
**订单**: `optima order list/get/ship/complete/cancel`
**库存**: `optima inventory low-stock/update/history`
**物流**: `optima shipping calculate/create/track`
**店铺**: `optima shop info/update/setup`
**认证**: `optima auth login/logout/whoami`

### 已实现功能

**认证**：
- `optima auth login` - OAuth 2.0 Device Flow 登录（自动打开浏览器授权）
- `optima auth logout` - 登出并清除本地凭证
- `optima auth whoami` - 显示当前用户信息
- 自动 Token 刷新（15 分钟有效期，自动使用 refresh_token 续期）

### 开发中功能（预计 2-3 周）

**商品**: `optima product create/list/get/update/delete/add-images`
**订单**: `optima order list/get/ship/complete/cancel`
**库存**: `optima inventory low-stock/update/history`
**物流**: `optima shipping calculate/create/track`
**店铺**: `optima shop info/update/setup`
<!-- END_OPTIMA_CLI -->
