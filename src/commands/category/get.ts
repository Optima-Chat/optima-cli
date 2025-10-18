import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';

export const getCategoryCommand = new Command('get')
  .description('分类详情')
  .argument('<category-id>', '分类 ID')
  .action(async (categoryId: string) => {
    try {
      await getCategory(categoryId);
    } catch (error) {
      handleError(error);
    }
  });

async function getCategory(categoryId: string) {
  // 验证参数
  if (!categoryId || categoryId.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'category-id');
  }

  const spinner = ora('正在获取分类详情...').start();

  try {
    const category = await commerceApi.categories.get(categoryId);
    spinner.stop();

    // 显示分类详情
    console.log();
    console.log(formatCategory(category));
  } catch (error: any) {
    spinner.fail('获取分类详情失败');
    throw createApiError(error);
  }
}
