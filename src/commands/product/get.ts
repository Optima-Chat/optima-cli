import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';

export const getProductCommand = new Command('get')
  .description('商品详情')
  .argument('<product-id>', '商品 ID')
  .action(async (productId: string) => {
    try {
      await getProduct(productId);
    } catch (error) {
      handleError(error);
    }
  });

async function getProduct(productId: string) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const spinner = ora('正在获取商品详情...').start();

  try {
    const product = await commerceApi.products.get(productId);
    spinner.stop();

    // 显示商品详情
    console.log();
    console.log(formatProduct(product));

    // 显示商品链接
    const productUrl = `https://go.optima.shop/products/${product.id || product.product_id}`;
    console.log(chalk.gray('商品链接: ') + chalk.cyan(productUrl));
    console.log();
  } catch (error: any) {
    spinner.fail('获取商品详情失败');
    throw createApiError(error);
  }
}
