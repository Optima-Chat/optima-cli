import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatCategoryList } from '../../utils/format.js';
import { output } from '../../utils/output.js';

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
  const spinner = output.spinner('正在获取分类列表...');

  try {
    const categories = await commerceApi.categories.list();
    spinner.succeed('分类列表获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        categories,
        total: categories.length
      });
    } else {
      // Pretty 模式：保持原有表格输出
      console.log();
      console.log(formatCategoryList(categories));
    }
  } catch (error: any) {
    spinner.fail('获取分类列表失败');
    throw createApiError(error);
  }
}
