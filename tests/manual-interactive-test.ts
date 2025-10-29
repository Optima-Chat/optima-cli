#!/usr/bin/env tsx

/**
 * 手动测试交互式环境检测
 *
 * 使用方法：
 * 1. 终端测试: tsx tests/manual-interactive-test.ts
 * 2. CI 模拟:   CI=true tsx tests/manual-interactive-test.ts
 * 3. AI 模拟:   echo "" | tsx tests/manual-interactive-test.ts
 * 4. 强制启用:  CI=true OPTIMA_INTERACTIVE=1 tsx tests/manual-interactive-test.ts
 */

import { isInteractiveEnvironment, requireParam, requireNumberParam } from '../src/utils/interactive.js';
import chalk from 'chalk';

console.log(chalk.cyan('\n=== 交互式环境检测测试 ===\n'));

// 显示当前环境信息
console.log(chalk.gray('环境信息:'));
console.log(chalk.gray(`  process.stdin.isTTY: ${process.stdin.isTTY}`));
console.log(chalk.gray(`  CI: ${process.env.CI || '(未设置)'}`));
console.log(chalk.gray(`  NON_INTERACTIVE: ${process.env.NON_INTERACTIVE || '(未设置)'}`));
console.log(chalk.gray(`  OPTIMA_INTERACTIVE: ${process.env.OPTIMA_INTERACTIVE || '(未设置)'}`));
console.log();

// 测试 isInteractiveEnvironment()
const isInteractive = isInteractiveEnvironment();
console.log(chalk.bold('检测结果:'));
if (isInteractive) {
    console.log(chalk.green('✓ 交互式环境 - 可以使用 inquirer.prompt()'));
} else {
    console.log(chalk.yellow('✗ 非交互式环境 - 应该抛出 ValidationError'));
}
console.log();

// 测试 requireParam()
console.log(chalk.bold('测试 requireParam():'));
try {
    requireParam(undefined, 'title', '商品名称');
    console.log(chalk.red('  ✗ 应该抛出 ValidationError'));
} catch (error: any) {
    console.log(chalk.green(`  ✓ 正确抛出错误: ${error.message}`));
}
console.log();

// 测试 requireNumberParam()
console.log(chalk.bold('测试 requireNumberParam():'));

// 测试有效数字
try {
    const price = requireNumberParam('99.99', 'price', '商品价格', 0.01);
    console.log(chalk.green(`  ✓ 有效数字解析成功: ${price}`));
} catch (error: any) {
    console.log(chalk.red(`  ✗ 不应该抛出错误: ${error.message}`));
}

// 测试无效数字
try {
    requireNumberParam('abc', 'price', '商品价格', 0.01);
    console.log(chalk.red('  ✗ 应该抛出 ValidationError'));
} catch (error: any) {
    console.log(chalk.green(`  ✓ 正确拒绝无效数字: ${error.message}`));
}

// 测试最小值验证
try {
    requireNumberParam('0.001', 'price', '商品价格', 0.01);
    console.log(chalk.red('  ✗ 应该抛出 ValidationError (低于最小值)'));
} catch (error: any) {
    console.log(chalk.green(`  ✓ 正确拒绝过小值: ${error.message}`));
}

console.log(chalk.cyan('\n=== 测试完成 ===\n'));
