import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

export const deleteCategoryTranslationCommand = new Command('delete')
  .description('删除分类翻译')
  .option('--category-id <id>', '分类 ID')
  .option('--lang <code>', '语言代码（如 zh-CN, en, es）')
  .option('-y, --yes', '跳过确认')
  .action(async (options: { categoryId?: string; lang?: string; yes?: boolean }) => {
    try {
      if (!options.categoryId || options.categoryId.trim().length === 0) {
        throw new ValidationError('分类 ID 不能为空', 'category-id');
      }
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      const categoryId = options.categoryId;
      const languageCode = options.lang;

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定要删除分类 ${categoryId} 的 ${languageCode} 翻译吗？`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('已取消删除'));
          return;
        }
      }

      const spinner = ora('正在删除翻译...').start();
      await commerceApi.i18n.categoryTranslations.delete(categoryId, languageCode);
      spinner.succeed(`翻译 ${languageCode} 已删除`);
    } catch (error) {
      handleError(error);
    }
  });
