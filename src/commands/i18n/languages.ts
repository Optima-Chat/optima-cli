import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';

export const languagesCommand = new Command('languages')
  .description('查看支持的语言列表')
  .option('--all', '显示所有语言（包括未激活）')
  .action(async (options) => {
    try {
      const spinner = ora('正在获取语言列表...').start();
      const languages = await commerceApi.i18n.listLanguages(!options.all);
      spinner.succeed('语言列表获取成功');

      if (languages.length === 0) {
        console.log(chalk.yellow('\n暂无语言\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('代码'), chalk.cyan('名称'), chalk.cyan('本地名称'), chalk.cyan('状态')],
        colWidths: [10, 20, 20, 10],
      });

      languages.forEach((lang: any) => {
        const status = lang.is_active ? chalk.green('激活') : chalk.gray('未激活');
        table.push([
          lang.code,
          lang.english_name || '-',
          lang.native_name || '-',
          status,
        ]);
      });

      console.log('\n' + table.toString());
      console.log(chalk.gray(`\n共 ${languages.length} 种语言\n`));
    } catch (error) {
      handleError(error);
    }
  });
