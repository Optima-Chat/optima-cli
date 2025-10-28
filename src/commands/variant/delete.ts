import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface DeleteVariantOptions {
  productId?: string;
  variantId?: string;
  yes?: boolean;
}

export const deleteVariantCommand = new Command('delete')
  .description('删除变体')
  .option('--product-id <id>', '商品 ID')
  .option('--variant-id <id>', '变体 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (options: DeleteVariantOptions) => {
    try {
      await deleteVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteVariant(options: DeleteVariantOptions) {
  // 验证参数
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!options.variantId || options.variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

  const productId = options.productId;
  const variantId = options.variantId;

  // 确认删除（除非使用 --yes）
  if (!options.yes) {
    console.log(chalk.yellow(`\n⚠️  即将删除变体: ${variantId}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确定要删除此变体吗？',
        default: false,
      },
    ]);

    if (!answers.confirmed) {
      console.log(chalk.gray('\n已取消删除\n'));
      return;
    }
  }

  const spinner = output.spinner('正在删除变体...');

  try {
    await commerceApi.variants.delete(productId, variantId);
    spinner.succeed('变体删除成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        variant_id: variantId,
        deleted: true
      });
    } else {
      console.log();
    }
  } catch (error: any) {
    spinner.fail('变体删除失败');
    throw createApiError(error);
  }
}
