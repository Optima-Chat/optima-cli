import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatProductList } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface ListProductsOptions {
  limit?: string;
  offset?: string;
  status?: string;
  categoryId?: string;
  search?: string;
}

const cmd = new Command('list')
  .description('List products with pagination and filtering options')
  .option('-l, --limit <number>', 'Products per page (default: 20)', '20')
  .option('-o, --offset <number>', 'Offset for pagination (default: 0)', '0')
  .option('-s, --status <string>', 'Filter by status: active|inactive|draft|archived')
  .option('-c, --category-id <uuid>', 'Filter by category ID')
  .option('--search <keyword>', 'Search by keyword in title/description')
  .action(async (options: ListProductsOptions) => {
    try {
      await listProducts(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List first 20 products (default)',
    '$ optima product list',
    '',
    '# List with custom limit',
    '$ optima product list --limit 50',
    '',
    '# List second page (offset pagination)',
    '$ optima product list --limit 20 --offset 20',
    '',
    '# Filter by status',
    '$ optima product list --status active',
    '',
    '# Filter by category',
    '$ optima product list --category-id abc-123-def',
    '',
    '# Search products',
    '$ optima product list --search "ceramic"',
    '',
    '# Combine filters with JSON output',
    '$ optima product list --status active --limit 10 --json',
  ],
  output: {
    example: JSON.stringify(
      {
        success: true,
        data: {
          products: [
            {
              product_id: 'uuid',
              name: 'Product name',
              price: '29.99',
              currency: 'USD',
              status: 'active',
              stock_quantity: 100,
            },
          ],
          total: 42,
          page: 1,
          per_page: 20,
          offset: 0,
          has_next: true,
        },
      },
      null,
      2
    ),
  },
  relatedCommands: [
    { command: 'product get', description: 'View single product details' },
    { command: 'product create', description: 'Create a new product' },
    { command: 'product update', description: 'Update existing product' },
    { command: 'category list', description: 'List categories for filtering' },
  ],
  notes: [
    'Default pagination: limit=20, offset=0',
    'Use offset for page navigation: page 2 = offset 20, page 3 = offset 40',
    'Status values: active (live), inactive (hidden), draft (unpublished), archived',
    'Search looks in both title and description fields',
  ],
});

export const listProductsCommand = cmd;

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
