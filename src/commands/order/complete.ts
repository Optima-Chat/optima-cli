import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface CompleteOrderOptions {
  id?: string;
  yes?: boolean;
}

export const completeOrderCommand = new Command('complete')
  .description('完成订单')
  .option('--id <id>', '订单 ID')
  .option('-y, --yes', '跳过确认提示')
  .action(async (options: CompleteOrderOptions) => {
    try {
      await completeOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

async function completeOrder(options: CompleteOrderOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

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
