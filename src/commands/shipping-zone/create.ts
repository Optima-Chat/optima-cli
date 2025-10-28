import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface CreateZoneOptions {
  name?: string;
  countries?: string;
  price?: string;
  currency?: string;
  minWeight?: string;
  maxWeight?: string;
  rateName?: string;
  rateType?: string;
}

const cmd = new Command('create')
  .description('Create a shipping zone with countries and rates')
  .option('-n, --name <string>', 'Zone name (required)')
  .option('-c, --countries <codes>', 'Country codes comma-separated (e.g., CN,US,JP)')
  .option('-p, --price <number>', 'Shipping price (required)')
  .option('--currency <string>', 'Currency code (default: CNY)')
  .option('--min-weight <number>', 'Minimum weight in kg (default: 0)')
  .option('--max-weight <number>', 'Maximum weight in kg (optional)')
  .option('--rate-name <string>', 'Rate name (default: Standard Shipping)')
  .option('--rate-type <string>', 'Rate type (default: weight_based)')
  .action(async (options: CreateZoneOptions) => {
    try {
      await createZone(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create zone for North America',
    '$ optima shipping-zone create \\',
    '  --name "North America" \\',
    '  --countries US,CA,MX \\',
    '  --price 15 \\',
    '  --currency USD',
    '',
    '# Create zone with weight limits',
    '$ optima shipping-zone create \\',
    '  --name "Asia Standard" \\',
    '  --countries CN,JP,KR \\',
    '  --price 10 \\',
    '  --min-weight 0 \\',
    '  --max-weight 5',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        zone_id: 'uuid',
        name: 'North America',
        countries: ['US', 'CA', 'MX'],
        rates: [{
          rate_id: 'uuid',
          name: 'Standard Shipping',
          price: '15.00',
          currency: 'USD',
          min_weight: 0,
          max_weight: null
        }]
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping-zone list', description: 'View all shipping zones' },
    { command: 'shipping-zone add-rate', description: 'Add more rates to zone' },
  ],
  notes: [
    'Name, countries, and price are required',
    'Country codes use ISO 3166-1 alpha-2 format (e.g., US, CN, JP)',
    'Weight limits help calculate accurate shipping costs',
  ]
});

export const createZoneCommand = cmd;

async function createZone(options: CreateZoneOptions) {
  let { name, countries, price, currency, minWeight, maxWeight, rateName, rateType } = options;

  // 交互式填写必填字段
  const questions: any[] = [];

  if (!name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: '区域名称:',
      validate: (input: string) => input.trim().length > 0 || '名称不能为空',
    });
  }

  if (!countries) {
    questions.push({
      type: 'input',
      name: 'countries',
      message: '国家代码（逗号分隔，如 CN,US,JP）:',
      validate: (input: string) => input.trim().length > 0 || '国家代码不能为空',
    });
  }

  if (!price) {
    questions.push({
      type: 'input',
      name: 'price',
      message: '运费价格:',
      validate: (input: string) => {
        const num = parseFloat(input);
        return !isNaN(num) && num >= 0 ? true : '请输入有效的价格';
      },
    });
  }

  if (!currency) {
    questions.push({
      type: 'input',
      name: 'currency',
      message: '货币代码（如 CNY, USD）:',
      default: 'CNY',
    });
  }

  if (questions.length > 0) {
    const answers = await inquirer.prompt(questions);
    name = name || answers.name;
    countries = countries || answers.countries;
    price = price || answers.price;
    currency = currency || answers.currency;
  }

  const spinner = output.spinner('正在创建运费区域...');

  try {
    // 构建 countries 数组（对象格式）
    const countriesArray = countries!.split(',').map((c) => ({
      country_code: c.trim().toUpperCase(),
    }));

    // 构建 rates 数组
    const rates = [
      {
        name: rateName || '标准运费',
        rate_type: rateType || 'weight_based',
        min_weight: minWeight ? parseFloat(minWeight) : 0,
        ...(maxWeight && { max_weight: parseFloat(maxWeight) }),
        price: parseFloat(price!),
        currency: currency || 'CNY',
      },
    ];

    const zone = await commerceApi.shippingFixed.createZone({
      name: name!,
      countries: countriesArray,
      rates,
    } as any);

    spinner.succeed('运费区域创建成功！');

    if (output.isJson()) {
      output.success({
        zone_id: zone.id,
        name: name,
        countries: countriesArray.map((c) => c.country_code),
        rate: rates[0]
      });
    } else {
      console.log();
      console.log(chalk.gray('区域 ID: ') + chalk.cyan(zone.id));
      console.log(chalk.gray('名称: ') + chalk.white(name));
      console.log(chalk.gray('国家: ') + chalk.white(countriesArray.map((c) => c.country_code).join(', ')));
      console.log(chalk.gray('运费: ') + chalk.white(`${price} ${currency || 'CNY'}`));
      if (rates[0].max_weight) {
        console.log(chalk.gray('重量范围: ') + chalk.white(`${rates[0].min_weight} - ${rates[0].max_weight} kg`));
      } else {
        console.log(chalk.gray('最小重量: ') + chalk.white(`${rates[0].min_weight} kg`));
      }
      console.log();
    }
  } catch (error: any) {
    spinner.fail('运费区域创建失败');
    throw createApiError(error);
  }
}
