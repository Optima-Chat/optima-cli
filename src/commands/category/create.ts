import { Command } from 'commander';
import inquirer from 'inquirer';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment, requireParam } from '../../utils/interactive.js';

interface CreateCategoryOptions {
  name?: string;
  description?: string;
  parent?: string;
}

const cmd = new Command('create')
  .description('Create a new product category (top-level or nested)')
  .option('-n, --name <string>', 'Category name (required)')
  .option('-d, --description <string>', 'Category description')
  .option('-p, --parent <uuid>', 'Parent category ID (for creating subcategory)')
  .action(async (options: CreateCategoryOptions) => {
    try {
      await createCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create a top-level category',
    '$ optima category create --name "Electronics"',
    '',
    '# Create with description',
    '$ optima category create \\',
    '  --name "Home & Garden" \\',
    '  --description "Everything for your home"',
    '',
    '# Create subcategory',
    '$ optima category list  # Get parent category ID',
    '$ optima category create \\',
    '  --name "Smartphones" \\',
    '  --parent abc-123-def',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        category_id: 'uuid',
        name: 'Electronics',
        description: 'Category description',
        parent_id: null,
        created_at: 'timestamp'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'category list', description: 'View all categories' },
    { command: 'product create', description: 'Create product with category' },
  ],
  notes: [
    'Name is required (interactive prompt if not provided)',
    'Use --parent to create nested categories (subcategories)',
    'Categories can be used to organize products',
  ]
});

export const createCategoryCommand = cmd;

async function createCategory(options: CreateCategoryOptions) {
  let name: string;
  let description: string | undefined;
  let parent: string | undefined;

  // 检测环境
  if (isInteractiveEnvironment()) {
    // 交互模式：友好提示
    if (!options.name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '分类名称:',
          validate: (input) => (input.trim().length > 0 ? true : '分类名称不能为空'),
        },
        {
          type: 'input',
          name: 'description',
          message: '分类描述（可选）:',
          default: '',
        },
        {
          type: 'input',
          name: 'parent',
          message: '父分类 ID（可选，留空则为顶级分类）:',
          default: '',
        },
      ]);

      name = answers.name.trim();
      description = answers.description || undefined;
      parent = answers.parent || undefined;
    } else {
      // 交互环境但参数完整
      name = options.name.trim();
      description = options.description;
      parent = options.parent;

      // 验证 name
      if (name.length === 0) {
        throw new ValidationError('分类名称不能为空', 'name');
      }
    }
  } else {
    // 非交互模式：直接验证参数
    name = requireParam(options.name, 'name', '分类名称').trim();
    description = options.description;
    parent = options.parent;
  }

  const spinner = output.spinner('正在创建分类...');

  try {
    const categoryData: any = {
      name: name.trim(),
    };

    if (description && description.trim().length > 0) {
      categoryData.description = description.trim();
    }

    if (parent && parent.trim().length > 0) {
      categoryData.parent_id = parent.trim();
    }

    const category = await commerceApi.categories.create(categoryData);
    spinner.succeed('分类创建成功！');

    if (output.isJson()) {
      output.success({
        category_id: category.id || category.category_id,
        name: category.name,
        description: category.description,
        parent_id: category.parent_id
      });
    } else {
      // 显示分类详情
      console.log();
      console.log(formatCategory(category));
    }
  } catch (error: any) {
    spinner.fail('分类创建失败');
    throw createApiError(error);
  }
}
