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
  .option('--zone-id <id>', '区域 ID')
  .action(async (options: { zoneId?: string }) => {
    try {
      if (!options.zoneId || options.zoneId.trim().length === 0) {
        throw new ValidationError('区域 ID 不能为空', 'zone-id');
      }

      const zoneId = options.zoneId;

      const spinner = ora('正在获取费率...').start();
      const rates = await commerceApi.shippingFixed.listRates(zoneId);
      spinner.succeed('费率获取成功');

      if (rates.length === 0) {
        console.log(chalk.yellow('\n该区域暂无费率配置\n'));
        return;
      }

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
    } catch (error) {
      handleError(error);
    }
  });

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

export const createRateCommand = new Command('add-rate')
  .description('添加运费费率')
  .option('--zone-id <id>', '区域 ID')
  .option('-n, --name <name>', '费率名称（如：标准快递）')
  .option('-t, --rate-type <type>', '费率类型（flat_rate/free/weight_based）', 'flat_rate')
  .option('-p, --price <price>', '运费价格')
  .option('-c, --currency <currency>', '货币代码（如 USD, HKD）', 'USD')
  .option('--min-amount <amount>', '免运费的最低订单金额')
  .option('--min-quantity <quantity>', '免运费的最低商品数量')
  .action(async (options: CreateRateOptions) => {
    try {
      await createRate(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createRate(options: CreateRateOptions) {
  if (!options.zoneId || options.zoneId.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'zone-id');
  }

  const zoneId = options.zoneId;

  let { name, rateType, price, currency, minAmount, minQuantity } = options;

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

  const spinner = ora('正在添加费率...').start();

  try {
    const data: any = {
      name: name!,
      rate_type: rateType || 'flat_rate',
      currency: currency || 'USD',
      base_cost: parseFloat(price!),
    };

    if (minAmount) data.min_order_amount = parseFloat(minAmount);
    if (minQuantity) data.min_quantity = parseInt(minQuantity);

    const rate = await commerceApi.shippingFixed.createRate(zoneId, data);
    spinner.succeed('费率添加成功！');

    console.log();
    console.log(chalk.gray('费率 ID: ') + chalk.cyan(rate.id));
    console.log(chalk.gray('名称: ') + name);
    console.log(chalk.gray('类型: ') + data.rate_type);
    console.log(chalk.gray('价格: ') + `${data.currency} ${data.base_cost}`);
    if (minAmount) console.log(chalk.gray('免运费阈值: ') + `${data.currency} ${data.min_order_amount}`);
    console.log();
  } catch (error: any) {
    spinner.fail('费率添加失败');
    throw createApiError(error);
  }
}
