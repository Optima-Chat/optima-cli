import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';
import { output } from '../../utils/output.js';

export const historyCommand = new Command('history')
  .description('查看物流历史')
  .option('--id <id>', '订单 ID')
  .action(async (options: { id?: string }) => {
    try {
      await getShippingHistory(options);
    } catch (error) {
      handleError(error);
    }
  });

async function getShippingHistory(options: { id?: string }) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  const spinner = output.spinner('正在获取物流历史...');

  try {
    const history = await commerceApi.shipping.getShippingHistory(orderId);
    spinner.succeed('物流历史获取成功');

    if (!history || history.length === 0) {
      if (output.isJson()) {
        output.success({
          order_id: orderId,
          history: [],
          total: 0
        }, '暂无物流记录');
      } else {
        console.log(chalk.yellow('\n暂无物流记录\n'));
      }
      return;
    }

    if (output.isJson()) {
      output.success({
        order_id: orderId,
        history: history,
        total: history.length
      });
    } else {
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
    }
  } catch (error: any) {
    spinner.fail('获取物流历史失败');
    throw createApiError(error);
  }
}
