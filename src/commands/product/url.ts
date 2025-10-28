import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('url')
  .description('Get public product URL and optionally open in browser')
  .option('--id <uuid>', 'Product ID (required)')
  .option('--open', 'Open product page in browser')
  .action(async (options: { id?: string; open?: boolean }) => {
    try {
      await getProductUrl(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get product URL',
    '$ optima product url --id prod-123',
    '',
    '# Open product page in browser',
    '$ optima product url --id prod-123 --open',
  ],
  output: {
    description: 'Returns public storefront URL for the product',
    example: JSON.stringify({
      success: true,
      data: {
        url: 'https://your-store.optima.shop/products/ceramic-mug',
        product_id: 'uuid',
        handle: 'ceramic-mug',
        slug: 'your-store',
        opened: false
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'product get', description: 'View product details' },
    { command: 'merchant info', description: 'Check store slug' },
    { command: 'product update', description: 'Update product handle' },
  ],
  notes: [
    'Product ID is required',
    'Product must have a handle (URL slug) set',
    'Merchant must have a slug configured',
    'URL format: https://{merchant-slug}.optima.shop/products/{product-handle}',
    'Use --open to automatically open in browser',
  ]
});

export const urlCommand = cmd;

async function getProductUrl(options: { id?: string; open?: boolean }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'id');
  }

  const productId = options.id;
  const shouldOpen = options.open || false;

  const spinner = output.spinner('正在获取产品信息...');

  try {
    // 并行获取商品信息和商户信息
    const [product, merchant] = await Promise.all([
      commerceApi.products.get(productId),
      commerceApi.merchant.getProfile(),
    ]);

    spinner.succeed('产品信息获取成功');

    // 检查是否有必要的字段
    if (!product.handle) {
      if (output.isJson()) {
        output.error(new Error('产品 handle 未设置'), 'HANDLE_NOT_SET');
      } else {
        console.log(chalk.yellow('\n⚠️  产品 handle 未设置\n'));
      }
      return;
    }

    if (!merchant.slug) {
      if (output.isJson()) {
        output.error(new Error('店铺 slug 未设置'), 'SLUG_NOT_SET');
      } else {
        console.log(chalk.yellow('\n⚠️  店铺 slug 未设置\n'));
      }
      return;
    }

    const productUrl = `https://${merchant.slug}.optima.shop/products/${product.handle}`;

    // 如果指定了 --open，在浏览器中打开
    if (shouldOpen) {
      try {
        await open(productUrl);
      } catch (error) {
        // 静默失败
      }
    }

    if (output.isJson()) {
      output.success({
        url: productUrl,
        product_id: product.id || product.product_id,
        handle: product.handle,
        slug: merchant.slug,
        opened: shouldOpen
      });
    } else {
      // 只输出链接（方便脚本使用）
      console.log(productUrl);

      if (shouldOpen) {
        console.log(chalk.gray('\n已在浏览器中打开产品页面\n'));
      }
    }
  } catch (error: any) {
    spinner.fail('获取产品信息失败');
    throw createApiError(error);
  }
}
