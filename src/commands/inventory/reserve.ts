import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface ReserveOptions {
  id?: string;
  quantity?: string;
}

const cmd = new Command('reserve')
  .description('Reserve inventory for pending orders or events')
  .option('--id <id>', 'Product ID (required)')
  .option('-q, --quantity <quantity>', 'Quantity to reserve (required)')
  .action(async (options: ReserveOptions) => {
    try {
      await reserveStock(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Reserve stock for pending order',
    '$ optima inventory reserve --id prod-123 --quantity 10',
    '',
    '# Reserve stock interactively',
    '$ optima inventory reserve --id prod-456',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        reserved_quantity: 10
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'inventory update', description: 'Update available stock' },
    { command: 'inventory history', description: 'View reserve history' },
    { command: 'product get', description: 'Check current stock level' },
  ],
  notes: [
    'Product ID and quantity are required',
    'Reserves reduce available stock but not total inventory',
    'Typically used for cart items or pending orders',
    'Interactive mode prompts for quantity if not provided',
  ]
});

export const reserveStockCommand = cmd;

async function reserveStock(options: ReserveOptions) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'id');
  }

  const productId = options.id;

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

  const spinner = output.spinner('正在预留库存...');

  try {
    await commerceApi.inventory.reserveStock(productId.toString(), quantityNum);
    spinner.succeed('库存预留成功！');

    if (output.isJson()) {
      output.success({
        product_id: productId,
        reserved_quantity: quantityNum
      });
    } else {
      console.log();
      console.log(chalk.gray('商品 ID: ') + chalk.cyan(productId));
      console.log(chalk.gray('预留数量: ') + chalk.green(quantityNum.toString()));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('库存预留失败');
    throw createApiError(error);
  }
}
