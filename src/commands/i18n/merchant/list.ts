import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError } from '../../../utils/error.js';

export const listMerchantTranslationsCommand = new Command('list')
  .description('查看商户翻译列表')
  .action(async () => {
    try {
      const spinner = ora('正在获取商户翻译...').start();
      const translations = await commerceApi.i18n.merchantTranslations.list();
      spinner.succeed('商户翻译获取成功');

      if (translations.length === 0) {
        console.log(chalk.yellow('\n商户暂无翻译\n'));
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
