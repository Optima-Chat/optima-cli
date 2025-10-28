import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import { output } from '../../utils/output.js';

export const getProductCommand = new Command('get')
  .description('商品详情')
  .option('--id <id>', '商品 ID')
  .action(async (options: { id?: string }) => {
    try {
      await getProduct(options);
    } catch (error) {
      handleError(error);
    }
  });

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
