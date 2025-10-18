import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';

interface UpdateProductOptions {
  title?: string;
  handle?: string;
  price?: string;
  description?: string;
  stock?: string;
  sku?: string;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  categoryId?: string;
}

export const updateProductCommand = new Command('update')
  .description('更新商品')
  .argument('<product-id>', '商品 ID')
  .option('--title <title>', '商品名称')
  .option('--handle <handle>', 'URL 友好标识符（用于产品链接）')
  .option('--price <price>', '商品价格')
  .option('--description <description>', '商品描述')
  .option('--stock <stock>', '库存数量')
  .option('--sku <sku>', 'SKU 编码')
  .option('--status <status>', '商品状态 (active/inactive/draft/archived)')
  .option('--category-id <categoryId>', '分类 ID')
  .action(async (productId: string, options: UpdateProductOptions) => {
    try {
      await updateProduct(productId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateProduct(productId: string, options: UpdateProductOptions) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  // 检查是否提供了至少一个更新字段
  const hasUpdates = !!(
    options.title ||
    options.handle ||
    options.price ||
    options.description !== undefined ||
    options.stock ||
    options.sku ||
    options.status ||
    options.categoryId
  );

  if (!hasUpdates) {
    throw new ValidationError('请至少提供一个要更新的字段');
  }

  // 构造更新数据
  const updateData: any = {};

  if (options.title) {
    updateData.title = options.title;
  }

  if (options.handle) {
    updateData.handle = options.handle;
  }

  if (options.price) {
    const price = parseFloat(options.price);
    if (isNaN(price) || price < 0) {
      throw new ValidationError('价格必须是大于等于 0 的数字', 'price');
    }
    updateData.price = price;
  }

  if (options.description !== undefined) {
    updateData.description = options.description;
  }

  if (options.stock) {
    const stock = parseInt(options.stock, 10);
    if (isNaN(stock) || stock < 0) {
      throw new ValidationError('库存必须是大于等于 0 的整数', 'stock');
    }
    updateData.stock = stock;
  }

  if (options.sku) {
    updateData.sku = options.sku;
  }

  if (options.status) {
    if (!['active', 'inactive', 'draft', 'archived'].includes(options.status)) {
      throw new ValidationError('状态必须是 active/inactive/draft/archived 之一', 'status');
    }
    updateData.status = options.status;
  }

  if (options.categoryId) {
    updateData.category_id = options.categoryId;
  }

  const spinner = ora('正在更新商品...').start();

  try {
    const product = await commerceApi.products.update(productId, updateData);
    spinner.succeed('商品更新成功！');

    // 显示更新后的商品详情
    console.log();
    console.log(formatProduct(product));
    console.log();
  } catch (error: any) {
    spinner.fail('商品更新失败');
    throw createApiError(error);
  }
}
