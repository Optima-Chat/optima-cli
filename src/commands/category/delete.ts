import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface DeleteCategoryOptions {
  yes?: boolean;
}

export const deleteCategoryCommand = new Command('delete')
  .description('删除分类')
  .argument('<category-id>', '分类 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (categoryId: string, options: DeleteCategoryOptions) => {
    try {
      await deleteCategory(categoryId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteCategory(categoryId: string, options: DeleteCategoryOptions) {
  // 验证参数
  if (!categoryId || categoryId.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'category-id');
  }

  // 确认删除（除非使用 --yes）
  if (!options.yes) {
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
  }

  const spinner = ora('正在删除分类...').start();

  try {
    await commerceApi.categories.delete(categoryId);
    spinner.succeed('分类删除成功！');
    console.log();
  } catch (error: any) {
    spinner.fail('分类删除失败');
    throw createApiError(error);
  }
}
