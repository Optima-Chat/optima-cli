import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

// 列出费率
export const listRatesCommand = new Command('list-rates')
  .description('查看区域运费费率')
  .argument('<zone-id>', '区域 ID')
  .action(async (zoneId: string) => {
    try {
      if (!zoneId || zoneId.trim().length === 0) {
        throw new ValidationError('区域 ID 不能为空', 'zone-id');
      }

      const spinner = ora('正在获取费率...').start();
      const rates = await commerceApi.shippingFixed.listRates(zoneId);
      spinner.succeed('费率获取成功');

      if (rates.length === 0) {
        console.log(chalk.yellow('\n该区域暂无费率配置\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('条件'), chalk.cyan('价格'), chalk.cyan('免运费阈值')],
        colWidths: [38, 30, 15, 18],
      });

      rates.forEach((rate: any) => {
        const condition = rate.min_weight
          ? `≥${rate.min_weight}kg`
          : rate.min_order_amount
          ? `≥${rate.currency} ${rate.min_order_amount}`
          : '-';
        const price = `${rate.currency} ${rate.price}`;
        const freeThreshold = rate.free_shipping_threshold
          ? `${rate.currency} ${rate.free_shipping_threshold}`
          : '-';

        table.push([rate.id, condition, price, freeThreshold]);
      });

      console.log('\n' + table.toString() + '\n');
    } catch (error) {
      handleError(error);
    }
  });

// 添加费率
interface CreateRateOptions {
  price?: string;
  currency?: string;
  minWeight?: string;
  minAmount?: string;
  freeThreshold?: string;
}

export const createRateCommand = new Command('add-rate')
  .description('添加运费费率')
  .argument('<zone-id>', '区域 ID')
  .option('-p, --price <price>', '运费价格')
  .option('-c, --currency <currency>', '货币代码（如 USD, CNY）', 'USD')
  .option('--min-weight <weight>', '最小重量（kg）')
  .option('--min-amount <amount>', '最小订单金额')
  .option('--free-threshold <threshold>', '免运费阈值')
  .action(async (zoneId: string, options: CreateRateOptions) => {
    try {
      await createRate(zoneId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function createRate(zoneId: string, options: CreateRateOptions) {
  if (!zoneId || zoneId.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'zone-id');
  }

  let { price, currency, minWeight, minAmount, freeThreshold } = options;

  if (!price) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'price',
        message: '运费价格:',
        validate: (input) => {
          const num = parseFloat(input);
          return !isNaN(num) && num >= 0 ? true : '价格必须是非负数';
        },
      },
      {
        type: 'input',
        name: 'minWeight',
        message: '最小重量（kg，可选）:',
      },
      {
        type: 'input',
        name: 'freeThreshold',
        message: '免运费阈值（可选）:',
      },
    ]);

    price = answers.price;
    minWeight = minWeight || answers.minWeight;
    freeThreshold = freeThreshold || answers.freeThreshold;
  }

  const spinner = ora('正在添加费率...').start();

  try {
    const data: any = {
      price: parseFloat(price!),
      currency: currency || 'USD',
    };

    if (minWeight) data.min_weight = parseFloat(minWeight);
    if (minAmount) data.min_order_amount = parseFloat(minAmount);
    if (freeThreshold) data.free_shipping_threshold = parseFloat(freeThreshold);

    const rate = await commerceApi.shippingFixed.createRate(zoneId, data);
    spinner.succeed('费率添加成功！');

    console.log();
    console.log(chalk.gray('费率 ID: ') + chalk.cyan(rate.id));
    console.log(chalk.gray('价格: ') + `${data.currency} ${data.price}`);
    console.log();
  } catch (error: any) {
    spinner.fail('费率添加失败');
    throw createApiError(error);
  }
}
