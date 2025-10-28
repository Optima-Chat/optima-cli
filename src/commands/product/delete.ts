import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface DeleteProductOptions {
  id?: string;
  yes?: boolean;
}

const cmd = new Command('delete')
  .description('Delete a product permanently')
  .option('--id <uuid>', 'Product ID (required)')
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: DeleteProductOptions) => {
    try {
      if (!options.id) {
        throw new ValidationError('请提供商品 ID (--id)', 'id');
      }
      await deleteProduct(options.id, options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Delete product with confirmation',
    '$ optima product delete --id prod-123',
    '',
    '# Delete without confirmation (non-interactive)',
    '$ optima product delete --id prod-123 --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        deleted: true
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'product list', description: 'Find product IDs' },
    { command: 'product get', description: 'View product before deleting' },
  ],
  notes: [
    'Product ID is required',
    'Requires confirmation unless --yes flag is used',
    'This action cannot be undone',
    'Use --yes for non-interactive/automated operations',
  ]
});

export const deleteProductCommand = cmd;

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

  const spinner = output.spinner('正在删除商品...');

  try {
    await commerceApi.products.delete(productId);
    spinner.succeed('商品删除成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        deleted: true
      });
    } else {
      console.log();
    }
  } catch (error: any) {
    spinner.fail('商品删除失败');
    throw createApiError(error);
  }
}
