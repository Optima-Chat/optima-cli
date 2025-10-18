import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';

interface UpdateCategoryOptions {
  name?: string;
  description?: string;
  parent?: string;
}

export const updateCategoryCommand = new Command('update')
  .description('更新分类')
  .argument('<category-id>', '分类 ID')
  .option('-n, --name <name>', '分类名称')
  .option('-d, --description <description>', '分类描述')
  .option('-p, --parent <parent-id>', '父分类 ID')
  .action(async (categoryId: string, options: UpdateCategoryOptions) => {
    try {
      await updateCategory(categoryId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateCategory(categoryId: string, options: UpdateCategoryOptions) {
  // 验证参数
  if (!categoryId || categoryId.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'category-id');
  }

  // 构建更新数据
  const updateData: any = {};

  if (options.name) {
    updateData.name = options.name;
  }

  if (options.description !== undefined) {
    updateData.description = options.description;
  }

  if (options.parent !== undefined) {
    updateData.parent_id = options.parent;
  }

  // 检查是否有更新内容
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('请至少提供一个要更新的字段', 'options');
  }

  const spinner = ora('正在更新分类...').start();

  try {
    const category = await commerceApi.categories.update(categoryId, updateData);
    spinner.succeed('分类更新成功！');

    // 显示分类详情
    console.log();
    console.log(formatCategory(category));
  } catch (error: any) {
    spinner.fail('分类更新失败');
    throw createApiError(error);
  }
}
