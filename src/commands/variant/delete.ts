import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment } from '../../utils/interactive.js';

interface DeleteVariantOptions {
  productId?: string;
  variantId?: string;
  yes?: boolean;
}

const cmd = new Command('delete')
  .description('Delete a product variant (SKU)')
  .option('--product-id <uuid>', 'Product ID (required)')
  .option('--variant-id <uuid>', 'Variant ID (required)')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action(async (options: DeleteVariantOptions) => {
    try {
      await deleteVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Delete variant with confirmation',
    '$ optima variant delete \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456',
    '',
    '# Delete without confirmation (non-interactive)',
    '$ optima variant delete \\',
    '  --product-id abc-123 \\',
    '  --variant-id var-456 \\',
    '  --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        variant_id: 'uuid',
        deleted: true
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'variant list', description: 'Find variant IDs before deleting' },
    { command: 'variant create', description: 'Create new variant' },
  ],
  notes: [
    'product-id and variant-id are required',
    'Requires confirmation unless --yes flag is used',
    'Use --yes for non-interactive/automated operations',
    'This action cannot be undone',
  ]
});

export const deleteVariantCommand = cmd;

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
    if (isInteractiveEnvironment()) {
      // 交互模式：显示确认提示
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
    } else {
      // 非交互模式：要求使用 --yes 标志
      throw new ValidationError(
        '非交互环境需要使用 --yes 标志确认删除操作',
        'yes'
      );
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
