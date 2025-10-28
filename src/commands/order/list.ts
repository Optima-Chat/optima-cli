import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatOrderList } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface ListOrdersOptions {
  limit?: string;
  offset?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export const listOrdersCommand = new Command('list')
  .description('订单列表')
  .option('-l, --limit <limit>', '每页数量', '20')
  .option('-o, --offset <offset>', '偏移量', '0')
  .option('-s, --status <status>', '订单状态 (pending/paid/processing/shipped/delivered/completed/cancelled/refunded)')
  .option('--start-date <date>', '起始日期 (YYYY-MM-DD)')
  .option('--end-date <date>', '结束日期 (YYYY-MM-DD)')
  .action(async (options: ListOrdersOptions) => {
    try {
      await listOrders(options);
    } catch (error) {
      handleError(error);
    }
  });

async function listOrders(options: ListOrdersOptions) {
  const spinner = output.spinner('正在获取订单列表...');

  try {
    const params: any = {
      limit: parseInt(options.limit || '20', 10),
      offset: parseInt(options.offset || '0', 10),
    };

    if (options.status) {
      params.status = options.status;
    }

    if (options.startDate) {
      params.start_date = options.startDate;
    }

    if (options.endDate) {
      params.end_date = options.endDate;
    }

    const result = await commerceApi.orders.list(params);
    spinner.succeed('订单列表获取成功');

    if (!result.orders || result.orders.length === 0) {
      if (output.isJson()) {
        output.success({
          orders: [],
          total: 0,
          page: Math.floor(params.offset / params.limit) + 1,
          per_page: params.limit,
          has_next: false
        }, '暂无订单');
      } else {
        console.log(chalk.yellow('\n暂无订单\n'));
      }
      return;
    }

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        orders: result.orders,
        total: result.total,
        page: Math.floor(params.offset / params.limit) + 1,
        per_page: params.limit,
        offset: params.offset,
        has_next: result.total > (params.offset + params.limit)
      });
    } else {
      // Pretty 模式：保持原有表格输出
      console.log();
      console.log(formatOrderList(result.orders));

      // 显示分页信息
      console.log(
        chalk.gray(
          `\n显示 ${params.offset + 1}-${Math.min(params.offset + params.limit, result.total)} / 共 ${result.total} 个订单`
        )
      );

      // 提示翻页
      if (result.total > params.offset + params.limit) {
        const nextOffset = params.offset + params.limit;
        console.log(
          chalk.gray(`下一页: `) +
            chalk.cyan(`optima order list --limit ${params.limit} --offset ${nextOffset}`)
        );
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('获取订单列表失败');
    throw createApiError(error);
  }
}
