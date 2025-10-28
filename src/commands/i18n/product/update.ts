import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';
import { output } from '../../../utils/output.js';

interface UpdateOptions {
  productId?: string;
  lang?: string;
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

import { addEnhancedHelp } from '../../../utils/helpText.js';

const cmd = new Command('update')
  .description('Update existing product translation')
  .option('--product-id <id>', 'Product ID (required)')
  .option('--lang <code>', `Language code (required, supported: ${SUPPORTED_LANGUAGES.join(', ')})`)
  .option('-n, --name <name>', 'Updated translated name')
  .option('-d, --description <description>', 'Updated translated description')
  .option('--meta-title <title>', 'Updated SEO title')
  .option('--meta-description <description>', 'Updated SEO description')
  .action(async (options: UpdateOptions) => {
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

      const { name, description, metaTitle, metaDescription } = options;

      if (!name && !description && !metaTitle && !metaDescription) {
        throw new ValidationError('至少需要提供一个更新字段', 'fields');
      }

      const data: any = {};
      if (name) data.name = name;
      if (description) data.description = description;
      if (metaTitle) data.meta_title = metaTitle;
      if (metaDescription) data.meta_description = metaDescription;

      const spinner = output.spinner('正在更新翻译...');
      const translation = await commerceApi.i18n.productTranslations.update(productId, languageCode, data);
      spinner.succeed('翻译更新成功！');

      if (output.isJson()) {
        output.success({
          product_id: productId,
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

addEnhancedHelp(cmd, {
  examples: ['$ optima i18n product update --product-id prod-123 --lang zh-CN --name "新名称"'],
  relatedCommands: [
    { command: 'i18n product get', description: 'View current translation' },
    { command: 'i18n product list', description: 'View all translations' },
  ],
  notes: ['Product ID, language code, and at least one field to update are required']
});

export const updateProductTranslationCommand = cmd;
