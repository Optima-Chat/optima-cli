import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';

export const historyCommand = new Command('history')
  .description('查看物流历史')
  .argument('<order-id>', '订单 ID')
  .action(async (orderId: string) => {
    try {
      await getShippingHistory(orderId);
    } catch (error) {
      handleError(error);
    }
  });

async function getShippingHistory(orderId: string) {
  // 验证参数
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

  const spinner = ora('正在获取物流历史...').start();

  try {
    const history = await commerceApi.shipping.getShippingHistory(orderId);
    spinner.stop();

    if (!history || history.length === 0) {
      console.log(chalk.yellow('\n暂无物流记录\n'));
      return;
    }

    // 显示物流历史表格
    console.log();
    console.log(chalk.cyan.bold(`物流历史 - ${orderId}`));
    console.log();

    const table = new Table({
      head: [chalk.cyan('时间'), chalk.cyan('状态'), chalk.cyan('备注')],
      colWidths: [18, 20, 40],
      wordWrap: true,
    });

    history.forEach((record: any) => {
      const status = record.status || '-';
      const note = record.note || record.description || '-';

      table.push([formatDate(record.created_at || record.timestamp), status, note]);
    });

    console.log(table.toString());
    console.log();
  } catch (error: any) {
    spinner.fail('获取物流历史失败');
    throw createApiError(error);
  }
}
