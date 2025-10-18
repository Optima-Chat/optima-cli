import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface CompleteOrderOptions {
  yes?: boolean;
}

export const completeOrderCommand = new Command('complete')
  .description('完成订单')
  .argument('<order-id>', '订单 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (orderId: string, options: CompleteOrderOptions) => {
    try {
      await completeOrder(orderId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function completeOrder(orderId: string, options: CompleteOrderOptions) {
  // 验证参数
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  // 确认完成（除非使用 --yes）
  if (!options.yes) {
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
  }

  const spinner = ora('正在完成订单...').start();

  try {
    await commerceApi.orders.complete(orderId);
    spinner.succeed('订单已完成！');
    console.log();
  } catch (error: any) {
    spinner.fail('订单完成失败');
    throw createApiError(error);
  }
}
