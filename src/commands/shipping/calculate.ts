import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatPrice } from '../../utils/format.js';

interface CalculateShippingOptions {
  country?: string;
  postalCode?: string;
  weight?: string;
}

export const calculateCommand = new Command('calculate')
  .description('计算运费')
  .option('-c, --country <code>', '国家代码（如 US, CN）')
  .option('-p, --postal-code <code>', '邮政编码')
  .option('-w, --weight <kg>', '重量（千克）')
  .action(async (options: CalculateShippingOptions) => {
    try {
      await calculateShipping(options);
    } catch (error) {
      handleError(error);
    }
  });

async function calculateShipping(options: CalculateShippingOptions) {
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

    shippingData = {
      country: answers.country.trim().toUpperCase(),
      postal_code: answers.postalCode?.trim() || undefined,
      weight: parseFloat(answers.weight),
    };
  } else {
    // 命令行参数模式
    const weight = parseFloat(options.weight);

    // 验证重量
    if (isNaN(weight) || weight <= 0) {
      throw new ValidationError('重量必须是大于 0 的数字', 'weight');
    }

    shippingData = {
      country: options.country.toUpperCase(),
      postal_code: options.postalCode,
      weight,
    };
  }

  const spinner = ora('正在计算运费...').start();

  try {
    const result = await commerceApi.shippingFixed.calculate(shippingData);
    spinner.succeed('运费计算成功！');

    console.log();
    console.log(chalk.gray('目的地: ') + chalk.cyan(shippingData.country));
    console.log(chalk.gray('重量: ') + chalk.cyan(`${shippingData.weight} kg`));
    console.log(chalk.gray('运费: ') + chalk.green(formatPrice(result.shipping_cost, result.currency)));
    console.log();
  } catch (error: any) {
    spinner.fail('运费计算失败');
    throw createApiError(error);
  }
}
