import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

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

interface UpdateProductOptionsWithId extends UpdateProductOptions {
  id?: string;
}

const cmd = new Command('update')
  .description('Update product details by ID')
  .option('--id <uuid>', 'Product ID (required)')
  .option('--title <string>', 'Product name')
  .option('--handle <string>', 'URL-friendly slug for product page')
  .option('--price <number>', 'Product price')
  .option('--description <string>', 'Product description')
  .option('--stock <number>', 'Stock quantity')
  .option('--sku <string>', 'SKU code')
  .option('--status <string>', 'Status: active|inactive|draft|archived')
  .option('--category-id <uuid>', 'Category ID')
  .action(async (options: UpdateProductOptionsWithId) => {
    try {
      if (!options.id) {
        throw new ValidationError('请提供商品 ID (--id)', 'id');
      }
      await updateProduct(options.id, options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Update product price',
    '$ optima product update --id abc-123-def --price 39.99',
    '',
    '# Update multiple fields',
    '$ optima product update \\',
    '  --id abc-123-def \\',
    '  --title "Premium Ceramic Mug" \\',
    '  --price 39.99 \\',
    '  --stock 150',
    '',
    '# Change product status',
    '$ optima product update --id abc-123-def --status inactive',
    '',
    '# Update with JSON output',
    '$ optima product update --id abc-123-def --price 39.99 --json',
  ],
  output: {
    example: JSON.stringify(
      {
        success: true,
        data: {
          product: {
            product_id: 'uuid',
            name: 'Updated name',
            price: '39.99',
            status: 'active',
            updated_at: 'timestamp',
          },
        },
        message: 'Product updated successfully',
      },
      null,
      2
    ),
  },
  relatedCommands: [
    { command: 'product get', description: 'View current product details' },
    { command: 'product list', description: 'Find product IDs' },
    { command: 'inventory update', description: 'Update stock separately' },
  ],
  notes: [
    'Product ID is required, use \'optima product list\' to find IDs',
    'Only specified fields will be updated, others remain unchanged',
    'Status values: active (live), inactive (hidden), draft (unpublished), archived',
    'handle must be unique and URL-safe (lowercase, hyphens only)',
  ],
});

export const updateProductCommand = cmd;

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

  const spinner = output.spinner('正在更新商品...');

  try {
    const product = await commerceApi.products.update(productId, updateData);
    spinner.succeed('商品更新成功！');

    if (output.isJson()) {
      output.success({
        product_id: product.id || product.product_id,
        updated_fields: Object.keys(updateData),
        product: product
      });
    } else {
      // 显示更新后的商品详情
      console.log();
      console.log(formatProduct(product));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('商品更新失败');
    throw createApiError(error);
  }
}
