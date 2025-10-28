import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface UpdateStockOptions {
  id?: string;
  quantity?: string;
}

export const updateStockCommand = new Command('update')
  .description('更新商品库存')
  .option('--id <id>', '商品 ID')
  .option('-q, --quantity <number>', '库存数量')
  .action(async (options: UpdateStockOptions) => {
    try {
      await updateStock(options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateStock(options: UpdateStockOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'id');
  }

  const productId = options.id;

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

  const spinner = output.spinner('正在更新库存...');

  try {
    await commerceApi.inventory.updateStock(productId, quantity, 'Manual adjustment via CLI');
    spinner.succeed('库存更新成功！');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        product_id: productId,
        quantity,
        note: 'Manual adjustment via CLI'
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log();
      console.log(chalk.gray('商品 ID: ') + chalk.cyan(productId));
      console.log(chalk.gray('新库存数量: ') + chalk.green(quantity.toString()));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('库存更新失败');
    throw createApiError(error);
  }
}
