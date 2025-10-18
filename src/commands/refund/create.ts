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

const REFUND_REASONS = {
  'requested_by_customer': '客户要求退款',
  'duplicate': '重复收费',
  'fraudulent': '欺诈交易',
} as const;

type RefundReasonKey = keyof typeof REFUND_REASONS;

export const createRefundCommand = new Command('create')
  .description('创建退款')
  .argument('<order-id>', '订单 ID')
  .option('-a, --amount <amount>', '退款金额')
  .option('-r, --reason <reason>', '退款原因 (requested_by_customer/duplicate/fraudulent)')
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

  // 获取订单信息以获得 payment_intent_id
  const orderSpinner = ora('正在获取订单信息...').start();
  let order;
  try {
    order = await commerceApi.orders.get(orderId);
    orderSpinner.succeed('订单信息获取成功');
  } catch (error: any) {
    orderSpinner.fail('订单信息获取失败');
    throw createApiError(error);
  }

  if (!order.stripe_payment_intent_id) {
    throw new ValidationError('订单没有关联的支付信息，无法创建退款', 'payment_intent_id');
  }

  // 验证退款原因
  if (reason && !Object.keys(REFUND_REASONS).includes(reason)) {
    throw new ValidationError(
      `无效的退款原因。有效值: ${Object.keys(REFUND_REASONS).join(', ')}`,
      'reason'
    );
  }

  if (!amount || !reason) {
    const questions: any[] = [];

    if (!amount) {
      questions.push({
        type: 'input',
        name: 'amount',
        message: '退款金额:',
        validate: (input: string) => {
          const num = parseFloat(input);
          return !isNaN(num) && num > 0 ? true : '退款金额必须是有效的正数';
        },
      });
    }

    if (!reason) {
      questions.push({
        type: 'list',
        name: 'reason',
        message: '退款原因:',
        choices: Object.entries(REFUND_REASONS).map(([key, value]) => ({
          name: value,
          value: key,
        })),
        default: 'requested_by_customer',
      });
    }

    const answers = await inquirer.prompt(questions);
    amount = amount || answers.amount;
    reason = reason || answers.reason;
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
      payment_intent_id: order.stripe_payment_intent_id,
      amount: amountNum,
      reason,
    });
    spinner.succeed('退款创建成功！');

    console.log();
    console.log(chalk.gray('退款 ID: ') + chalk.cyan(refund.id || refund.refund_id));
    console.log(chalk.gray('订单 ID: ') + chalk.cyan(orderId));
    console.log(chalk.gray('退款金额: ') + chalk.green(amountNum.toString()));
    if (reason) {
      const reasonText = REFUND_REASONS[reason as RefundReasonKey] || reason;
      console.log(chalk.gray('退款原因: ') + reasonText);
    }
    console.log();
  } catch (error: any) {
    spinner.fail('退款创建失败');
    throw createApiError(error);
  }
}
