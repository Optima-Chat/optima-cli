import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface CancelOrderOptions {
  reason?: string;
  yes?: boolean;
}

export const cancelOrderCommand = new Command('cancel')
  .description('取消订单')
  .argument('<order-id>', '订单 ID')
  .option('-r, --reason <reason>', '取消原因')
  .option('-y, --yes', '跳过确认提示')
  .action(async (orderId: string, options: CancelOrderOptions) => {
    try {
      await cancelOrder(orderId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function cancelOrder(orderId: string, options: CancelOrderOptions) {
  // 验证参数
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  let reason = options.reason;

  // 如果没有提供原因，询问
  if (!reason && !options.yes) {
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
  } else if (!options.yes) {
    // 有原因但需要确认
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
  }

  const spinner = ora('正在取消订单...').start();

  try {
    await commerceApi.orders.cancel(orderId, reason);
    spinner.succeed('订单已取消！');

    if (reason) {
      console.log(chalk.gray('\n取消原因: ') + reason);
    }

    console.log();
  } catch (error: any) {
    spinner.fail('订单取消失败');
    throw createApiError(error);
  }
}
