import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatCategoryList } from '../../utils/format.js';

export const listCategoriesCommand = new Command('list')
  .description('分类列表')
  .action(async () => {
    try {
      await listCategories();
    } catch (error) {
      handleError(error);
    }
  });

async function listCategories() {
  const spinner = ora('正在获取分类列表...').start();

  try {
    const categories = await commerceApi.categories.list();
    spinner.stop();

    // 显示分类列表
    console.log();
    console.log(formatCategoryList(categories));
  } catch (error: any) {
    spinner.fail('获取分类列表失败');
    throw createApiError(error);
  }
}
