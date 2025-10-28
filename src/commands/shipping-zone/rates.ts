import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

// 列出费率
const listCmd = new Command('list-rates')
  .description('List all shipping rates in a zone')
  .option('--zone-id <id>', 'Zone ID (required)')
  .action(async (options: { zoneId?: string }) => {
    try {
      if (!options.zoneId || options.zoneId.trim().length === 0) {
        throw new ValidationError('区域 ID 不能为空', 'zone-id');
      }

      const zoneId = options.zoneId;

      const spinner = output.spinner('正在获取费率...');
      const rates = await commerceApi.shippingFixed.listRates(zoneId);
      spinner.succeed('费率获取成功');

      if (rates.length === 0) {
        if (output.isJson()) {
          output.success({
            zone_id: zoneId,
            rates: [],
            total: 0
          }, '该区域暂无费率配置');
        } else {
          console.log(chalk.yellow('\n该区域暂无费率配置\n'));
        }
        return;
      }

      if (output.isJson()) {
        output.success({
          zone_id: zoneId,
          rates: rates,
          total: rates.length
        });
      } else {
        const table = new Table({
          head: [chalk.cyan('ID'), chalk.cyan('名称'), chalk.cyan('类型'), chalk.cyan('价格'), chalk.cyan('免运费阈值')],
          colWidths: [38, 15, 15, 15, 18],
        });

        rates.forEach((rate: any) => {
          const price = rate.base_cost !== undefined && rate.base_cost !== null
            ? `${rate.currency} ${rate.base_cost}`
            : '-';
          const freeThreshold = rate.min_order_amount
            ? `≥${rate.currency} ${rate.min_order_amount}`
            : rate.min_quantity
            ? `≥${rate.min_quantity} 件`
            : '-';

          table.push([rate.id, rate.name || '-', rate.rate_type || '-', price, freeThreshold]);
        });

        console.log('\n' + table.toString() + '\n');
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(listCmd, {
  examples: [
    '# List all rates in a zone',
    '$ optima shipping-zone list-rates --zone-id zone-123',
  ],
  output: {
    description: 'Returns all shipping rates configured for the zone',
    example: JSON.stringify({
      success: true,
      data: {
        zone_id: 'uuid',
        rates: [
          {
            id: 'rate-uuid',
            name: 'Standard Shipping',
            rate_type: 'flat_rate',
            currency: 'USD',
            base_cost: 15.00,
            min_order_amount: 100.00
          }
        ],
        total: 1
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping-zone list', description: 'Find zone IDs' },
    { command: 'shipping-zone add-rate', description: 'Add new rate to zone' },
  ],
  notes: [
    'Zone ID is required',
    'Shows flat rates, weight-based rates, and free shipping thresholds',
  ]
});

export const listRatesCommand = listCmd;

// 添加费率
interface CreateRateOptions {
  zoneId?: string;
  name?: string;
  rateType?: string;
  price?: string;
  currency?: string;
  minAmount?: string;
  minQuantity?: string;
}

const createCmd = new Command('add-rate')
  .description('Add shipping rate to a zone')
  .option('--zone-id <id>', 'Zone ID (required)')
  .option('-n, --name <name>', 'Rate name (e.g., "Standard Shipping") (required)')
  .option('-t, --rate-type <type>', 'Rate type: flat_rate/free/weight_based (default: flat_rate)', 'flat_rate')
  .option('-p, --price <price>', 'Shipping cost (required)')
  .option('-c, --currency <currency>', 'Currency code (default: merchant default currency)')
  .option('--min-amount <amount>', 'Minimum order amount for free shipping (optional)')
  .option('--min-quantity <quantity>', 'Minimum order quantity for free shipping (optional)')
  .action(async (options: CreateRateOptions) => {
    try {
      await createRate(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(createCmd, {
  examples: [
    '# Add flat rate shipping',
    '$ optima shipping-zone add-rate \\',
    '  --zone-id zone-123 \\',
    '  --name "Standard Shipping" \\',
    '  --price 15 \\',
    '  --currency USD',
    '',
    '# Add free shipping threshold',
    '$ optima shipping-zone add-rate \\',
    '  --zone-id zone-123 \\',
    '  --name "Free Shipping" \\',
    '  --price 0 \\',
    '  --min-amount 100',
    '',
    '# Interactive mode',
    '$ optima shipping-zone add-rate --zone-id zone-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        zone_id: 'uuid',
        rate_id: 'uuid',
        rate: {
          name: 'Standard Shipping',
          rate_type: 'flat_rate',
          currency: 'USD',
          base_cost: 15.00
        }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping-zone list', description: 'Find zone IDs' },
    { command: 'shipping-zone list-rates', description: 'View existing rates' },
    { command: 'merchant info', description: 'Check default currency' },
  ],
  notes: [
    'Zone ID, name, and price are required',
    'Currency must match merchant default currency',
    'Interactive mode prompts for missing required fields',
    'Use min-amount for free shipping thresholds',
  ]
});

export const createRateCommand = createCmd;

async function createRate(options: CreateRateOptions) {
  if (!options.zoneId || options.zoneId.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'zone-id');
  }

  const zoneId = options.zoneId;

  let { name, rateType, price, currency, minAmount, minQuantity } = options;

  // 获取商户信息以确定默认货币
  let merchantCurrency = 'USD';
  try {
    const merchant = await commerceApi.merchant.getProfile();
    if (merchant.default_currency) {
      merchantCurrency = merchant.default_currency;
    }
  } catch (error) {
    // 如果获取失败，使用默认值 USD
  }

  // 如果用户没有指定货币，使用商户货币
  if (!currency) {
    currency = merchantCurrency;
  }

  // 交互式输入缺失的必填字段
  if (!name || !price) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '费率名称:',
        when: !name,
        validate: (input) => input.trim().length > 0 || '名称不能为空',
      },
      {
        type: 'input',
        name: 'price',
        message: '运费价格:',
        when: !price,
        validate: (input) => {
          const num = parseFloat(input);
          return !isNaN(num) && num >= 0 ? true : '价格必须是非负数';
        },
      },
      {
        type: 'input',
        name: 'minAmount',
        message: '免运费的最低订单金额（可选）:',
        when: !minAmount,
      },
    ]);

    name = name || answers.name;
    price = price || answers.price;
    minAmount = minAmount || answers.minAmount;
  }

  const spinner = output.spinner('正在添加费率...');

  try {
    const data: any = {
      name: name!,
      rate_type: rateType || 'flat_rate',
      currency: currency!,
      base_cost: parseFloat(price!),
    };

    if (minAmount) data.min_order_amount = parseFloat(minAmount);
    if (minQuantity) data.min_quantity = parseInt(minQuantity);

    const rate = await commerceApi.shippingFixed.createRate(zoneId, data);
    spinner.succeed('费率添加成功！');

    if (output.isJson()) {
      output.success({
        zone_id: zoneId,
        rate_id: rate.id,
        rate: data
      });
    } else {
      console.log();
      console.log(chalk.gray('费率 ID: ') + chalk.cyan(rate.id));
      console.log(chalk.gray('名称: ') + name);
      console.log(chalk.gray('类型: ') + data.rate_type);
      console.log(chalk.gray('价格: ') + `${data.currency} ${data.base_cost}`);
      if (minAmount) console.log(chalk.gray('免运费阈值: ') + `${data.currency} ${data.min_order_amount}`);
      console.log();
    }
  } catch (error: any) {
    spinner.fail('费率添加失败');

    // 特殊处理货币不匹配错误
    if (error.response?.data?.error_code === 'SHIPPING_CURRENCY_MISMATCH') {
      const details = error.response.data.details;
      console.log();
      console.log(chalk.yellow('💡 提示: 运费货币必须与商户货币一致'));
      if (details?.merchant_currency) {
        console.log(chalk.yellow(`   商户货币: ${details.merchant_currency}`));
        console.log(chalk.yellow(`   请使用: --currency ${details.merchant_currency}`));
      }
      console.log();
    }

    throw createApiError(error);
  }
}
