import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('mark-delivered')
  .description('Mark order as delivered to customer')
  .option('--id <uuid>', 'Order ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await markDelivered(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Mark order as delivered',
    '$ optima order mark-delivered --id order-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order_id: 'uuid',
        status: 'delivered'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order ship', description: 'Ship order first' },
    { command: 'shipping update-status', description: 'Update tracking status' },
    { command: 'order complete', description: 'Complete after delivery' },
  ],
  notes: [
    'Order ID is required',
    'Order must be shipped before marking as delivered',
    'Updates order status to delivered',
    'Use after confirming customer received package',
  ]
});

export const markDeliveredCommand = cmd;

async function markDelivered(options: { id?: string }) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  const spinner = output.spinner('正在标记订单已送达...');

  try {
    const order = await commerceApi.orders.markDelivered(orderId);
    spinner.succeed('订单已标记为送达！');

    if (output.isJson()) {
      output.success({
        order_id: order.id || order.order_id,
        status: order.status
      });
    } else {
      console.log();
      console.log(formatOrder(order));
    }
  } catch (error: any) {
    spinner.fail('标记订单失败');
    throw createApiError(error);
  }
}
