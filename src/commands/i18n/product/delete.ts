import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

export const deleteProductTranslationCommand = new Command('delete')
  .description('删除商品翻译')
  .option('--product-id <id>', '商品 ID')
  .option('--lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-y, --yes', '跳过确认')
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

      const spinner = ora('正在删除翻译...').start();
      await commerceApi.i18n.productTranslations.delete(productId, languageCode);
      spinner.succeed(`翻译 ${languageCode} 已删除`);
    } catch (error) {
      handleError(error);
    }
  });
