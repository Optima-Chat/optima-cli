import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';

export const getOrderCommand = new Command('get')
  .description('订单详情')
  .option('--id <id>', '订单 ID')
  .action(async (options: { id?: string }) => {
    try {
      await getOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

async function getOrder(options: { id?: string }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  const spinner = output.spinner('正在获取订单详情...');

  try {
    const order = await commerceApi.orders.get(orderId);
    spinner.succeed('订单详情获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({ order });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(formatOrder(order));
    }
  } catch (error: any) {
    spinner.fail('获取订单详情失败');
    throw createApiError(error);
  }
}
