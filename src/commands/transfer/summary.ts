import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';

export const summaryCommand = new Command('summary')
  .description('财务汇总')
  .action(async () => {
    try {
      const spinner = ora('正在获取财务汇总...').start();
      const summary = await commerceApi.transfers.summary();
      spinner.succeed('财务汇总获取成功');

      console.log('\n' + '─'.repeat(60));
      console.log(chalk.bold('财务汇总'));
      console.log('─'.repeat(60));
      console.log(chalk.gray('可用余额: ') + chalk.green(`${summary.currency} ${summary.available_balance || 0}`));
      console.log(chalk.gray('待结算: ') + chalk.yellow(`${summary.currency} ${summary.pending_balance || 0}`));
      console.log(chalk.gray('总收入: ') + chalk.cyan(`${summary.currency} ${summary.total_revenue || 0}`));
      console.log('─'.repeat(60) + '\n');
    } catch (error) {
      handleError(error);
    }
  });
