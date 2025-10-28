import { Command } from 'commander';
import inquirer from 'inquirer';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariant } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface CreateVariantOptions {
  productId?: string;
  sku?: string;
  price?: string;
  stock?: string;
  attributes?: string; // JSON string: {"size":"S","color":"White"}
}

export const createVariantCommand = new Command('create')
  .description('创建商品变体')
  .option('--product-id <id>', '商品 ID')
  .option('-s, --sku <sku>', 'SKU 编码')
  .option('-p, --price <price>', '价格')
  .option('--stock <quantity>', '库存数量')
  .option('-a, --attributes <json>', '属性（JSON 格式，如 \'{"size":"S","color":"White"}\'）')
  .action(async (options: CreateVariantOptions) => {
    try {
      await createVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createVariant(options: CreateVariantOptions) {
  // 验证商品 ID
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const productId = options.productId;

  let { sku, price, stock, attributes } = options;

  // 交互式输入缺失的字段
  if (!sku || !attributes) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'sku',
        message: 'SKU 编码:',
        default: sku || '',
      },
      {
        type: 'input',
        name: 'price',
        message: '价格（可选，留空使用商品价格）:',
        default: price || '',
      },
      {
        type: 'input',
        name: 'stock',
        message: '库存数量（可选）:',
        default: stock || '',
      },
      {
        type: 'input',
        name: 'attributes',
        message: '属性（JSON 格式，如 {"size":"S","color":"White"}）:',
        default: attributes || '{}',
        validate: (input) => {
          if (!input || input.trim().length === 0) return true;
          try {
            JSON.parse(input);
            return true;
          } catch {
            return '属性必须是有效的 JSON 格式';
          }
        },
      },
    ]);

    sku = answers.sku || sku;
    price = answers.price || price;
    stock = answers.stock || stock;
    attributes = answers.attributes || attributes;
  }

  const spinner = output.spinner('正在创建变体...');

  try {
    const variantData: any = {};

    if (sku && sku.trim().length > 0) {
      variantData.sku = sku.trim();
    }

    if (price && price.trim().length > 0) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum)) {
        throw new ValidationError('价格必须是有效数字', 'price');
      }
      variantData.price = priceNum;
    }

    if (stock && stock.trim().length > 0) {
      const stockNum = parseInt(stock, 10);
      if (isNaN(stockNum)) {
        throw new ValidationError('库存必须是有效整数', 'stock');
      }
      variantData.stock = stockNum;
    }

    if (attributes && attributes.trim().length > 0) {
      try {
        variantData.attributes = JSON.parse(attributes);
      } catch {
        throw new ValidationError('属性必须是有效的 JSON 格式', 'attributes');
      }
    }

    const variant = await commerceApi.variants.create(productId, variantData);
    spinner.succeed('变体创建成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        variant
      });
    } else {
      // 显示变体详情
      console.log();
      console.log(formatVariant(variant));
    }
  } catch (error: any) {
    spinner.fail('变体创建失败');
    throw createApiError(error);
  }
}
