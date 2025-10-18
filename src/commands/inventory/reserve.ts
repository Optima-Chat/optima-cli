import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface ReserveOptions {
  quantity?: string;
}

export const reserveStockCommand = new Command('reserve')
  .description('预留库存')
  .argument('<product-id>', '商品 ID')
  .option('-q, --quantity <quantity>', '预留数量')
  .action(async (productId: string, options: ReserveOptions) => {
    try {
      await reserveStock(productId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function reserveStock(productId: string, options: ReserveOptions) {
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  let { quantity } = options;

  if (!quantity) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'quantity',
        message: '预留数量:',
        validate: (input) => {
          const num = parseInt(input);
          return !isNaN(num) && num > 0 ? true : '数量必须是正整数';
        },
      },
    ]);
    quantity = answers.quantity;
  }

  if (!quantity) {
    throw new ValidationError('预留数量不能为空', 'quantity');
  }

  const quantityNum = parseInt(quantity);
  if (isNaN(quantityNum) || quantityNum <= 0) {
    throw new ValidationError('预留数量必须是正整数', 'quantity');
  }

  const spinner = ora('正在预留库存...').start();

  try {
    await commerceApi.inventory.reserveStock(productId.toString(), quantityNum);
    spinner.succeed('库存预留成功！');

    console.log();
    console.log(chalk.gray('商品 ID: ') + chalk.cyan(productId));
    console.log(chalk.gray('预留数量: ') + chalk.green(quantityNum.toString()));
    console.log();
  } catch (error: any) {
    spinner.fail('库存预留失败');
    throw createApiError(error);
  }
}
