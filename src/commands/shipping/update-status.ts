import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment, requireParam } from '../../utils/interactive.js';

interface UpdateStatusOptions {
  id?: string;
  status?: string;
  note?: string;
}

const cmd = new Command('update-status')
  .description('Update shipping tracking status for an order')
  .option('--id <uuid>', 'Order ID (required)')
  .option('-s, --status <string>', 'Shipping status (in_transit, out_for_delivery, delivered, etc.)')
  .option('-n, --note <string>', 'Status note/description (optional)')
  .action(async (options: UpdateStatusOptions) => {
    try {
      await updateShippingStatus(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Update shipping status to in transit',
    '$ optima shipping update-status \\',
    '  --id order-123 \\',
    '  --status in_transit \\',
    '  --note "Package picked up from warehouse"',
    '',
    '# Mark as delivered',
    '$ optima shipping update-status \\',
    '  --id order-123 \\',
    '  --status delivered',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order_id: 'uuid',
        status: 'in_transit',
        note: 'Package picked up from warehouse',
        updated_at: 'timestamp'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping history', description: 'View tracking history' },
    { command: 'order ship', description: 'Mark order as shipped first' },
  ],
  notes: [
    'Order ID is required',
    'Common statuses: in_transit, out_for_delivery, delivered',
    'Note is optional but recommended for clarity',
    'Order must be shipped before updating status',
  ]
});

export const updateStatusCommand = cmd;

async function updateShippingStatus(options: UpdateStatusOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  let statusData: any = {};

  // 检测环境
  if (isInteractiveEnvironment()) {
    // 交互模式
    if (!options.status) {
      console.log(chalk.cyan(`\n📦 更新物流状态: ${orderId}\n`));

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'status',
          message: '物流状态:',
          choices: [
            { name: '待发货 (pending)', value: 'pending' },
            { name: '已发货 (shipped)', value: 'shipped' },
            { name: '运输中 (in_transit)', value: 'in_transit' },
            { name: '派送中 (out_for_delivery)', value: 'out_for_delivery' },
            { name: '已送达 (delivered)', value: 'delivered' },
            { name: '配送失败 (failed)', value: 'failed' },
          ],
        },
        {
          type: 'input',
          name: 'note',
          message: '备注 (可选):',
          default: options.note || '',
        },
      ]);

      statusData = {
        status: answers.status,
        note: answers.note?.trim() || undefined,
      };
    } else {
      // 交互环境但参数完整
      statusData = {
        status: options.status,
        note: options.note,
      };
    }
  } else {
    // 非交互模式：直接验证参数
    const status = requireParam(options.status, 'status', '物流状态');
    statusData = {
      status: status,
      note: options.note,
    };
  }

  const spinner = output.spinner('正在更新物流状态...');

  try {
    await commerceApi.shipping.updateShippingStatus(orderId, statusData);
    spinner.succeed('物流状态更新成功！');

    if (output.isJson()) {
      output.success({
        order_id: orderId,
        status: statusData.status,
        ...(statusData.note && { note: statusData.note })
      });
    } else {
      console.log();
      console.log(chalk.gray('订单 ID: ') + chalk.cyan(orderId));
      console.log(chalk.gray('新状态: ') + chalk.green(statusData.status));

      if (statusData.note) {
        console.log(chalk.gray('备注: ') + statusData.note);
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('物流状态更新失败');
    throw createApiError(error);
  }
}
