import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface DeleteProductOptions {
  yes?: boolean;
}

export const deleteProductCommand = new Command('delete')
  .description('删除商品')
  .argument('<product-id>', '商品 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (productId: string, options: DeleteProductOptions) => {
    try {
      await deleteProduct(productId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteProduct(productId: string, options: DeleteProductOptions) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  // 确认删除（除非使用 --yes）
  if (!options.yes) {
    console.log(chalk.yellow(`\n⚠️  即将删除商品: ${productId}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '确定要删除此商品吗？',
        default: false,
      },
    ]);

    if (!answers.confirmed) {
      console.log(chalk.gray('\n已取消删除\n'));
      return;
    }
  }

  const spinner = ora('正在删除商品...').start();

  try {
    await commerceApi.products.delete(productId);
    spinner.succeed('商品删除成功！');
    console.log();
  } catch (error: any) {
    spinner.fail('商品删除失败');
    throw createApiError(error);
  }
}
