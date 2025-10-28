import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatProductList } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface ListProductsOptions {
  limit?: string;
  offset?: string;
  status?: string;
  categoryId?: string;
  search?: string;
}

export const listProductsCommand = new Command('list')
  .description('商品列表')
  .option('-l, --limit <limit>', '每页数量', '20')
  .option('-o, --offset <offset>', '偏移量', '0')
  .option('-s, --status <status>', '商品状态 (active/inactive/draft/archived)')
  .option('-c, --category-id <categoryId>', '分类 ID')
  .option('--search <keyword>', '搜索关键词')
  .action(async (options: ListProductsOptions) => {
    try {
      await listProducts(options);
    } catch (error) {
      handleError(error);
    }
  });

async function listProducts(options: ListProductsOptions) {
  const spinner = output.spinner('正在获取商品列表...');

  try {
    const params: any = {
      limit: parseInt(options.limit || '20', 10),
      offset: parseInt(options.offset || '0', 10),
    };

    if (options.status) {
      params.status = options.status;
    }

    if (options.categoryId) {
      params.category_id = options.categoryId;
    }

    if (options.search) {
      params.search = options.search;
    }

    const result = await commerceApi.products.list(params);
    spinner.succeed('商品列表获取成功');

    if (!result.products || result.products.length === 0) {
      if (output.isJson()) {
        output.success({
          products: [],
          total: 0,
          page: Math.floor(params.offset / params.limit) + 1,
          per_page: params.limit,
          has_next: false
        }, '暂无商品');
      } else {
        console.log(chalk.yellow('\n暂无商品\n'));
      }
      return;
    }

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        products: result.products,
        total: result.total,
        page: Math.floor(params.offset / params.limit) + 1,
        per_page: params.limit,
        offset: params.offset,
        has_next: result.total > (params.offset + params.limit)
      });
    } else {
      // Pretty 模式：保持原有表格输出
      console.log();
      console.log(formatProductList(result.products));

      // 显示分页信息
      console.log(
        chalk.gray(
          `\n显示 ${params.offset + 1}-${Math.min(params.offset + params.limit, result.total)} / 共 ${result.total} 件商品`
        )
      );

      // 提示翻页
      if (result.total > params.offset + params.limit) {
        const nextOffset = params.offset + params.limit;
        console.log(
          chalk.gray(`下一页: `) +
            chalk.cyan(`optima product list --limit ${params.limit} --offset ${nextOffset}`)
        );
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('获取商品列表失败');
    throw createApiError(error);
  }
}
