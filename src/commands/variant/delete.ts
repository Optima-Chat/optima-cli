import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface DeleteVariantOptions {
  yes?: boolean;
}

export const deleteVariantCommand = new Command('delete')
  .description('删除变体')
  .argument('<product-id>', '商品 ID')
  .argument('<variant-id>', '变体 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (productId: string, variantId: string, options: DeleteVariantOptions) => {
    try {
      await deleteVariant(productId, variantId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteVariant(productId: string, variantId: string, options: DeleteVariantOptions) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }
  if (!variantId || variantId.trim().length === 0) {
    throw new ValidationError('变体 ID 不能为空', 'variant-id');
  }

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

  const spinner = ora('正在删除变体...').start();

  try {
    await commerceApi.variants.delete(productId, variantId);
    spinner.succeed('变体删除成功！');
    console.log();
  } catch (error: any) {
    spinner.fail('变体删除失败');
    throw createApiError(error);
  }
}
