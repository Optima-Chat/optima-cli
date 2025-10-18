import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';

export const historyCommand = new Command('history')
  .description('查看库存变更历史')
  .argument('<product-id>', '商品 ID')
  .action(async (productId: string) => {
    try {
      await getHistory(productId);
    } catch (error) {
      handleError(error);
    }
  });

async function getHistory(productId: string) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const spinner = ora('正在获取库存历史...').start();

  try {
    const history = await commerceApi.inventory.getHistory(productId);
    spinner.stop();

    if (!history || history.length === 0) {
      console.log(chalk.yellow('\n暂无库存变更记录\n'));
      return;
    }

    // 显示库存历史表格
    console.log();
    console.log(chalk.cyan.bold(`库存变更历史 - ${productId}`));
    console.log();

    const table = new Table({
      head: [
        chalk.cyan('时间'),
        chalk.cyan('变更类型'),
        chalk.cyan('变更数量'),
        chalk.cyan('变更后库存'),
        chalk.cyan('备注'),
      ],
      colWidths: [18, 15, 12, 12, 30],
      wordWrap: true,
    });

    history.forEach((record: any) => {
      const changeType = record.type || record.change_type || '-';
      const changeQty = record.quantity_change || record.change_quantity || 0;
      const afterQty = record.quantity_after || record.stock_after || '-';
      const note = record.note || record.reason || '-';

      // 根据变更数量显示颜色
      const qtyColor = changeQty > 0 ? chalk.green : changeQty < 0 ? chalk.red : chalk.gray;

      table.push([
        formatDate(record.created_at || record.timestamp),
        changeType,
        qtyColor(changeQty > 0 ? `+${changeQty}` : changeQty.toString()),
        afterQty.toString(),
        note,
      ]);
    });

    console.log(table.toString());
    console.log();
  } catch (error: any) {
    spinner.fail('获取库存历史失败');
    throw createApiError(error);
  }
}
