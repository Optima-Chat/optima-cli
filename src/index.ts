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
import { output } from './utils/output.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

const program = new Command();

program
  .name('optima')
  .description('用自然语言管理电商店铺 - 专为 Claude Code 设计')
  .version(VERSION)
  .option('--json', '输出 JSON 格式（AI 友好）')
  .option('--pretty', '输出表格格式（人类可读）')
  .addHelpText('after', `
Output Formats:
  All 72 commands support two output formats:

  --json    JSON format (default) - Machine-readable, AI-friendly
            Returns: { success: true, data: {...} }

  --pretty  Pretty format - Human-readable with colors and tables
            Use for terminal viewing

  Environment: Set OPTIMA_CLI_FORMAT=pretty to change default

Authentication:
  Most commands require authentication. Two methods:

  1. OAuth Login (Recommended):
     $ optima auth login

  2. Environment Variable (CI/CD, Containers):
     $ export OPTIMA_TOKEN=your_access_token
     $ optima product list

  Priority: OPTIMA_TOKEN env var > config file

Backend Configuration:
  Override API endpoints for development/testing:

  OPTIMA_API_URL       Commerce API (default: https://api.optima.shop)
  OPTIMA_AUTH_URL      Auth API (default: https://auth.optima.shop)

Examples:
  # Login and view merchant info
  $ optima auth login
  $ optima merchant info

  # Create a product with JSON output
  $ optima product create --title "Ceramic Mug" --price 29.99 --json

  # List orders in human-readable format
  $ optima order list --pretty

  # Use custom backend (development)
  $ OPTIMA_API_URL=http://localhost:8000 optima product list

Getting Help:
  $ optima --help                    # List all modules
  $ optima product --help            # List product commands
  $ optima product create --help     # Detailed command help

Documentation:
  GitHub: https://github.com/Optima-Chat/optima-cli
  Website: https://optima.shop
`);

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

// 初始化输出管理器（必须在 parse() 后调用）
output.init(program.opts());
