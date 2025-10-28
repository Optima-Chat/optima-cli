import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatInventoryList } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface LowStockOptions {
  threshold?: string;
}

const cmd = new Command('low-stock')
  .description('Get products with stock below threshold (low stock alert)')
  .option('-t, --threshold <number>', 'Stock threshold (default: 5)', '5')
  .action(async (options: LowStockOptions) => {
    try {
      await getLowStock(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Check products with stock below 5 (default)',
    '$ optima inventory low-stock',
    '',
    '# Set custom threshold',
    '$ optima inventory low-stock --threshold 10',
    '',
    '# Get low stock alerts in JSON',
    '$ optima inventory low-stock --threshold 20 --json',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        items: [
          {
            product_id: 'uuid',
            product_name: 'Ceramic Mug',
            variant_id: 'uuid',
            variant_name: 'Blue',
            current_stock: 3,
            threshold: 5
          }
        ],
        total: 1,
        threshold: 5
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'inventory update', description: 'Update stock quantities' },
    { command: 'product list', description: 'View all products' },
  ],
  notes: [
    'Default threshold is 5 units',
    'Use this for proactive restocking alerts',
    'Returns both products and variants below threshold',
  ]
});

export const lowStockCommand = cmd;

async function getLowStock(options: LowStockOptions) {
  const threshold = parseInt(options.threshold || '5', 10);

  const spinner = output.spinner('正在获取低库存商品...');

  try {
    const items = await commerceApi.inventory.getLowStock(threshold);
    spinner.succeed('低库存商品获取成功');

    if (!items || items.length === 0) {
      if (output.isJson()) {
        output.success({
          items: [],
          threshold,
          total: 0
        }, `没有库存低于 ${threshold} 的商品`);
      } else {
        console.log(chalk.green(`\n✓ 没有库存低于 ${threshold} 的商品\n`));
      }
      return;
    }

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        items,
        threshold,
        total: items.length
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(chalk.yellow(`⚠️  发现 ${items.length} 个低库存商品（阈值: ${threshold}）\n`));
      console.log(formatInventoryList(items));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('获取低库存商品失败');
    throw createApiError(error);
  }
}
