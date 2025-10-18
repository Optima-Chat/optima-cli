## Optima CLI

电商店铺管理命令行工具 - 用自然语言管理商品、订单、库存和物流。

**版本**: v0.4.1 | **安装**: `npm install -g @optima-chat/optima-cli@latest`

### 可用命令

**认证** (`optima auth`)
- `login` - 登录账户
- `logout` - 登出
- `whoami` - 查看当前用户

**商品** (`optima product`)
- `create` - 创建商品
- `list` - 商品列表
- `get <id>` - 商品详情
- `update <id>` - 更新商品
- `delete <id>` - 删除商品
- `add-images <id>` - 添加商品图片

**分类** (`optima category`)
- `list` - 分类列表
- `create` - 创建分类
- `get <id>` - 分类详情
- `update <id>` - 更新分类
- `delete <id>` - 删除分类

**变体** (`optima variant`) - SKU/规格管理
- `list <product-id>` - 变体列表
- `create <product-id>` - 创建变体
- `get <product-id> <id>` - 变体详情
- `update <product-id> <id>` - 更新变体
- `delete <product-id> <id>` - 删除变体
- `add-images <product-id> <id>` - 添加变体图片

**订单** (`optima order`)
- `list` - 订单列表
- `get <id>` - 订单详情
- `ship <id>` - 订单发货
- `complete <id>` - 完成订单
- `cancel <id>` - 取消订单
- `mark-delivered <id>` - 标记已送达

**退款** (`optima refund`)
- `create <order-id>` - 创建退款
- `get <id>` - 退款详情

**库存** (`optima inventory`)
- `low-stock` - 低库存商品
- `update <id>` - 更新库存
- `history <id>` - 库存历史
- `reserve <id>` - 预留库存

**商户** (`optima merchant`)
- `info` - 商户信息
- `update` - 更新资料
- `setup` - 初始化资料

**物流** (`optima shipping`)
- `calculate` - 计算运费
- `history <id>` - 物流历史
- `update-status <id>` - 更新状态

**上传** (`optima upload`)
- `image <path>` - 上传图片
- `video <path>` - 上传视频
- `file <path>` - 上传文件

**对话** (`optima conversation`)
- `list` - 对话列表
- `get <id>` - 对话详情
- `create` - 创建对话
- `close <id>` - 关闭对话
- `messages <id>` - 查看消息
- `send <id>` - 发送消息
- `mark-read <id>` - 标记已读

**地址** (`optima address`)
- `list` - 地址列表
- `get <id>` - 地址详情
- `create` - 创建地址
- `update <id>` - 更新地址
- `delete <id>` - 删除地址
- `set-default <id>` - 设为默认地址

**财务** (`optima transfer`)
- `list` - 转账列表
- `summary` - 财务汇总

**提示**:
- 使用 `optima <命令> --help` 查看详细用法和选项
- 删除/取消等操作需要添加 `--yes` 或 `-y` 跳过交互式确认
<!-- END_OPTIMA_CLI -->
