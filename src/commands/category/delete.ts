import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment } from '../../utils/interactive.js';

interface DeleteCategoryOptions {
  id?: string;
  yes?: boolean;
}

const cmd = new Command('delete')
  .description('Delete product category permanently')
  .option('--id <id>', 'Category ID (required)')
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: DeleteCategoryOptions) => {
    try {
      await deleteCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Delete category with confirmation',
    '$ optima category delete --id cat-123',
    '',
    '# Delete without confirmation (non-interactive)',
    '$ optima category delete --id cat-123 --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        category_id: 'uuid',
        deleted: true
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'category list', description: 'Find category IDs' },
    { command: 'category get', description: 'View details before deleting' },
  ],
  notes: [
    'Category ID is required',
    'This action cannot be undone',
    'Requires confirmation unless --yes flag is used',
    'Use --yes for non-interactive/automated operations',
  ]
});

export const deleteCategoryCommand = cmd;

async function deleteCategory(options: DeleteCategoryOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'id');
  }

  const categoryId = options.id;

  // 确认删除（除非使用 --yes）
  if (!options.yes) {
    if (isInteractiveEnvironment()) {
      // 交互模式：显示确认提示
      console.log(chalk.yellow(`\n⚠️  即将删除分类: ${categoryId}\n`));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: '确定要删除此分类吗？',
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

  const spinner = output.spinner('正在删除分类...');

  try {
    await commerceApi.categories.delete(categoryId);
    spinner.succeed('分类删除成功！');

    if (output.isJson()) {
      output.success({
        category_id: categoryId,
        deleted: true
      });
    } else {
      console.log();
    }
  } catch (error: any) {
    spinner.fail('分类删除失败');
    throw createApiError(error);
  }
}
