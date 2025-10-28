import { addEnhancedHelp } from '../../../utils/helpText.js';
import { Command } from 'commander';

import chalk from 'chalk';
import { output } from '../../../utils/output.js';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

const cmd = new Command('get')
  .description('查看分类翻译详情')
  .option('--category-id <id>', '分类 ID')
  .option('--lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .action(async (options: { categoryId?: string; lang?: string }) => {
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

      const spinner = output.spinner('正在获取翻译详情...');
      const translation = await commerceApi.i18n.categoryTranslations.get(categoryId, languageCode);
      spinner.succeed('翻译详情获取成功');

      if (output.isJson()) {
        output.success({
          category_id: categoryId,
          language_code: languageCode,
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
addEnhancedHelp(cmd, {
  examples: ['$ optima i18n category get --category-id id-123 --lang zh-CN'],
  relatedCommands: [
    { command: 'i18n category list', description: 'View all translations' },
    { command: 'i18n category update', description: 'Update translation' },
  ],
  notes: ['Category ID and language code are required']
});

export const getCategoryTranslationCommand = cmd;
