import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('get')
  .description('Get detailed information for a specific product by ID')
  .option('--id <uuid>', 'Product ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await getProduct(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get product details',
    '$ optima product get --id abc-123-def',
    '',
    '# Get product details in JSON format',
    '$ optima product get --id abc-123-def --json',
    '',
    '# Get product ID from list, then fetch details',
    '$ optima product list --limit 1',
    '$ optima product get --id <product_id_from_list>',
  ],
  output: {
    example: JSON.stringify(
      {
        success: true,
        data: {
          product: {
            product_id: 'uuid',
            name: 'Product name',
            handle: 'url-slug',
            description: 'Product description',
            price: '29.99',
            currency: 'USD',
            status: 'active',
            stock_quantity: 100,
            sku: 'SKU-001',
            category_id: 'uuid',
            images: ['https://...'],
            created_at: 'timestamp',
            updated_at: 'timestamp',
          },
          product_url: 'https://{slug}.optima.shop/products/{handle}',
        },
      },
      null,
      2
    ),
  },
  relatedCommands: [
    { command: 'product list', description: 'Get product IDs to query' },
    { command: 'product update', description: 'Update product details' },
    { command: 'product url', description: 'Get product frontend URL' },
    { command: 'variant list', description: 'List product variants' },
  ],
  notes: [
    'Product ID is required (use \'optima product list\' to find IDs)',
    'Returns full product details including images and metadata',
    'product_url is automatically generated from merchant slug and product handle',
  ],
});

export const getProductCommand = cmd;

async function getProduct(options: { id?: string }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'id');
  }

  const productId = options.id;

  const spinner = output.spinner('正在获取商品详情...');

  try {
    const product = await commerceApi.products.get(productId);
    spinner.succeed('商品详情获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      const data: any = { product };

      // 尝试获取商品链接
      if (product.handle) {
        try {
          const merchant = await commerceApi.merchant.getProfile();
          if (merchant.slug) {
            data.product_url = `https://${merchant.slug}.optima.shop/products/${product.handle}`;
          }
        } catch (err) {
          // 静默失败
        }
      }

      output.success(data);
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(formatProduct(product));

      // 显示商品链接
      if (product.handle) {
        // 获取商户信息以获取 slug
        const merchantSpinner = output.spinner('获取店铺链接...');
        try {
          const merchant = await commerceApi.merchant.getProfile();
          merchantSpinner.stop();

          if (merchant.slug) {
            const productUrl = `https://${merchant.slug}.optima.shop/products/${product.handle}`;
            console.log(chalk.gray('产品链接: ') + chalk.cyan.underline(productUrl));
          }
        } catch (err) {
          merchantSpinner.stop();
          // 静默失败，商品详情已经显示
        }
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('获取商品详情失败');
    throw createApiError(error);
  }
}
