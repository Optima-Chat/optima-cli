import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatCategoryList } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('list')
  .description('List all product categories (hierarchical tree structure)')
  .action(async () => {
    try {
      await listCategories();
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List all categories',
    '$ optima category list',
    '',
    '# Get categories in JSON format',
    '$ optima category list --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        categories: [
          {
            category_id: 'uuid',
            name: 'Electronics',
            description: 'Electronic devices',
            parent_id: null,
            children: [
              { category_id: 'uuid-2', name: 'Smartphones', parent_id: 'uuid' }
            ]
          }
        ],
        total: 2
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'category create', description: 'Create new category' },
    { command: 'product list', description: 'Filter products by category' },
  ],
  notes: [
    'Returns hierarchical tree with parent-child relationships',
    'Use category IDs when creating products or subcategories',
  ]
});

export const listCategoriesCommand = cmd;

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
