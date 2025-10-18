import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariant } from '../../utils/format.js';

export const getVariantCommand = new Command('get')
  .description('变体详情')
  .argument('<product-id>', '商品 ID')
  .argument('<variant-id>', '变体 ID')
  .action(async (productId: string, variantId: string) => {
    try {
      await getVariant(productId, variantId);
    } catch (error) {
      handleError(error);
    }
  });

async function getVariant(productId: string, variantId: string) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!variantId || variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

  const spinner = ora('正在获取变体详情...').start();

  try {
    const variant = await commerceApi.variants.get(productId, variantId);
    spinner.stop();

    // 显示变体详情
    console.log();
    console.log(formatVariant(variant));
  } catch (error: any) {
    spinner.fail('获取变体详情失败');
    throw createApiError(error);
  }
}
