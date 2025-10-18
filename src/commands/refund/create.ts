import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface CreateRefundOptions {
  amount?: string;
  reason?: string;
}

export const createRefundCommand = new Command('create')
  .description('创建退款')
  .argument('<order-id>', '订单 ID')
  .option('-a, --amount <amount>', '退款金额')
  .option('-r, --reason <reason>', '退款原因')
  .action(async (orderId: string, options: CreateRefundOptions) => {
    try {
      await createRefund(orderId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function createRefund(orderId: string, options: CreateRefundOptions) {
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  let { amount, reason } = options;

  if (!amount) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'amount',
        message: '退款金额:',
        validate: (input) => {
          const num = parseFloat(input);
          return !isNaN(num) && num > 0 ? true : '退款金额必须是有效的正数';
        },
      },
      {
        type: 'input',
        name: 'reason',
        message: '退款原因（可选）:',
        default: '',
      },
    ]);

    amount = answers.amount;
    reason = answers.reason || undefined;
  }

  if (!amount) {
    throw new ValidationError('退款金额不能为空', 'amount');
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new ValidationError('退款金额必须是有效的正数', 'amount');
  }

  const spinner = ora('正在创建退款...').start();

  try {
    const refund = await commerceApi.refunds.create({
      order_id: orderId,
      amount: amountNum,
      reason,
    });
    spinner.succeed('退款创建成功！');

    console.log();
    console.log(chalk.gray('退款 ID: ') + chalk.cyan(refund.id || refund.refund_id));
    console.log(chalk.gray('订单 ID: ') + chalk.cyan(orderId));
    console.log(chalk.gray('退款金额: ') + chalk.green(amountNum.toString()));
    if (reason) {
      console.log(chalk.gray('退款原因: ') + reason);
    }
    console.log();
  } catch (error: any) {
    spinner.fail('退款创建失败');
    throw createApiError(error);
  }
}
