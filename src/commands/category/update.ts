import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface UpdateCategoryOptions {
  id?: string;
  name?: string;
  description?: string;
  parent?: string;
}

export const updateCategoryCommand = new Command('update')
  .description('更新分类')
  .option('--id <id>', '分类 ID')
  .option('-n, --name <name>', '分类名称')
  .option('-d, --description <description>', '分类描述')
  .option('-p, --parent <parent-id>', '父分类 ID')
  .action(async (options: UpdateCategoryOptions) => {
    try {
      await updateCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateCategory(options: UpdateCategoryOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'id');
  }

  const categoryId = options.id;

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

  const spinner = output.spinner('正在更新分类...');

  try {
    const category = await commerceApi.categories.update(categoryId, updateData);
    spinner.succeed('分类更新成功！');

    if (output.isJson()) {
      output.success({
        category_id: category.id || category.category_id,
        updated_fields: Object.keys(updateData),
        category: category
      });
    } else {
      // 显示分类详情
      console.log();
      console.log(formatCategory(category));
    }
  } catch (error: any) {
    spinner.fail('分类更新失败');
    throw createApiError(error);
  }
}
