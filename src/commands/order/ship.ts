import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface ShipOrderOptions {
  id?: string;
  tracking?: string;
  carrier?: string;
}

const cmd = new Command('ship')
  .description('Mark an order as shipped and add tracking information')
  .option('--id <uuid>', 'Order ID (required)')
  .option('-t, --tracking <string>', 'Tracking number (required)')
  .option('-c, --carrier <string>', 'Carrier name (required)')
  .action(async (options: ShipOrderOptions) => {
    try {
      await shipOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Ship an order with tracking',
    '$ optima order ship \\',
    '  --id abc-123-def \\',
    '  --tracking DHL1234567890 \\',
    '  --carrier DHL',
    '',
    '# Find orders to ship, then ship',
    '$ optima order list --status paid',
    '$ optima order ship --id <order_id> --tracking UPS123 --carrier UPS',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order_id: 'uuid',
        status: 'shipped',
        tracking_number: 'DHL1234567890',
        carrier: 'DHL',
        shipped_at: 'timestamp'
      },
      message: 'Order shipped successfully'
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order list', description: 'Find orders to ship (--status paid)' },
    { command: 'order mark-delivered', description: 'Mark order as delivered' },
    { command: 'shipping history', description: 'View shipping history' },
  ],
  notes: [
    'Order must be in \'paid\' or \'processing\' status to ship',
    'Tracking number will be sent to customer via email',
    'Common carriers: DHL, UPS, FedEx, USPS, China Post',
  ]
});

export const shipOrderCommand = cmd;

async function shipOrder(options: ShipOrderOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  let trackingNumber = options.tracking;
  let carrier = options.carrier;

  // 如果没有提供物流信息，进入交互式模式
  if (!trackingNumber && !carrier) {
    console.log(chalk.cyan('\n📦 订单发货\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'trackingNumber',
        message: '物流单号 (可选):',
        default: '',
      },
      {
        type: 'input',
        name: 'carrier',
        message: '快递公司 (可选):',
        default: '',
      },
    ]);

    trackingNumber = answers.trackingNumber || undefined;
    carrier = answers.carrier || undefined;
  }

  const spinner = output.spinner('正在标记订单已发货...');

  try {
    const shipData: any = {};

    if (trackingNumber) {
      shipData.tracking_number = trackingNumber;
    }

    if (carrier) {
      shipData.carrier = carrier;
    }

    const order = await commerceApi.orders.ship(orderId, shipData);
    spinner.succeed('订单已标记为发货！');

    if (output.isJson()) {
      output.success({
        order_id: order.id || order.order_id,
        status: order.status,
        tracking_number: trackingNumber,
        carrier: carrier
      });
    } else {
      // 显示更新后的订单信息
      console.log();
      console.log(formatOrder(order));

      if (trackingNumber) {
        console.log(chalk.gray('物流单号: ') + chalk.cyan(trackingNumber));
      }

      if (carrier) {
        console.log(chalk.gray('快递公司: ') + chalk.cyan(carrier));
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('订单发货失败');
    throw createApiError(error);
  }
}
