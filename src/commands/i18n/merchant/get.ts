import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

export const getMerchantTranslationCommand = new Command('get')
  .description('查看商户翻译详情')
  .option('--lang <code>', '语言代码（如 zh-CN, en, es）')
  .action(async (options: { lang?: string }) => {
    try {
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      const languageCode = options.lang;

      const spinner = ora('正在获取翻译详情...').start();
      const translation = await commerceApi.i18n.merchantTranslations.get(languageCode);
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
