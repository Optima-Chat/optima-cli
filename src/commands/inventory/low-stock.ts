import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatInventoryList } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface LowStockOptions {
  threshold?: string;
}

export const lowStockCommand = new Command('low-stock')
  .description('获取低库存商品')
  .option('-t, --threshold <number>', '库存阈值', '5')
  .action(async (options: LowStockOptions) => {
    try {
      await getLowStock(options);
    } catch (error) {
      handleError(error);
    }
  });

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
