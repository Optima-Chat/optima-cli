import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariantList } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('list')
  .description('List all variants (SKUs) for a product')
  .option('--product-id <uuid>', 'Product ID (required)')
  .action(async (options: { productId?: string }) => {
    try {
      await listVariants(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List all variants for a product',
    '$ optima variant list --product-id abc-123',
    '',
    '# Get variants in JSON format',
    '$ optima variant list --product-id abc-123 --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        variants: [
          {
            variant_id: 'uuid',
            sku: 'MUG-S-WHITE',
            price: '89.00',
            stock: 10,
            attributes: {
              size: 'S',
              color: 'White'
            }
          },
          {
            variant_id: 'uuid',
            sku: 'MUG-M-BLUE',
            price: '89.00',
            stock: 15,
            attributes: {
              size: 'M',
              color: 'Blue'
            }
          }
        ],
        product_id: 'abc-123',
        total: 2
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'variant create', description: 'Create new variant' },
    { command: 'variant update', description: 'Update variant details' },
    { command: 'product list', description: 'Find product IDs' },
  ],
  notes: [
    'product-id is required',
    'Shows all SKUs and their attributes for a product',
    'Use this to find variant IDs for update/delete operations',
  ]
});

export const listVariantsCommand = cmd;

async function listVariants(options: { productId?: string }) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const productId = options.productId;

  const spinner = output.spinner('正在获取变体列表...');

  try {
    const variants = await commerceApi.variants.list(productId);
    spinner.succeed('变体列表获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        variants,
        product_id: productId,
        total: variants.length
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(formatVariantList(variants));
    }
  } catch (error: any) {
    spinner.fail('获取变体列表失败');
    throw createApiError(error);
  }
}
