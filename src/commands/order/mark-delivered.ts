import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';

export const markDeliveredCommand = new Command('mark-delivered')
  .description('标记订单已送达')
  .argument('<order-id>', '订单 ID')
  .action(async (orderId: string) => {
    try {
      await markDelivered(orderId);
    } catch (error) {
      handleError(error);
    }
  });

async function markDelivered(orderId: string) {
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  const spinner = ora('正在标记订单已送达...').start();

  try {
    const order = await commerceApi.orders.markDelivered(orderId);
    spinner.succeed('订单已标记为送达！');

    console.log();
    console.log(formatOrder(order));
  } catch (error: any) {
    spinner.fail('标记订单失败');
    throw createApiError(error);
  }
}
