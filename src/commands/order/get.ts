import { Command } from 'commander';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('get')
  .description('Get detailed information for a specific order by ID')
  .option('--id <uuid>', 'Order ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await getOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get order details',
    '$ optima order get --id abc-123-def',
    '',
    '# Get from list first',
    '$ optima order list --status paid',
    '$ optima order get --id <order_id_from_list>',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        order: {
          order_id: 'uuid',
          order_number: 'ORD-001',
          status: 'paid',
          total: '99.99',
          currency: 'USD',
          customer: { email: 'customer@example.com', name: 'John Doe' },
          items: [{ product_id: 'uuid', quantity: 2, price: '49.99' }],
          shipping_address: { country: 'US', city: 'New York' },
          created_at: 'timestamp'
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order list', description: 'Find order IDs' },
    { command: 'order ship', description: 'Ship this order' },
  ],
  notes: [
    'Use \'optima order list\' to find order IDs',
    'Returns full order details including items and shipping address',
  ]
});

export const getOrderCommand = cmd;

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
