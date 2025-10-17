#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('optima')
  .description('用自然语言管理电商店铺 - 专为 Claude Code 设计')
  .version('0.1.0');

program
  .command('version')
  .description('显示版本信息')
  .action(() => {
    console.log(chalk.cyan('Optima CLI v0.1.0'));
    console.log(chalk.gray('功能开发中，敬请期待...'));
  });

program.action(() => {
  console.log(chalk.cyan.bold('\n✨ Optima CLI v0.1.0\n'));
  console.log(chalk.white('用自然语言管理你的电商店铺\n'));
  console.log(chalk.yellow('📦 当前版本为占位版本，核心功能正在开发中'));
  console.log(chalk.gray('   预计 Phase 1 将于 2-3 周内完成\n'));
  console.log(chalk.white('📖 使用帮助:'));
  console.log(chalk.gray('   运行 ') + chalk.cyan('optima --help') + chalk.gray(' 查看可用命令\n'));
  console.log(chalk.white('🔗 了解更多:'));
  console.log(chalk.gray('   GitHub: https://github.com/Optima-Chat/optima-cli'));
  console.log(chalk.gray('   文档: https://optima.chat\n'));
});

program.parse();
