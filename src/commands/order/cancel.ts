import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment } from '../../utils/interactive.js';

interface CancelOrderOptions {
  id?: string;
  reason?: string;
  yes?: boolean;
}

const cmd = new Command('cancel')
  .description('Cancel an order')
  .option('--id <uuid>', 'Order ID (required)')
  .option('-r, --reason <string>', 'Cancellation reason (optional)')
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: CancelOrderOptions) => {
    try {
      await cancelOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Cancel order with confirmation',
    '$ optima order cancel --id order-123',
    '',
    '# Cancel with reason',
    '$ optima order cancel \\',
    '  --id order-123 \\',
    '  --reason "Customer requested cancellation"',
    '',
    '# Cancel without confirmation (non-interactive)',
    '$ optima order cancel --id order-123 --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order_id: 'uuid',
        status: 'cancelled',
        reason: 'Customer requested cancellation'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order list', description: 'Find order IDs' },
    { command: 'order get', description: 'View order before canceling' },
    { command: 'refund create', description: 'Refund cancelled orders' },
  ],
  notes: [
    'Order ID is required',
    'Requires confirmation unless --yes flag is used',
    'Reason is optional but recommended',
    'Use --yes for non-interactive/automated operations',
  ]
});

export const cancelOrderCommand = cmd;

async function cancelOrder(options: CancelOrderOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  let reason = options.reason;

  // 如果没有提供原因，询问
  if (!reason && !options.yes) {
    if (isInteractiveEnvironment()) {
      // 交互模式：询问原因并确认
      console.log(chalk.yellow(`\n⚠️  即将取消订单: ${orderId}\n`));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'reason',
          message: '取消原因 (可选):',
          default: '',
        },
        {
          type: 'confirm',
          name: 'confirmed',
          message: '确定要取消此订单吗？',
          default: false,
        },
      ]);

      if (!answers.confirmed) {
        console.log(chalk.gray('\n已取消操作\n'));
        return;
      }

      reason = answers.reason || undefined;
    } else {
      // 非交互模式：要求使用 --yes 标志
      throw new ValidationError(
        '非交互环境需要使用 --yes 标志确认取消操作',
        'yes'
      );
    }
  } else if (!options.yes) {
    // 有原因但需要确认
    if (isInteractiveEnvironment()) {
      // 交互模式：显示原因并确认
      console.log(chalk.yellow(`\n⚠️  即将取消订单: ${orderId}`));
      console.log(chalk.gray(`原因: ${reason || '无'}\n`));

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: '确定要取消此订单吗？',
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
        '非交互环境需要使用 --yes 标志确认取消操作',
        'yes'
      );
    }
  }

  const spinner = output.spinner('正在取消订单...');

  try {
    await commerceApi.orders.cancel(orderId, reason);
    spinner.succeed('订单已取消！');

    if (output.isJson()) {
      output.success({
        order_id: orderId,
        status: 'cancelled',
        reason: reason
      });
    } else {
      if (reason) {
        console.log(chalk.gray('\n取消原因: ') + reason);
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail('订单取消失败');
    throw createApiError(error);
  }
}
