import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

export const getCategoryTranslationCommand = new Command('get')
  .description('查看分类翻译详情')
  .option('--category-id <id>', '分类 ID')
  .option('--lang <code>', '语言代码（如 zh-CN, en, es）')
  .action(async (options: { categoryId?: string; lang?: string }) => {
    try {
      if (!options.categoryId || options.categoryId.trim().length === 0) {
        throw new ValidationError('分类 ID 不能为空', 'category-id');
      }
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      const categoryId = options.categoryId;
      const languageCode = options.lang;

      const spinner = ora('正在获取翻译详情...').start();
      const translation = await commerceApi.i18n.categoryTranslations.get(categoryId, languageCode);
      spinner.succeed('翻译详情获取成功');

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
