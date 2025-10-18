import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatProductList } from '../../utils/format.js';

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
  const spinner = ora('正在获取商品列表...').start();

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
    spinner.stop();

    if (!result.products || result.products.length === 0) {
      console.log(chalk.yellow('\n暂无商品\n'));
      return;
    }

    // 显示商品列表
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
  } catch (error: any) {
    spinner.fail('获取商品列表失败');
    throw createApiError(error);
  }
}
