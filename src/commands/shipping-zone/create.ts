import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

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

export const createZoneCommand = new Command('create')
  .description('创建运费区域')
  .option('-n, --name <name>', '区域名称')
  .option('-c, --countries <countries>', '国家代码列表（逗号分隔，如 CN,US,JP）')
  .option('-p, --price <price>', '运费价格（必填）')
  .option('--currency <currency>', '货币代码（默认 CNY）')
  .option('--min-weight <weight>', '最小重量（kg，默认 0）')
  .option('--max-weight <weight>', '最大重量（kg，可选）')
  .option('--rate-name <name>', '费率名称（默认：标准运费）')
  .option('--rate-type <type>', '费率类型（默认：weight_based）')
  .action(async (options: CreateZoneOptions) => {
    try {
      await createZone(options);
    } catch (error) {
      handleError(error);
    }
  });

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

  const spinner = ora('正在创建运费区域...').start();

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
  } catch (error: any) {
    spinner.fail('运费区域创建失败');
    throw createApiError(error);
  }
}
