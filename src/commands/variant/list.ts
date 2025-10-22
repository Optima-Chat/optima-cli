import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariantList } from '../../utils/format.js';

export const listVariantsCommand = new Command('list')
  .description('商品变体列表')
  .option('--product-id <id>', '商品 ID')
  .action(async (options: { productId?: string }) => {
    try {
      await listVariants(options);
    } catch (error) {
      handleError(error);
    }
  });

async function listVariants(options: { productId?: string }) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const productId = options.productId;

  const spinner = ora('正在获取变体列表...').start();

  try {
    const variants = await commerceApi.variants.list(productId);
    spinner.stop();

    // 显示变体列表
    console.log();
    console.log(formatVariantList(variants));
  } catch (error: any) {
    spinner.fail('获取变体列表失败');
    throw createApiError(error);
  }
}
