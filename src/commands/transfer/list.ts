import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('list')
  .description('List all payment transfers and payouts')
  .action(async () => {
    try {
      const spinner = output.spinner('正在获取转账记录...');
      const transfers = await commerceApi.transfers.list();
      spinner.succeed('转账记录获取成功');

      if (transfers.length === 0) {
        if (output.isJson()) {
          output.success({
            transfers: [],
            total: 0
          }, '暂无转账记录');
        } else {
          console.log(chalk.yellow('\n暂无转账记录\n'));
        }
        return;
      }

      if (output.isJson()) {
        // JSON 模式：输出结构化数据
        output.success({
          transfers,
          total: transfers.length
        });
      } else {
        // Pretty 模式：保持原有表格输出
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
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List all transfers',
    '$ optima transfer list',
    '',
    '# Get transfers in JSON format',
    '$ optima transfer list --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        transfers: [
          {
            id: 'uuid',
            amount: '1000.00',
            currency: 'USD',
            status: 'paid',
            created_at: 'timestamp'
          }
        ],
        total: 1
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'transfer summary', description: 'View financial summary' },
    { command: 'order list', description: 'View orders generating revenue' },
  ],
  notes: [
    'Shows all payment transfers to merchant account',
    'Transfers are created when orders are paid',
    'Status shows payment state (paid, pending, etc.)',
  ]
});

export const listTransfersCommand = cmd;
