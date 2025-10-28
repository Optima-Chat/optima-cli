import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';
import { output } from '../../../utils/output.js';

import { addEnhancedHelp } from '../../../utils/helpText.js';

const cmd = new Command('get')
  .description('Get specific translation details for a product')
  .option('--product-id <id>', 'Product ID (required)')
  .option('--lang <code>', `Language code (required, supported: ${SUPPORTED_LANGUAGES.join(', ')})`)
  .action(async (options: { productId?: string; lang?: string }) => {
    try {
      if (!options.productId || options.productId.trim().length === 0) {
        throw new ValidationError('商品 ID 不能为空', 'product-id');
      }
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      // Validate language code format
      validateLanguageCode(options.lang);

      const productId = options.productId;
      const languageCode = options.lang;

      const spinner = output.spinner('正在获取翻译详情...');
      const translation = await commerceApi.i18n.productTranslations.get(productId, languageCode);
      spinner.succeed('翻译详情获取成功');

      if (output.isJson()) {
        output.success({
          product_id: productId,
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
        if (translation.meta_title) {
          console.log(chalk.gray('SEO 标题: ') + chalk.white(translation.meta_title));
        }
        if (translation.meta_description) {
          console.log(chalk.gray('SEO 描述: ') + chalk.white(translation.meta_description));
        }
        if (translation.customs_description) {
          console.log(chalk.gray('海关描述: ') + chalk.white(translation.customs_description));
        }
        if (translation.variant_attributes_translations) {
          console.log(chalk.gray('变体属性翻译: ') + chalk.white(JSON.stringify(translation.variant_attributes_translations, null, 2)));
        }
        console.log();
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: ['$ optima i18n product get --product-id prod-123 --lang zh-CN'],
  relatedCommands: [
    { command: 'i18n product list', description: 'View all translations' },
    { command: 'i18n product update', description: 'Update translation' },
  ],
  notes: ['Product ID and language code are required']
});

export const getProductTranslationCommand = cmd;
