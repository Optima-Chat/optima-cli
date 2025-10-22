#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authCommand } from './commands/auth/index.js';
import { cleanupCommand } from './commands/cleanup.js';
import { initCommand } from './commands/init.js';
import { productCommand } from './commands/product/index.js';
import { orderCommand } from './commands/order/index.js';
import { inventoryCommand } from './commands/inventory/index.js';
import { merchantCommand } from './commands/merchant/index.js';
import { shippingCommand } from './commands/shipping/index.js';
import { categoryCommand } from './commands/category/index.js';
import { variantCommand } from './commands/variant/index.js';
import { refundCommand } from './commands/refund/index.js';
import { uploadCommand } from './commands/upload/index.js';
import { conversationCommand } from './commands/conversation/index.js';
import { transferCommand } from './commands/transfer/index.js';
import { shippingZoneCommand } from './commands/shipping-zone/index.js';
import { i18nCommand } from './commands/i18n/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

const program = new Command();

program
  .name('optima')
  .description('用自然语言管理电商店铺 - 专为 Claude Code 设计')
  .version(VERSION);

// 注册命令
program.addCommand(authCommand);
program.addCommand(cleanupCommand);
program.addCommand(initCommand);
program.addCommand(productCommand);
program.addCommand(categoryCommand);
program.addCommand(variantCommand);
program.addCommand(orderCommand);
program.addCommand(refundCommand);
program.addCommand(inventoryCommand);
program.addCommand(merchantCommand);
program.addCommand(shippingCommand);
program.addCommand(uploadCommand);
program.addCommand(conversationCommand);
program.addCommand(transferCommand);
program.addCommand(shippingZoneCommand);
program.addCommand(i18nCommand);

program
  .command('version')
  .description('显示版本信息')
  .action(() => {
    console.log(chalk.cyan(`Optima CLI v${VERSION}`));
    console.log(chalk.gray('14 个模块，72 个命令，完整电商管理功能'));
  });

program.action(() => {
  console.log(chalk.cyan.bold(`\n✨ Optima CLI v${VERSION}\n`));
  console.log(chalk.white('用自然语言管理你的电商店铺 - 专为 Claude Code 设计\n'));
  console.log(chalk.green('✅ 已提供 14 个模块、72 个命令'));
  console.log(chalk.gray('   覆盖商品、订单、库存、物流、国际化等完整功能\n'));
  console.log(chalk.white('🚀 快速开始:'));
  console.log(chalk.gray('   1. 登录: ') + chalk.cyan('optima auth login'));
  console.log(chalk.gray('   2. 查看商户信息: ') + chalk.cyan('optima merchant info'));
  console.log(chalk.gray('   3. 创建商品: ') + chalk.cyan('optima product create'));
  console.log(chalk.gray('   4. 查看所有命令: ') + chalk.cyan('optima --help') + chalk.gray('\n'));
  console.log(chalk.white('🔗 了解更多:'));
  console.log(chalk.gray('   GitHub: https://github.com/Optima-Chat/optima-cli'));
  console.log(chalk.gray('   文档: https://optima.chat\n'));
});

program.parse();
