## Optima CLI

电商店铺管理命令行工具 - 用自然语言管理商品、订单、库存和物流。

**版本**: v0.2.4 | **安装**: `npm install -g @optima-chat/optima-cli@latest`

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

**订单** (`optima order`)
- `list` - 订单列表
- `get <id>` - 订单详情
- `ship <id>` - 订单发货
- `complete <id>` - 完成订单
- `cancel <id>` - 取消订单

**库存** (`optima inventory`)
- `low-stock` - 低库存商品
- `update <id>` - 更新库存
- `history <id>` - 库存历史

**商户** (`optima merchant`)
- `info` - 商户信息
- `update` - 更新资料
- `setup` - 初始化资料

**物流** (`optima shipping`)
- `calculate` - 计算运费
- `history <id>` - 物流历史
- `update-status <id>` - 更新状态

**提示**: 使用 `optima <命令> --help` 查看详细用法和选项。
<!-- END_OPTIMA_CLI -->
