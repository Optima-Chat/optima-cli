import Table from 'cli-table3';
import chalk from 'chalk';
import dayjs from 'dayjs';

/**
 * 格式化日期
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

/**
 * 格式化价格
 */
export function formatPrice(price: number | string, currency: string = 'USD'): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * 截取 ID 显示（前 12 位）
 */
export function truncateId(id: string, length: number = 12): string {
  if (!id) return '-';
  return id.length > length ? id.substring(0, length) : id;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 商品状态格式化
 */
export function formatProductStatus(status: string): string {
  const statusMap: Record<string, { text: string; color: typeof chalk.green }> = {
    active: { text: '上架', color: chalk.green },
    inactive: { text: '下架', color: chalk.gray },
    draft: { text: '草稿', color: chalk.yellow },
    archived: { text: '归档', color: chalk.gray },
  };
  const config = statusMap[status] || { text: status, color: chalk.white };
  return config.color(config.text);
}

/**
 * 订单状态格式化
 */
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, { text: string; color: typeof chalk.green }> = {
    pending: { text: '待处理', color: chalk.yellow },
    paid: { text: '已支付', color: chalk.blue },
    processing: { text: '处理中', color: chalk.cyan },
    shipped: { text: '已发货', color: chalk.cyan },
    delivered: { text: '已送达', color: chalk.green },
    completed: { text: '已完成', color: chalk.green },
    cancelled: { text: '已取消', color: chalk.gray },
    refunded: { text: '已退款', color: chalk.magenta },
  };
  const config = statusMap[status] || { text: status, color: chalk.white };
  return config.color(config.text);
}

/**
 * 库存状态格式化
 */
export function formatStockStatus(stock: number, lowStockThreshold: number = 5): string {
  if (stock === 0) {
    return chalk.red(`${stock} (缺货)`);
  } else if (stock <= lowStockThreshold) {
    return chalk.yellow(`${stock} (低库存)`);
  } else {
    return chalk.green(stock.toString());
  }
}

/**
 * 格式化商品列表
 */
export function formatProductList(products: any[]): string {
  if (!products || products.length === 0) {
    return chalk.yellow('暂无商品');
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('名称'),
      chalk.cyan('价格'),
      chalk.cyan('库存'),
      chalk.cyan('状态'),
      chalk.cyan('创建时间'),
    ],
    colWidths: [38, 30, 15, 12, 12, 18],
    wordWrap: true,
  });

  products.forEach((product) => {
    table.push([
      product.id || product.product_id || '-',
      product.title || product.name || '-',
      formatPrice(product.price || 0, product.currency || 'USD'),
      formatStockStatus(product.stock_quantity || product.stock || product.quantity || 0),
      formatProductStatus(product.status || 'active'),
      formatDate(product.created_at),
    ]);
  });

  return table.toString();
}

/**
 * 格式化商品详情
 */
export function formatProduct(product: any): string {
  const lines: string[] = [];
  const separator = chalk.gray('─'.repeat(60));

  lines.push(separator);
  lines.push(chalk.cyan.bold('商品详情'));
  lines.push(separator);

  lines.push(`${chalk.gray('ID:')}          ${product.id || product.product_id}`);
  lines.push(`${chalk.gray('名称:')}        ${product.title || product.name || '-'}`);
  lines.push(`${chalk.gray('价格:')}        ${chalk.green(formatPrice(product.price || 0, product.currency || 'USD'))}`);
  lines.push(`${chalk.gray('库存:')}        ${formatStockStatus(product.stock_quantity || product.stock || product.quantity || 0)}`);
  lines.push(`${chalk.gray('状态:')}        ${formatProductStatus(product.status || 'active')}`);

  if (product.description) {
    lines.push(`${chalk.gray('描述:')}        ${product.description}`);
  }

  if (product.sku) {
    lines.push(`${chalk.gray('SKU:')}         ${product.sku}`);
  }

  if (product.category) {
    lines.push(`${chalk.gray('分类:')}        ${product.category}`);
  }

  if (product.images && product.images.length > 0) {
    lines.push(`${chalk.gray('图片数量:')}    ${product.images.length}`);
  }

  lines.push(`${chalk.gray('创建时间:')}    ${formatDate(product.created_at)}`);
  lines.push(`${chalk.gray('更新时间:')}    ${formatDate(product.updated_at)}`);

  lines.push(separator);

  return lines.join('\n');
}

/**
 * 格式化订单列表
 */
export function formatOrderList(orders: any[]): string {
  if (!orders || orders.length === 0) {
    return chalk.yellow('暂无订单');
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('订单号'),
      chalk.cyan('客户'),
      chalk.cyan('金额'),
      chalk.cyan('状态'),
      chalk.cyan('时间'),
    ],
    colWidths: [38, 15, 20, 15, 12, 18],
    wordWrap: true,
  });

  orders.forEach((order) => {
    table.push([
      order.id || order.order_id || '-',
      order.order_number || '-',
      order.customer_name || order.customer_email || '-',
      formatPrice(order.total_amount || order.total || order.amount || 0, order.currency || 'USD'),
      formatOrderStatus(order.status || 'pending'),
      formatDate(order.created_at || order.order_date),
    ]);
  });

  return table.toString();
}

/**
 * 格式化订单详情
 */
export function formatOrder(order: any): string {
  const lines: string[] = [];
  const separator = chalk.gray('─'.repeat(60));

  lines.push(separator);
  lines.push(chalk.cyan.bold('订单详情'));
  lines.push(separator);

  lines.push(`${chalk.gray('订单号:')}      ${order.order_number || order.id || order.order_id}`);
  lines.push(`${chalk.gray('状态:')}        ${formatOrderStatus(order.status || 'pending')}`);
  lines.push(`${chalk.gray('金额:')}        ${chalk.green(formatPrice(order.total_amount || order.total || order.amount || 0, order.currency || 'USD'))}`);

  if (order.customer_name) {
    lines.push(`${chalk.gray('客户姓名:')}    ${order.customer_name}`);
  }
  if (order.customer_email) {
    lines.push(`${chalk.gray('客户邮箱:')}    ${order.customer_email}`);
  }

  if (order.shipping_address) {
    const addr = order.shipping_address;
    const addrParts = [
      addr.line_1,
      addr.line_2,
      addr.city,
      addr.state,
      addr.postal_code,
      addr.country_alpha2,
    ].filter(Boolean);
    lines.push(`${chalk.gray('收货地址:')}    ${addrParts.join(', ')}`);
    if (addr.contact_name) {
      lines.push(`${chalk.gray('收件人:')}      ${addr.contact_name} ${addr.contact_phone || ''}`);
    }
  }

  if (order.tracking_number) {
    lines.push(`${chalk.gray('物流单号:')}    ${order.tracking_number}`);
  }

  if (order.carrier) {
    lines.push(`${chalk.gray('物流公司:')}    ${order.carrier}`);
  }

  lines.push(`${chalk.gray('创建时间:')}    ${formatDate(order.created_at || order.order_date)}`);
  lines.push(`${chalk.gray('更新时间:')}    ${formatDate(order.updated_at)}`);

  lines.push(separator);

  // 订单商品
  if (order.items && order.items.length > 0) {
    lines.push(chalk.cyan.bold('订单商品'));
    lines.push(separator);

    order.items.forEach((item: any, index: number) => {
      lines.push(`${index + 1}. ${item.product_name || item.name || '-'}`);
      lines.push(`   数量: ${item.quantity || 1}  单价: ${formatPrice(item.price || 0, order.currency || 'USD')}`);
    });

    lines.push(separator);
  }

  return lines.join('\n');
}

/**
 * 格式化库存列表
 */
export function formatInventoryList(items: any[]): string {
  if (!items || items.length === 0) {
    return chalk.yellow('暂无库存记录');
  }

  const table = new Table({
    head: [
      chalk.cyan('商品 ID'),
      chalk.cyan('商品名称'),
      chalk.cyan('当前库存'),
      chalk.cyan('状态'),
      chalk.cyan('更新时间'),
    ],
    colWidths: [38, 30, 12, 15, 18],
    wordWrap: true,
  });

  items.forEach((item) => {
    const stock = item.stock_quantity || item.stock || item.quantity || 0;
    table.push([
      item.product_id || item.id || '-',
      item.product_name || item.name || '-',
      formatStockStatus(stock),
      stock <= 0 ? chalk.red('缺货') : stock <= 5 ? chalk.yellow('低库存') : chalk.green('正常'),
      formatDate(item.updated_at),
    ]);
  });

  return table.toString();
}

/**
 * 格式化成功消息
 */
export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * 格式化警告消息
 */
export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * 格式化信息消息
 */
export function formatInfo(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * 格式化分类列表
 */
export function formatCategoryList(categories: any[]): string {
  if (!categories || categories.length === 0) {
    return chalk.yellow('暂无分类');
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('名称'),
      chalk.cyan('描述'),
      chalk.cyan('父分类 ID'),
      chalk.cyan('创建时间'),
    ],
    colWidths: [38, 30, 40, 38, 18],
    wordWrap: true,
  });

  categories.forEach((category) => {
    table.push([
      category.id || category.category_id || '-',
      category.name || '-',
      category.description || '-',
      category.parent_id || '-',
      formatDate(category.created_at),
    ]);
  });

  return table.toString();
}

/**
 * 格式化分类详情
 */
export function formatCategory(category: any): string {
  const lines: string[] = [];
  const separator = chalk.gray('─'.repeat(60));

  lines.push(separator);
  lines.push(chalk.cyan.bold('分类详情'));
  lines.push(separator);

  lines.push(`${chalk.gray('ID:')}          ${category.id || category.category_id}`);
  lines.push(`${chalk.gray('名称:')}        ${category.name || '-'}`);

  if (category.description) {
    lines.push(`${chalk.gray('描述:')}        ${category.description}`);
  }

  if (category.parent_id) {
    lines.push(`${chalk.gray('父分类 ID:')}  ${category.parent_id}`);
  }

  lines.push(`${chalk.gray('创建时间:')}    ${formatDate(category.created_at)}`);
  lines.push(`${chalk.gray('更新时间:')}    ${formatDate(category.updated_at)}`);

  lines.push(separator);

  return lines.join('\n');
}

/**
 * 格式化变体列表
 */
export function formatVariantList(variants: any[]): string {
  if (!variants || variants.length === 0) {
    return chalk.yellow('暂无变体');
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('SKU'),
      chalk.cyan('价格'),
      chalk.cyan('库存'),
      chalk.cyan('属性'),
      chalk.cyan('创建时间'),
    ],
    colWidths: [38, 20, 15, 12, 30, 18],
    wordWrap: true,
  });

  variants.forEach((variant) => {
    const attributes = variant.attributes
      ? Object.entries(variant.attributes)
          .map(([key, value]) => `${key}:${value}`)
          .join(', ')
      : '-';

    table.push([
      variant.id || variant.variant_id || '-',
      variant.sku || '-',
      variant.price !== undefined ? `${variant.price}` : '-',
      variant.stock !== undefined ? formatStockStatus(variant.stock) : '-',
      attributes,
      formatDate(variant.created_at),
    ]);
  });

  return table.toString();
}

/**
 * 格式化变体详情
 */
export function formatVariant(variant: any): string {
  const lines: string[] = [];
  const separator = chalk.gray('─'.repeat(60));

  lines.push(separator);
  lines.push(chalk.cyan.bold('变体详情'));
  lines.push(separator);

  lines.push(`${chalk.gray('ID:')}          ${variant.id || variant.variant_id}`);

  if (variant.product_id) {
    lines.push(`${chalk.gray('商品 ID:')}    ${variant.product_id}`);
  }

  if (variant.sku) {
    lines.push(`${chalk.gray('SKU:')}         ${variant.sku}`);
  }

  if (variant.price !== undefined) {
    lines.push(`${chalk.gray('价格:')}        ${chalk.green(variant.price.toString())}`);
  }

  if (variant.stock !== undefined) {
    lines.push(`${chalk.gray('库存:')}        ${formatStockStatus(variant.stock)}`);
  }

  if (variant.attributes && Object.keys(variant.attributes).length > 0) {
    lines.push(`${chalk.gray('属性:')}`);
    Object.entries(variant.attributes).forEach(([key, value]) => {
      lines.push(`  ${chalk.gray(`${key}:`)} ${value}`);
    });
  }

  if (variant.images && variant.images.length > 0) {
    lines.push(`${chalk.gray('图片数量:')}    ${variant.images.length}`);
  }

  lines.push(`${chalk.gray('创建时间:')}    ${formatDate(variant.created_at)}`);
  lines.push(`${chalk.gray('更新时间:')}    ${formatDate(variant.updated_at)}`);

  lines.push(separator);

  return lines.join('\n');
}
