import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';

export const getOrderCommand = new Command('get')
  .description('订单详情')
  .argument('<order-id>', '订单 ID')
  .action(async (orderId: string) => {
    try {
      await getOrder(orderId);
    } catch (error) {
      handleError(error);
    }
  });

async function getOrder(orderId: string) {
  // 验证参数
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  const spinner = ora('正在获取订单详情...').start();

  try {
    const order = await commerceApi.orders.get(orderId);
    spinner.stop();

    // 显示订单详情
    console.log();
    console.log(formatOrder(order));
  } catch (error: any) {
    spinner.fail('获取订单详情失败');
    throw createApiError(error);
  }
}
