import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface UpdateCategoryOptions {
  id?: string;
  name?: string;
  description?: string;
  parent?: string;
}

const cmd = new Command('update')
  .description('Update category details')
  .option('--id <id>', 'Category ID (required)')
  .option('-n, --name <name>', 'Category name')
  .option('-d, --description <description>', 'Category description')
  .option('-p, --parent <parent-id>', 'Parent category ID (for subcategory)')
  .action(async (options: UpdateCategoryOptions) => {
    try {
      await updateCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Update category name',
    '$ optima category update --id cat-123 --name "Digital Electronics"',
    '',
    '# Update multiple fields',
    '$ optima category update \\',
    '  --id cat-456 \\',
    '  --name "Home Appliances" \\',
    '  --description "Kitchen and household appliances"',
    '',
    '# Make a subcategory',
    '$ optima category update --id cat-789 --parent cat-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        category_id: 'uuid',
        updated_fields: ['name', 'description'],
        category: {
          id: 'uuid',
          name: 'Digital Electronics',
          description: 'Updated description'
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'category get', description: 'View current details' },
    { command: 'category list', description: 'Find category IDs' },
    { command: 'i18n category create', description: 'Add translations' },
  ],
  notes: [
    'Category ID is required',
    'At least one field to update is required',
    'Set parent to create category hierarchy',
  ]
});

export const updateCategoryCommand = cmd;

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
