import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';

export const listProductTranslationsCommand = new Command('list')
  .description('查看商品翻译列表')
  .option('--product-id <id>', '商品 ID')
  .action(async (options: { productId?: string }) => {
    try {
      if (!options.productId || options.productId.trim().length === 0) {
        throw new ValidationError('商品 ID 不能为空', 'product-id');
      }

      const productId = options.productId;

      const spinner = ora('正在获取商品翻译...').start();
      const translations = await commerceApi.i18n.productTranslations.list(productId);
      spinner.succeed('商品翻译获取成功');

      if (translations.length === 0) {
        console.log(chalk.yellow('\n该商品暂无翻译\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('语言代码'), chalk.cyan('名称'), chalk.cyan('描述预览')],
        colWidths: [12, 30, 50],
      });

      translations.forEach((trans: any) => {
        const descPreview = trans.description
          ? trans.description.substring(0, 47) + (trans.description.length > 47 ? '...' : '')
          : '-';

        table.push([
          trans.language_code,
          trans.name || '-',
          descPreview,
        ]);
      });

      console.log('\n' + table.toString());
      console.log(chalk.gray(`\n共 ${translations.length} 个翻译\n`));
    } catch (error) {
      handleError(error);
    }
  });
