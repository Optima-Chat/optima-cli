import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface UpdateStockOptions {
  quantity?: string;
}

export const updateStockCommand = new Command('update')
  .description('更新商品库存')
  .argument('<product-id>', '商品 ID')
  .option('-q, --quantity <number>', '库存数量')
  .action(async (productId: string, options: UpdateStockOptions) => {
    try {
      await updateStock(productId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateStock(productId: string, options: UpdateStockOptions) {
  // 验证参数
  if (!productId || productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  let quantity: number;

  if (!options.quantity) {
    // 交互式模式
    console.log(chalk.cyan(`\n📦 更新商品库存: ${productId}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'quantity',
        message: '新库存数量:',
        validate: (input) => {
          const qty = parseInt(input, 10);
          if (isNaN(qty) || qty < 0) {
            return '库存数量必须是大于等于 0 的整数';
          }
          return true;
        },
      },
    ]);

    quantity = parseInt(answers.quantity, 10);
  } else {
    quantity = parseInt(options.quantity, 10);

    // 验证数量
    if (isNaN(quantity) || quantity < 0) {
      throw new ValidationError('库存数量必须是大于等于 0 的整数', 'quantity');
    }
  }

  const spinner = ora('正在更新库存...').start();

  try {
    await commerceApi.inventory.updateStock(productId, quantity, 'Manual adjustment via CLI');
    spinner.succeed('库存更新成功！');

    console.log();
    console.log(chalk.gray('商品 ID: ') + chalk.cyan(productId));
    console.log(chalk.gray('新库存数量: ') + chalk.green(quantity.toString()));
    console.log();
  } catch (error: any) {
    spinner.fail('库存更新失败');
    throw createApiError(error);
  }
}
