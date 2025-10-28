import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, ValidationError, createApiError } from '../../utils/error.js';
import { formatProduct } from '../../utils/format.js';
import { existsSync } from 'fs';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

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

const cmd = new Command('create')
  .description('Create a new product with title, price, and optional details')
  .option('--title <string>', 'Product name (required)')
  .option('--price <number>', 'Product price (required)')
  .option('--description <string>', 'Product description')
  .option('--stock <number>', 'Stock quantity (default: 0)', '0')
  .option('--sku <string>', 'SKU code')
  .option('--currency <string>', 'Currency code (default: USD)', 'USD')
  .option('--status <string>', 'Status: active|inactive|draft (default: active)', 'active')
  .option('--category-id <uuid>', 'Category ID')
  .option('--images <paths>', 'Local image paths (comma-separated)')
  .option('--media-ids <uuids>', 'Media IDs from upload command (comma-separated)')
  .action(async (options: CreateProductOptions) => {
    try {
      await createProduct(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create a basic product',
    '$ optima product create --title "Ceramic Mug" --price 29.99',
    '',
    '# Create with full details',
    '$ optima product create \\',
    '  --title "Ceramic Mug" \\',
    '  --price 29.99 \\',
    '  --description "Handmade ceramic mug" \\',
    '  --stock 100 \\',
    '  --sku MUG-001',
    '',
    '# Create with images (recommended workflow)',
    '$ optima upload image --path mug.jpg  # Get media_id first',
    '$ optima product create \\',
    '  --title "Ceramic Mug" \\',
    '  --price 29.99 \\',
    '  --media-ids "abc-123-def"',
    '',
    '# Create with JSON output for scripting',
    '$ optima product create --title "Mug" --price 29.99 --json',
  ],
  output: {
    example: JSON.stringify(
      {
        success: true,
        data: {
          product_id: 'uuid',
          name: 'Product name',
          handle: 'url-slug',
          price: '29.99',
          currency: 'USD',
          status: 'active',
          product_url: 'https://...',
          created_at: 'timestamp',
        },
      },
      null,
      2
    ),
  },
  relatedCommands: [
    { command: 'upload image', description: 'Upload product images first' },
    { command: 'product list', description: 'View created products' },
    { command: 'product update', description: 'Modify product details' },
    { command: 'category create', description: 'Create category before assigning' },
  ],
  notes: [
    'title and price are required (interactive prompt if not provided)',
    'Upload images first with \'optima upload image\' to get media IDs',
    'Use --media-ids for uploaded images, not --images for local paths',
    'Default output is JSON, use --pretty for human-readable format',
  ],
});

export const createProductCommand = cmd;

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
  const spinner = output.spinner('正在创建商品...');

  try {
    const product = await commerceApi.products.create(productData);
    spinner.succeed('商品创建成功！');

    let imageCount = 0;

    // 如果有 media IDs，直接关联
    if (options.mediaIds) {
      const mediaIds = options.mediaIds.split(',').map((id) => id.trim());

      if (mediaIds.length > 0) {
        const linkSpinner = output.spinner(`正在关联 ${mediaIds.length} 张图片...`);

        try {
          await commerceApi.products.addImagesByMediaIds(product.id || product.product_id!, mediaIds);
          linkSpinner.succeed(`图片关联成功！(${mediaIds.length} 张)`);
          imageCount = mediaIds.length;
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
        const uploadSpinner = output.spinner(`正在上传 ${validPaths.length} 张图片...`);

        try {
          await commerceApi.products.addImages(product.id || product.product_id!, validPaths);
          uploadSpinner.succeed(`图片上传成功！(${validPaths.length} 张)`);
          imageCount += validPaths.length;
        } catch (error: any) {
          uploadSpinner.fail('图片上传失败');
          throw createApiError(error);
        }
      }
    }

    // 获取商品URL
    let productUrl: string | undefined;
    if (product.handle) {
      const merchantSpinner = output.spinner('获取店铺链接...');
      try {
        const merchant = await commerceApi.merchant.getProfile();
        merchantSpinner.stop();

        if (merchant.slug) {
          productUrl = `https://${merchant.slug}.optima.shop/products/${product.handle}`;
        }
      } catch (err) {
        merchantSpinner.stop();
        // 静默失败，商品详情已经显示
      }
    }

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        product_id: product.id || product.product_id,
        name: product.name,
        handle: product.handle,
        price: product.price,
        currency: product.currency,
        stock: product.stock,
        sku: product.sku,
        status: product.status,
        images_uploaded: imageCount,
        product_url: productUrl,
        created_at: product.created_at
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(formatProduct(product));

      // 显示商品链接
      if (productUrl) {
        console.log(chalk.gray('产品链接: ') + chalk.cyan.underline(productUrl));
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('商品创建失败');
    throw createApiError(error);
  }
}
