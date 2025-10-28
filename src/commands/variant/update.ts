import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariant } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface UpdateVariantOptions {
  productId?: string;
  variantId?: string;
  sku?: string;
  price?: string;
  stock?: string;
  attributes?: string;
}

const cmd = new Command('update')
  .description('Update variant details (SKU, price, stock, or attributes)')
  .option('--product-id <uuid>', 'Product ID (required)')
  .option('--variant-id <uuid>', 'Variant ID (required)')
  .option('-s, --sku <string>', 'New SKU code')
  .option('-p, --price <number>', 'New price')
  .option('--stock <number>', 'New stock quantity')
  .option('-a, --attributes <json>', 'New attributes (JSON format)')
  .action(async (options: UpdateVariantOptions) => {
    try {
      await updateVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Update variant price',
    '$ optima variant update \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --price 99',
    '',
    '# Update variant stock',
    '$ optima variant update \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --stock 50',
    '',
    '# Update multiple fields',
    '$ optima variant update \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --sku "MUG-L-RED" \\',
    '  --price 109 \\',
    '  --attributes \'{"size":"L","color":"Red"}\'',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        variant_id: 'uuid',
        updated_fields: ['price', 'stock'],
        variant: {
          variant_id: 'uuid',
          sku: 'MUG-S-WHITE',
          price: '99.00',
          stock: 50,
          attributes: {
            size: 'S',
            color: 'White'
          },
          updated_at: 'timestamp'
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'variant list', description: 'Find variant IDs' },
    { command: 'inventory update', description: 'Alternative for stock updates' },
  ],
  notes: [
    'product-id and variant-id are required',
    'At least one update field must be provided',
    'Use \'optima variant list\' to find variant IDs',
  ]
});

export const updateVariantCommand = cmd;

async function updateVariant(options: UpdateVariantOptions) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!options.variantId || options.variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

  const productId = options.productId;
  const variantId = options.variantId;

  // 构建更新数据
  const updateData: any = {};

  if (options.sku !== undefined) {
    updateData.sku = options.sku;
  }

  if (options.price !== undefined) {
    const priceNum = parseFloat(options.price);
    if (isNaN(priceNum)) {
      throw new ValidationError('价格必须是有效数字', 'price');
    }
    updateData.price = priceNum;
  }

  if (options.stock !== undefined) {
    const stockNum = parseInt(options.stock, 10);
    if (isNaN(stockNum)) {
      throw new ValidationError('库存必须是有效整数', 'stock');
    }
    updateData.stock = stockNum;
  }

  if (options.attributes !== undefined) {
    try {
      updateData.attributes = JSON.parse(options.attributes);
    } catch {
      throw new ValidationError('属性必须是有效的 JSON 格式', 'attributes');
    }
  }

  // 检查是否有更新内容
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('请至少提供一个要更新的字段', 'options');
  }

  const spinner = output.spinner('正在更新变体...');

  try {
    const variant = await commerceApi.variants.update(productId, variantId, updateData);
    spinner.succeed('变体更新成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        variant_id: variantId,
        updated_fields: Object.keys(updateData),
        variant
      });
    } else {
      // 显示变体详情
      console.log();
      console.log(formatVariant(variant));
    }
  } catch (error: any) {
    spinner.fail('变体更新失败');
    throw createApiError(error);
  }
}
