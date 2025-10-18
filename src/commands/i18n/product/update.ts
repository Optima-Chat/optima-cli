import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

interface UpdateOptions {
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const updateProductTranslationCommand = new Command('update')
  .description('更新商品翻译')
  .argument('<product-id>', '商品 ID')
  .argument('<language-code>', '语言代码（如 zh-CN, en, es）')
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .option('--meta-title <title>', 'SEO 标题')
  .option('--meta-description <description>', 'SEO 描述')
  .action(async (productId: string, languageCode: string, options: UpdateOptions) => {
    try {
      if (!productId || productId.trim().length === 0) {
        throw new ValidationError('商品 ID 不能为空', 'product-id');
      }
      if (!languageCode || languageCode.trim().length === 0) {
        throw new ValidationError('语言代码不能为空', 'language-code');
      }

      const { name, description, metaTitle, metaDescription } = options;

      if (!name && !description && !metaTitle && !metaDescription) {
        throw new ValidationError('至少需要提供一个更新字段', 'fields');
      }

      const data: any = {};
      if (name) data.name = name;
      if (description) data.description = description;
      if (metaTitle) data.meta_title = metaTitle;
      if (metaDescription) data.meta_description = metaDescription;

      const spinner = ora('正在更新翻译...').start();
      const translation = await commerceApi.i18n.productTranslations.update(productId, languageCode, data);
      spinner.succeed('翻译更新成功！');

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
