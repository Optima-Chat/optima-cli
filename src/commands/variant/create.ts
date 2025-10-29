import { Command } from 'commander';
import inquirer from 'inquirer';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatVariant } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment, requireParam } from '../../utils/interactive.js';

interface CreateVariantOptions {
  productId?: string;
  sku?: string;
  price?: string;
  stock?: string;
  attributes?: string; // JSON string: {"size":"S","color":"White"}
}

const cmd = new Command('create')
  .description('Create product variant (SKU) with attributes like size/color')
  .option('--product-id <uuid>', 'Product ID (required)')
  .option('-s, --sku <string>', 'SKU code (required)')
  .option('-p, --price <number>', 'Variant price (optional, uses product price if not set)')
  .option('--stock <number>', 'Stock quantity (optional)')
  .option('-a, --attributes <json>', 'Variant attributes as JSON (required, e.g., \'{"size":"S","color":"White"}\')')
  .action(async (options: CreateVariantOptions) => {
    try {
      await createVariant(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create variant with size and color',
    '$ optima variant create \\',
    '  --product-id abc-123 \\',
    '  --sku "MUG-S-WHITE" \\',
    '  --price 89 \\',
    '  --stock 10 \\',
    '  --attributes \'{"size":"S","color":"White"}\'',
    '',
    '# Create variant using product price',
    '$ optima variant create \\',
    '  --product-id abc-123 \\',
    '  --sku "MUG-M-BLUE" \\',
    '  --attributes \'{"size":"M","color":"Blue"}\'',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        variant: {
          variant_id: 'uuid',
          sku: 'MUG-S-WHITE',
          price: '89.00',
          stock: 10,
          attributes: {
            size: 'S',
            color: 'White'
          },
          created_at: 'timestamp'
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'variant list', description: 'View all variants for a product' },
    { command: 'variant add-images', description: 'Add images to variant' },
    { command: 'product create', description: 'Create product first' },
  ],
  notes: [
    'product-id, sku, and attributes are required',
    'attributes must be valid JSON object (e.g., {"size":"S","color":"White"})',
    'price is optional - if not provided, variant uses product price',
    'Each variant represents a unique SKU with specific attributes',
  ]
});

export const createVariantCommand = cmd;

async function createVariant(options: CreateVariantOptions) {
  // 验证商品 ID（必需）
  const productId = isInteractiveEnvironment()
    ? (options.productId?.trim() || (() => { throw new ValidationError('商品 ID 不能为空', 'product-id'); })())
    : requireParam(options.productId, 'product-id', '商品 ID');

  let sku: string | undefined;
  let price: string | undefined;
  let stock: string | undefined;
  let attributes: string | undefined;

  // 检测环境
  if (isInteractiveEnvironment()) {
    // 交互模式：友好提示
    if (!options.sku || !options.attributes) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'sku',
          message: 'SKU 编码:',
          default: options.sku || '',
        },
        {
          type: 'input',
          name: 'price',
          message: '价格（可选，留空使用商品价格）:',
          default: options.price || '',
        },
        {
          type: 'input',
          name: 'stock',
          message: '库存数量（可选）:',
          default: options.stock || '',
        },
        {
          type: 'input',
          name: 'attributes',
          message: '属性（JSON 格式，如 {"size":"S","color":"White"}）:',
          default: options.attributes || '{}',
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

      sku = answers.sku || undefined;
      price = answers.price || undefined;
      stock = answers.stock || undefined;
      attributes = answers.attributes || undefined;
    } else {
      // 交互环境但参数完整
      sku = options.sku;
      price = options.price;
      stock = options.stock;
      attributes = options.attributes;
    }
  } else {
    // 非交互模式：直接验证参数
    sku = requireParam(options.sku, 'sku', 'SKU 编码');
    attributes = requireParam(options.attributes, 'attributes', '变体属性');
    price = options.price;
    stock = options.stock;
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
