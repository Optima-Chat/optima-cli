import { Command } from 'commander';
import chalk from 'chalk';
import {
  isAuthenticated,
  getTokenExpiresAt,
  isTokenExpired,
  ensureValidToken,
  saveTokens,
  getRefreshToken
} from '../../utils/config.js';

export const testRefreshCommand = new Command('test-refresh')
  .description('测试 Token 自动刷新功能')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        console.log(chalk.yellow('\n⚠️  未登录\n'));
        return;
      }

      const expiresAt = getTokenExpiresAt();
      const now = Date.now();
      const isExpired = isTokenExpired();

      console.log(chalk.cyan('\n📋 Token 状态\n'));
      console.log(chalk.white('过期时间: ') + chalk.gray(new Date(expiresAt!).toLocaleString()));
      console.log(chalk.white('当前时间: ') + chalk.gray(new Date(now).toLocaleString()));
      console.log(chalk.white('剩余时间: ') + chalk.gray(`${Math.floor((expiresAt! - now) / 1000)} 秒`));
      console.log(chalk.white('是否过期: ') + (isExpired ? chalk.red('是') : chalk.green('否')));

      // 强制让 token 过期（用于测试）
      console.log(chalk.yellow('\n⚠️  强制让 token 过期（用于测试刷新功能）...\n'));
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        saveTokens('expired-token', refreshToken, -100); // 设置为已过期
      }

      console.log(chalk.cyan('🔄 尝试获取有效 token（应该自动刷新）...\n'));
      const token = await ensureValidToken();

      if (token) {
        const newExpiresAt = getTokenExpiresAt();
        console.log(chalk.green('✓ Token 刷新成功！\n'));
        console.log(chalk.white('新 Token: ') + chalk.gray(token.substring(0, 20) + '...'));
        console.log(chalk.white('新过期时间: ') + chalk.gray(new Date(newExpiresAt!).toLocaleString()));
        console.log(chalk.white('剩余时间: ') + chalk.gray(`${Math.floor((newExpiresAt! - Date.now()) / 1000)} 秒\n`));
      } else {
        console.log(chalk.red('❌ Token 刷新失败\n'));
      }

    } catch (error: any) {
      console.log(chalk.red(`\n❌ 测试失败: ${error.message}\n`));
    }
  });
