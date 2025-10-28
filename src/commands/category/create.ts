import { Command } from 'commander';
import inquirer from 'inquirer';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatCategory } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface CreateCategoryOptions {
  name?: string;
  description?: string;
  parent?: string;
}

export const createCategoryCommand = new Command('create')
  .description('创建分类')
  .option('-n, --name <name>', '分类名称')
  .option('-d, --description <description>', '分类描述')
  .option('-p, --parent <parent-id>', '父分类 ID（创建子分类）')
  .action(async (options: CreateCategoryOptions) => {
    try {
      await createCategory(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createCategory(options: CreateCategoryOptions) {
  let { name, description, parent } = options;

  // 交互式输入缺失的必填字段
  if (!name) {
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

    name = answers.name;
    description = answers.description || undefined;
    parent = answers.parent || undefined;
  }

  // 验证必填字段
  if (!name || name.trim().length === 0) {
    throw new ValidationError('分类名称不能为空', 'name');
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
