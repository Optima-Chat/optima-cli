import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import open from 'open';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const urlCommand = new Command('url')
  .description('获取产品链接')
  .argument('<product-id>', '商品 ID')
  .option('--open', '在浏览器中打开产品页面')
  .action(async (productId: string, options) => {
    try {
      await getProductUrl(productId, options.open);
    } catch (error) {
      handleError(error);
    }
  });

async function getProductUrl(productId: string, shouldOpen: boolean) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const spinner = ora('正在获取产品信息...').start();

  try {
    // 并行获取商品信息和商户信息
    const [product, merchant] = await Promise.all([
      commerceApi.products.get(productId),
      commerceApi.merchant.getProfile(),
    ]);

    spinner.stop();

    // 检查是否有必要的字段
    if (!product.handle) {
      console.log(chalk.yellow('\n⚠️  产品 handle 未设置\n'));
      return;
    }

    if (!merchant.slug) {
      console.log(chalk.yellow('\n⚠️  店铺 slug 未设置\n'));
      return;
    }

    const productUrl = `https://${merchant.slug}.optima.shop/products/${product.handle}`;

    // 只输出链接（方便脚本使用）
    console.log(productUrl);

    // 如果指定了 --open，在浏览器中打开
    if (shouldOpen) {
      try {
        await open(productUrl);
        console.log(chalk.gray('\n已在浏览器中打开产品页面\n'));
      } catch (error) {
        console.log(chalk.yellow(`\n⚠️  无法自动打开浏览器，请手动访问: ${productUrl}\n`));
      }
    }
  } catch (error: any) {
    spinner.fail('获取产品信息失败');
    throw createApiError(error);
  }
}
