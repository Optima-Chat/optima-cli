import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('get')
  .description('Get category details by ID')
  .option('--id <id>', 'Category ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await getCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get category details',
    '$ optima category get --id cat-123',
  ],
  output: {
    description: 'Returns full category details',
    example: JSON.stringify({
      success: true,
      data: {
        category: {
          id: 'uuid',
          name: 'Electronics',
          description: 'Electronic devices',
          parent_id: null,
          created_at: '2025-01-01T00:00:00Z'
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'category list', description: 'Find category IDs' },
    { command: 'category update', description: 'Update category details' },
    { command: 'i18n category list', description: 'View translations' },
  ],
  notes: [
    'Category ID is required',
    'Use --json for structured output',
  ]
});

export const getCategoryCommand = cmd;

async function getCategory(options: { id?: string }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'id');
  }

  const categoryId = options.id;

  const spinner = output.spinner('正在获取分类详情...');

  try {
    const category = await commerceApi.categories.get(categoryId);
    spinner.succeed('分类详情获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({ category });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(formatCategory(category));
    }
  } catch (error: any) {
    spinner.fail('获取分类详情失败');
    throw createApiError(error);
  }
}
