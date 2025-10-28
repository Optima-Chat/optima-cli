import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';
import { output } from '../../../utils/output.js';

import { addEnhancedHelp } from '../../../utils/helpText.js';

const cmd = new Command('delete')
  .description('Delete product translation permanently')
  .option('--product-id <id>', 'Product ID (required)')
  .option('--lang <code>', `Language code (required, supported: ${SUPPORTED_LANGUAGES.join(', ')})`)
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: { productId?: string; lang?: string; yes?: boolean }) => {
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

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定要删除商品 ${productId} 的 ${languageCode} 翻译吗？`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('已取消删除'));
          return;
        }
      }

      const spinner = output.spinner('正在删除翻译...');
      await commerceApi.i18n.productTranslations.delete(productId, languageCode);
      spinner.succeed(`翻译 ${languageCode} 已删除`);

      if (output.isJson()) {
        output.success({
          product_id: productId,
          language_code: languageCode,
          deleted: true
        });
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '$ optima i18n product delete --product-id prod-123 --lang zh-CN',
    '$ optima i18n product delete --product-id prod-123 --lang zh-CN --yes',
  ],
  relatedCommands: [
    { command: 'i18n product list', description: 'View all translations' },
    { command: 'i18n product create', description: 'Create translation again' },
  ],
  notes: ['Product ID and language code are required', 'Requires confirmation unless --yes flag is used']
});

export const deleteProductTranslationCommand = cmd;
