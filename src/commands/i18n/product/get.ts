import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

export const getProductTranslationCommand = new Command('get')
  .description('查看商品翻译详情')
  .option('--product-id <id>', '商品 ID')
  .option('--lang <code>', '语言代码（如 zh-CN, en, es）')
  .action(async (options: { productId?: string; lang?: string }) => {
    try {
      if (!options.productId || options.productId.trim().length === 0) {
        throw new ValidationError('商品 ID 不能为空', 'product-id');
      }
      if (!options.lang || options.lang.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'lang');
      }

      const productId = options.productId;
      const languageCode = options.lang;

      const spinner = ora('正在获取翻译详情...').start();
      const translation = await commerceApi.i18n.productTranslations.get(productId, languageCode);
      spinner.succeed('翻译详情获取成功');

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
    } catch (error) {
      handleError(error);
    }
  });
