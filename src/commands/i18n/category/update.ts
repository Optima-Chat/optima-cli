import { Command } from 'commander';

import chalk from 'chalk';
import { output } from '../../../utils/output.js';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

interface UpdateOptions {
  categoryId?: string;
  lang?: string;
  name?: string;
  description?: string;
}

export const updateCategoryTranslationCommand = new Command('update')
  .description('更新分类翻译')
  .option('--category-id <id>', '分类 ID')
  .option('--lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .action(async (options: UpdateOptions) => {
    try {
      if (!options.categoryId || options.categoryId.trim().length === 0) {
        throw new ValidationError('分类 ID 不能为空', 'category-id');
      }
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      validateLanguageCode(options.lang);

      const categoryId = options.categoryId;
      const languageCode = options.lang;

      const { name, description } = options;

      if (!name && !description) {
        throw new ValidationError('至少需要提供一个更新字段', 'fields');
      }

      const data: any = {};
      if (name) data.name = name;
      if (description) data.description = description;

      const spinner = output.spinner('正在更新翻译...');
      const translation = await commerceApi.i18n.categoryTranslations.update(categoryId, languageCode, data);
      spinner.succeed('翻译更新成功！');

      if (output.isJson()) {
        output.success({
          category_id: categoryId,
          language_code: languageCode,
          updated_fields: Object.keys(data),
          translation: translation
        });
      } else {
        console.log();
        console.log(chalk.gray('语言代码: ') + chalk.cyan(translation.language_code));
        console.log(chalk.gray('名称: ') + chalk.white(translation.name));
        if (translation.description) {
          console.log(chalk.gray('描述: ') + chalk.white(translation.description));
        }
        console.log();
      }
    } catch (error) {
      handleError(error);
    }
  });
