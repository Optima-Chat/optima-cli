import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

interface UpdateOptions {
  name?: string;
  description?: string;
}

export const updateCategoryTranslationCommand = new Command('update')
  .description('更新分类翻译')
  .argument('<category-id>', '分类 ID')
  .argument('<language-code>', '语言代码（如 zh-CN, en, es）')
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .action(async (categoryId: string, languageCode: string, options: UpdateOptions) => {
    try {
      if (!categoryId || categoryId.trim().length === 0) {
        throw new ValidationError('分类 ID 不能为空', 'category-id');
      }
      if (!languageCode || languageCode.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'language-code');
      }

      const { name, description } = options;

      if (!name && !description) {
        throw new ValidationError('至少需要提供一个更新字段', 'fields');
      }

      const data: any = {};
      if (name) data.name = name;
      if (description) data.description = description;

      const spinner = ora('正在更新翻译...').start();
      const translation = await commerceApi.i18n.categoryTranslations.update(categoryId, languageCode, data);
      spinner.succeed('翻译更新成功！');

      console.log();
      console.log(chalk.gray('语言代码: ') + chalk.cyan(translation.language_code));
      console.log(chalk.gray('名称: ') + chalk.white(translation.name));
      if (translation.description) {
        console.log(chalk.gray('描述: ') + chalk.white(translation.description));
      }
      console.log();
    } catch (error) {
      handleError(error);
    }
  });
