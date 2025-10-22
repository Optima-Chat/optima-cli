import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

export const deleteMerchantTranslationCommand = new Command('delete')
  .description('删除商户翻译')
  .option('--lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-y, --yes', '跳过确认')
  .action(async (options: { lang?: string; yes?: boolean }) => {
    try {
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      validateLanguageCode(options.lang);

      const languageCode = options.lang;

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `确定要删除商户的 ${languageCode} 翻译吗？`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('已取消删除'));
          return;
        }
      }

      const spinner = ora('正在删除翻译...').start();
      await commerceApi.i18n.merchantTranslations.delete(languageCode);
      spinner.succeed(`翻译 ${languageCode} 已删除`);
    } catch (error) {
      handleError(error);
    }
  });
