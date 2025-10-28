import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('get')
  .description('Get refund details by refund ID')
  .option('--id <uuid>', 'Refund ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await getRefund(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get refund details',
    '$ optima refund get --id refund-123',
    '',
    '# Get refund in JSON format',
    '$ optima refund get --id refund-123 --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        refund_id: 'uuid',
        order_id: 'uuid',
        amount: 99.99,
        status: 'succeeded',
        reason: 'requested_by_customer',
        created_at: 'timestamp'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'refund create', description: 'Create new refund' },
    { command: 'order get', description: 'View associated order' },
  ],
  notes: [
    'Refund ID is required',
    'Shows refund status and details',
    'Use refund ID from create command response',
  ]
});

export const getRefundCommand = cmd;

async function getRefund(options: { id?: string }) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('退款 ID 不能为空', 'id');
  }

  const refundId = options.id;

  const spinner = output.spinner('正在获取退款详情...');

  try {
    const refund = await commerceApi.refunds.get(refundId);
    spinner.succeed('退款详情获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        refund_id: refund.id || refund.refund_id,
        order_id: refund.order_id,
        amount: refund.amount || 0,
        status: refund.status,
        reason: refund.reason,
        created_at: refund.created_at
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      const separator = chalk.gray('─'.repeat(60));
      console.log(separator);
      console.log(chalk.cyan.bold('退款详情'));
      console.log(separator);
      console.log(`${chalk.gray('退款 ID:')}    ${refund.id || refund.refund_id}`);
      console.log(`${chalk.gray('订单 ID:')}    ${refund.order_id || '-'}`);
      console.log(`${chalk.gray('退款金额:')}  ${chalk.green((refund.amount || 0).toString())}`);
      console.log(`${chalk.gray('状态:')}        ${refund.status || '-'}`);
      if (refund.reason) {
        console.log(`${chalk.gray('退款原因:')}  ${refund.reason}`);
      }
      console.log(separator);
      console.log();
    }
  } catch (error: any) {
    spinner.fail('获取退款详情失败');
    throw createApiError(error);
  }
}
