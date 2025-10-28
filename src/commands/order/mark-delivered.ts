import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';

export const markDeliveredCommand = new Command('mark-delivered')
  .description('标记订单已送达')
  .option('--id <id>', '订单 ID')
  .action(async (options: { id?: string }) => {
    try {
      await markDelivered(options);
    } catch (error) {
      handleError(error);
    }
  });

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
