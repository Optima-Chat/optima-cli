import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('summary')
  .description('View financial summary (balance, pending, revenue)')
  .action(async () => {
    try {
      const spinner = output.spinner('正在获取财务汇总...');
      const summary = await commerceApi.transfers.summary();
      spinner.succeed('财务汇总获取成功');

      if (output.isJson()) {
        // JSON 模式：输出结构化数据
        output.success({
          currency: summary.currency,
          available_balance: summary.available_balance || 0,
          pending_balance: summary.pending_balance || 0,
          total_revenue: summary.total_revenue || 0
        });
      } else {
        // Pretty 模式：保持原有格式化输出
        console.log('\n' + '─'.repeat(60));
        console.log(chalk.bold('财务汇总'));
        console.log('─'.repeat(60));
        console.log(chalk.gray('可用余额: ') + chalk.green(`${summary.currency} ${summary.available_balance || 0}`));
        console.log(chalk.gray('待结算: ') + chalk.yellow(`${summary.currency} ${summary.pending_balance || 0}`));
        console.log(chalk.gray('总收入: ') + chalk.cyan(`${summary.currency} ${summary.total_revenue || 0}`));
        console.log('─'.repeat(60) + '\n');
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# View financial summary',
    '$ optima transfer summary',
    '',
    '# Get summary in JSON format',
    '$ optima transfer summary --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        currency: 'USD',
        available_balance: 5000.00,
        pending_balance: 1500.00,
        total_revenue: 10000.00
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'transfer list', description: 'View individual transfers' },
    { command: 'order list', description: 'View revenue-generating orders' },
  ],
  notes: [
    'available_balance: Funds ready for withdrawal',
    'pending_balance: Funds being processed',
    'total_revenue: All-time revenue from orders',
  ]
});

export const summaryCommand = cmd;
