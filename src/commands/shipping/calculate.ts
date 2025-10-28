import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatPrice } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface CalculateShippingOptions {
  country?: string;
  postalCode?: string;
  weight?: string;
  productId?: string;
  quantity?: string;
  price?: string;
}

const cmd = new Command('calculate')
  .description('Calculate shipping cost for destination and weight')
  .option('-c, --country <code>', 'Country code (e.g., US, CN) (required)')
  .option('-p, --postal-code <code>', 'Postal/ZIP code (required)')
  .option('-w, --weight <kg>', 'Package weight in kg (required)')
  .option('--product-id <uuid>', 'Product ID (optional, for accurate calculation)')
  .option('--quantity <number>', 'Product quantity (default: 1)', '1')
  .option('--price <number>', 'Product price (default: 0)', '0')
  .action(async (options: CalculateShippingOptions) => {
    try {
      await calculateShipping(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Calculate shipping to US',
    '$ optima shipping calculate \\',
    '  --country US \\',
    '  --postal-code 10001 \\',
    '  --weight 0.5',
    '',
    '# Calculate for specific product',
    '$ optima shipping calculate \\',
    '  --country JP \\',
    '  --postal-code 100-0001 \\',
    '  --product-id prod-123 \\',
    '  --quantity 2',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        country: 'US',
        postal_code: '10001',
        weight: 0.5,
        shipping_cost: '15.00',
        currency: 'USD',
        zone_name: 'North America'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping-zone list', description: 'View shipping zones and rates' },
    { command: 'order create', description: 'Create order with calculated shipping' },
  ],
  notes: [
    'Country, postal-code, and weight are required',
    'Country code uses ISO 3166-1 alpha-2 format (US, CN, JP, etc.)',
    'Weight in kilograms (kg)',
    'Returns shipping cost based on configured zones',
  ]
});

export const calculateCommand = cmd;

async function calculateShipping(options: CalculateShippingOptions) {
  // 先获取商户信息以获取 merchant_id
  let merchantId: string | undefined;
  try {
    const merchant = await commerceApi.merchant.getProfile();
    merchantId = merchant.id || merchant.merchant_id;
  } catch (error) {
    // 忽略错误，使用 undefined
  }

  let shippingData: any = {};

  // 如果没有提供必需参数，进入交互式模式
  if (!options.country || !options.weight) {
    console.log(chalk.cyan('\n📦 计算运费\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'country',
        message: '目的地国家代码 (如 US, CN):',
        default: options.country,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return '国家代码不能为空';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'postalCode',
        message: '邮政编码 (可选):',
        default: options.postalCode || '',
      },
      {
        type: 'input',
        name: 'weight',
        message: '包裹重量 (千克):',
        default: options.weight,
        validate: (input) => {
          const weight = parseFloat(input);
          if (isNaN(weight) || weight <= 0) {
            return '重量必须是大于 0 的数字';
          }
          return true;
        },
      },
    ]);

    const weight = parseFloat(answers.weight);
    const quantity = parseInt(options.quantity || '1', 10);
    const price = parseFloat(options.price || '0');

    shippingData = {
      destination_country: answers.country.trim().toUpperCase(),
      postal_code: answers.postalCode?.trim() || undefined,
      weight,
      items: [{
        product_id: options.productId || 'temp-product',
        quantity,
        price,
        weight,
      }],
      merchant_id: merchantId,
    };
  } else {
    // 命令行参数模式
    const weight = parseFloat(options.weight);

    // 验证重量
    if (isNaN(weight) || weight <= 0) {
      throw new ValidationError('重量必须是大于 0 的数字', 'weight');
    }

    const quantity = parseInt(options.quantity || '1', 10);
    const price = parseFloat(options.price || '0');

    shippingData = {
      destination_country: options.country.toUpperCase(),
      postal_code: options.postalCode,
      weight,
      items: [{
        product_id: options.productId || 'temp-product',
        quantity,
        price,
        weight,
      }],
      merchant_id: merchantId,
    };
  }

  const spinner = output.spinner('正在计算运费...');

  try {
    const result = await commerceApi.shippingFixed.calculate(shippingData);
    spinner.succeed('运费计算成功！');

    if (output.isJson()) {
      output.success({
        destination_country: shippingData.destination_country,
        postal_code: shippingData.postal_code,
        weight: shippingData.weight,
        shipping_cost: result.shipping_cost,
        currency: result.currency
      });
    } else {
      console.log();
      console.log(chalk.gray('目的地: ') + chalk.cyan(shippingData.destination_country));
      console.log(chalk.gray('重量: ') + chalk.cyan(`${shippingData.weight} kg`));

      if (result.shipping_cost !== undefined && result.currency) {
        console.log(chalk.gray('运费: ') + chalk.green(formatPrice(result.shipping_cost, result.currency)));
      } else {
        console.log(chalk.yellow('运费信息不可用'));
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail('运费计算失败');
    throw createApiError(error);
  }
}
