import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';

export const listTransfersCommand = new Command('list')
  .description('转账列表')
  .action(async () => {
    try {
      const spinner = ora('正在获取转账记录...').start();
      const transfers = await commerceApi.transfers.list();
      spinner.succeed('转账记录获取成功');

      if (transfers.length === 0) {
        console.log(chalk.yellow('\n暂无转账记录\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('金额'), chalk.cyan('状态'), chalk.cyan('时间')],
        colWidths: [38, 20, 15, 20],
      });

      transfers.forEach((transfer: any) => {
        const amount = `${transfer.currency} ${transfer.amount}`;
        const status = transfer.status === 'paid' ? chalk.green('已支付') : chalk.yellow(transfer.status);
        const date = formatDate(transfer.created_at);

        table.push([transfer.id, amount, status, date]);
      });

      console.log('\n' + table.toString() + '\n');
    } catch (error) {
      handleError(error);
    }
  });
