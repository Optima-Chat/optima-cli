

## Optima CLI

电商店铺管理命令行工具 - 用自然语言管理商品、订单、库存和物流。

**版本**: v0.13.6 | **安装**: `npm install -g @optima-chat/optima-cli@latest`

### Available Modules (14)
**auth** - OAuth 认证管理（login, logout, whoami）
**merchant** - 商户资料管理（信息、URL、初始化设置）
**product** - 商品目录管理（CRUD、图片、URL）
**category** - 商品分类管理
**variant** - 商品变体/SKU 管理（规格、库存、图片）
**order** - 订单履行（发货、取消、完成、标记送达）
**refund** - 退款管理
**inventory** - 库存管理（低库存预警、更新、历史、预留）
**shipping** - 物流管理（运费计算、物流追踪）
**shipping-zone** - 运费区域配置（按地区设置运费费率）
**upload** - 媒体文件上传（图片、视频、文件）
**conversation** - 客服对话管理
**transfer** - 财务转账和汇总
**i18n** - 多语言翻译管理（商品/分类/商户的国际化）

### Best Practices

**非交互模式（关键）**
- 永远不要使用需要交互输入的命令
- 始终使用参数提供所有必需信息
- 删除/取消操作：添加 `-y` 或 `--yes` 跳过确认
- 不确定时先用 `--help` 检查可用参数

**图片上传最佳实践**
1. 先上传图片：`optima upload image --path ./photo.jpg`
2. 从响应获取 media_id
3. 关联到商品：`optima product add-images --id <product-id> --media-id <media-id>`
4. 这样避免重复上传，最可靠

**主动执行**
- 不要询问可选字段，使用占位符并继续
- 先完成任务，再报告创建了什么
- 不要因缺少可选信息而阻塞

### Common Command Examples

```bash
# 认证
optima auth login
optima auth whoami

# 商户管理
optima merchant info
optima merchant update --name "新店铺名称"
optima merchant setup --name "我的店铺" --origin-country-alpha2 CN --origin-city "深圳"
optima merchant url --open

# 商品管理
optima product create --title "陶瓷杯" --price 89 --stock 20
optima product list --limit 50
optima product get --id prod_123
optima product update --id prod_123 --price 99
optima product delete --id prod_123 -y
optima product url --id prod_123 --open

# 图片上传（推荐流程）
optima upload image --path ./photo.jpg
optima product add-images --id prod_123 --media-id media_456
optima product add-images --id prod_123 --path ./photo1.jpg ./photo2.jpg
optima product add-images --id prod_123 --url https://example.com/image.jpg

# 分类管理
optima category list
optima category create --name "电子产品"
optima category get --id cat_123
optima category update --id cat_123 --name "数码产品"
optima category delete --id cat_123 -y

# 变体管理（SKU/规格）
optima variant create --product-id prod_123 --sku "CUP-S-WHITE" --price 89 --stock 10 --attributes '{"size":"S","color":"White"}'
optima variant list --product-id prod_123
optima variant update --product-id prod_123 --id var_456 --price 99
optima variant delete --product-id prod_123 --id var_456 -y

# 订单履行
optima order list --status pending
optima order get --id order_123
optima order ship --id order_123 --tracking DHL123456 --carrier DHL
optima order complete --id order_456
optima order cancel --id order_789 -y
optima order mark-delivered --id order_123

# 退款管理
optima refund create --order-id order_123 --amount 50 --reason requested_by_customer
optima refund get --id refund_456

# 库存管理
optima inventory low-stock --threshold 5
optima inventory update --id prod_123 --quantity 100
optima inventory history --id prod_123
optima inventory reserve --id prod_123 --quantity 10

# 物流管理
optima shipping calculate --country US --postal-code 10001 --weight 0.5
optima shipping history --order-id order_123
optima shipping update-status --id shipping_456 --status delivered

# 运费区域配置
optima shipping-zone create --name "北美区域" --countries US,CA,MX --price 15 --currency USD
optima shipping-zone list
optima shipping-zone list-rates --zone-id zone_123
optima shipping-zone add-rate --zone-id zone_123 --price 20 --currency USD
optima shipping-zone delete --id zone_456 -y

# 文件上传
optima upload image --path ./product.jpg
optima upload video --path ./demo.mp4
optima upload file --path ./catalog.pdf

# 对话管理
optima conversation list
optima conversation get --id conv_123
optima conversation create --customer-id cust_456 --email "customer@example.com" --name "客户"
optima conversation send --id conv_123 --content "您好，有什么可以帮您？"
optima conversation close --id conv_123
optima conversation mark-read --id conv_123

# 财务管理
optima transfer list
optima transfer summary

# 多语言翻译
optima i18n languages
optima i18n product create --product-id prod_123 --lang zh-CN --name "陶瓷杯" --description "精美手工制作"
optima i18n product list --product-id prod_123
optima i18n product get --product-id prod_123 --lang zh-CN
optima i18n product update --product-id prod_123 --lang zh-CN --name "手工陶瓷杯"
optima i18n product delete --product-id prod_123 --lang zh-CN -y
optima i18n category create --category-id cat_123 --lang es-ES --name "Electrónica"
optima i18n merchant create --lang ja-JP --name "私のストア"
```

### Tips
- 使用 `optima <命令> --help` 查看详细用法
- 所有 ID 参数使用 `--id`、`--product-id` 等选项格式
- 删除/取消操作需要 `-y` 或 `--yes` 跳过确认
- 支持的语言代码：en-US, es-ES, ja-JP, vi-VN, zh-CN
<!-- END_OPTIMA_CLI -->
