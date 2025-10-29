import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment } from '../../utils/interactive.js';

interface CompleteOrderOptions {
  id?: string;
  yes?: boolean;
}

const cmd = new Command('complete')
  .description('Mark order as complete/fulfilled')
  .option('--id <uuid>', 'Order ID (required)')
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: CompleteOrderOptions) => {
    try {
      await completeOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Complete order with confirmation',
    '$ optima order complete --id order-123',
    '',
    '# Complete without confirmation (non-interactive)',
    '$ optima order complete --id order-123 --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order_id: 'uuid',
        status: 'completed'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order ship', description: 'Ship order first' },
    { command: 'order mark-delivered', description: 'Mark as delivered' },
    { command: 'order list', description: 'Find order IDs' },
  ],
  notes: [
    'Order ID is required',
    'Requires confirmation unless --yes flag is used',
    'Order should be shipped/delivered before completing',
    'Use --yes for non-interactive/automated operations',
  ]
});

export const completeOrderCommand = cmd;

async function completeOrder(options: CompleteOrderOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  // 确认完成（除非使用 --yes）
  if (!options.yes) {
    if (isInteractiveEnvironment()) {
      // 交互模式：显示确认提示
      console.log(chalk.yellow(`\n⚠️  即将完成订单: ${orderId}\n`));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: '确定要完成此订单吗？',
          default: false,
        },
      ]);

      if (!answers.confirmed) {
        console.log(chalk.gray('\n已取消操作\n'));
        return;
      }
    } else {
      // 非交互模式：要求使用 --yes 标志
      throw new ValidationError(
        '非交互环境需要使用 --yes 标志确认完成操作',
        'yes'
      );
    }
  }

  const spinner = output.spinner('正在完成订单...');

  try {
    await commerceApi.orders.complete(orderId);
    spinner.succeed('订单已完成！');

    if (output.isJson()) {
      output.success({
        order_id: orderId,
        status: 'completed'
      });
    } else {
      console.log();
    }
  } catch (error: any) {
    spinner.fail('订单完成失败');
    throw createApiError(error);
  }
}
