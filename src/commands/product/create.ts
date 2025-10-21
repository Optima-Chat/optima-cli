import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, ValidationError, createApiError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import { existsSync } from 'fs';

interface CreateProductOptions {
  title?: string;
  price?: string;
  description?: string;
  stock?: string;
  sku?: string;
  currency?: string;
  status?: 'active' | 'inactive' | 'draft';
  categoryId?: string;
  images?: string;
  mediaIds?: string;
}

export const createProductCommand = new Command('create')
  .description('创建商品')
  .option('--title <title>', '商品名称')
  .option('--price <price>', '商品价格')
  .option('--description <description>', '商品描述')
  .option('--stock <stock>', '库存数量', '0')
  .option('--sku <sku>', 'SKU 编码')
  .option('--currency <currency>', '货币单位', 'USD')
  .option('--status <status>', '商品状态 (active/inactive/draft)', 'active')
  .option('--category-id <categoryId>', '分类 ID')
  .option('--images <paths>', '图片路径（逗号分隔，本地文件）')
  .option('--media-ids <ids>', 'Media ID（逗号分隔，从 upload 命令获取）')
  .action(async (options: CreateProductOptions) => {
    try {
      await createProduct(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createProduct(options: CreateProductOptions) {
  let productData: any = {};

  // 检查是否提供了必需参数
  if (!options.title || !options.price) {
    console.log(chalk.cyan('\n📦 创建新商品\n'));

    // 交互式模式
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: '商品名称:',
        default: options.title,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return '商品名称不能为空';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'price',
        message: '商品价格:',
        default: options.price,
        validate: (input) => {
          const price = parseFloat(input);
          if (isNaN(price) || price < 0) {
            return '价格必须是大于等于 0 的数字';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: '商品描述 (可选):',
        default: options.description || '',
      },
      {
        type: 'input',
        name: 'stock',
        message: '库存数量:',
        default: options.stock || '0',
        validate: (input) => {
          const stock = parseInt(input, 10);
          if (isNaN(stock) || stock < 0) {
            return '库存必须是大于等于 0 的整数';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'sku',
        message: 'SKU 编码 (可选):',
        default: options.sku || '',
      },
      {
        type: 'list',
        name: 'currency',
        message: '货币单位:',
        choices: ['USD', 'CNY', 'EUR', 'GBP', 'JPY'],
        default: options.currency || 'USD',
      },
      {
        type: 'list',
        name: 'status',
        message: '商品状态:',
        choices: [
          { name: '上架 (active)', value: 'active' },
          { name: '下架 (inactive)', value: 'inactive' },
          { name: '草稿 (draft)', value: 'draft' },
        ],
        default: options.status || 'active',
      },
      {
        type: 'confirm',
        name: 'hasImages',
        message: '是否上传图片？',
        default: false,
      },
    ]);

    const stock = parseInt(answers.stock, 10);
    const title = answers.title.trim();

    productData = {
      name: title, // API 期望的字段名
      title: title, // 兼容性字段
      price: parseFloat(answers.price),
      description: answers.description?.trim() || undefined,
      stock_quantity: stock,
      sku: answers.sku?.trim() || undefined,
      currency: answers.currency,
      status: answers.status,
    };

    // 如果需要上传图片
    if (answers.hasImages) {
      const imageAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'imagePaths',
          message: '图片路径（逗号分隔，支持相对路径）:',
          validate: (input) => {
            if (!input || input.trim().length === 0) {
              return '请至少提供一张图片路径';
            }
            const paths = input.split(',').map((p: string) => p.trim());
            for (const path of paths) {
              if (!existsSync(path)) {
                return `文件不存在: ${path}`;
              }
            }
            return true;
          },
        },
      ]);

      options.images = imageAnswers.imagePaths;
    }
  } else {
    // 命令行参数模式
    const stock = parseInt(options.stock || '0', 10);

    productData = {
      name: options.title, // API 期望的字段名
      title: options.title, // 兼容性字段
      price: parseFloat(options.price),
      description: options.description,
      stock_quantity: stock,
      sku: options.sku,
      currency: options.currency || 'USD',
      status: options.status || 'active',
      category_id: options.categoryId,
    };

    // 验证价格
    if (isNaN(productData.price) || productData.price < 0) {
      throw new ValidationError('价格必须是大于等于 0 的数字', 'price');
    }

    // 验证库存
    if (isNaN(stock) || stock < 0) {
      throw new ValidationError('库存必须是大于等于 0 的整数', 'stock');
    }
  }

  // 调用 API 创建商品
  const spinner = ora('正在创建商品...').start();

  try {
    const product = await commerceApi.products.create(productData);
    spinner.succeed('商品创建成功！');

    // 如果有 media IDs，直接关联
    if (options.mediaIds) {
      const mediaIds = options.mediaIds.split(',').map((id) => id.trim());

      if (mediaIds.length > 0) {
        const linkSpinner = ora(`正在关联 ${mediaIds.length} 张图片...`).start();

        try {
          await commerceApi.products.addImagesByMediaIds(product.id || product.product_id!, mediaIds);
          linkSpinner.succeed(`图片关联成功！(${mediaIds.length} 张)`);
        } catch (error: any) {
          linkSpinner.fail('图片关联失败');
          throw createApiError(error);
        }
      }
    }

    // 如果有图片路径，上传图片
    if (options.images) {
      const imagePaths = options.images.split(',').map((p) => p.trim());

      // 验证图片文件
      for (const path of imagePaths) {
        if (!existsSync(path)) {
          console.log(chalk.yellow(`\n⚠ 图片文件不存在，跳过: ${path}`));
          continue;
        }
      }

      const validPaths = imagePaths.filter((p) => existsSync(p));

      if (validPaths.length > 0) {
        const uploadSpinner = ora(`正在上传 ${validPaths.length} 张图片...`).start();

        try {
          await commerceApi.products.addImages(product.id || product.product_id!, validPaths);
          uploadSpinner.succeed(`图片上传成功！(${validPaths.length} 张)`);
        } catch (error: any) {
          uploadSpinner.fail('图片上传失败');
          throw createApiError(error);
        }
      }
    }

    // 显示商品详情
    console.log();
    console.log(formatProduct(product));

    // 显示商品链接
    if (product.handle) {
      const merchantSpinner = ora('获取店铺链接...').start();
      try {
        const merchant = await commerceApi.merchant.getProfile();
        merchantSpinner.stop();

        if (merchant.slug) {
          const productUrl = `https://${merchant.slug}.optima.shop/products/${product.handle}`;
          console.log(chalk.gray('产品链接: ') + chalk.cyan.underline(productUrl));
        }
      } catch (err) {
        merchantSpinner.stop();
        // 静默失败，商品详情已经显示
      }
    }

    console.log();
  } catch (error: any) {
    spinner.fail('商品创建失败');
    throw createApiError(error);
  }
}
