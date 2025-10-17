import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { clearConfig, isAuthenticated, getUser, getAccessToken } from '../../utils/config.js';
import { authApi } from '../../api/rest/auth.js';

export const logoutCommand = new Command('logout')
  .description('登出并清除本地凭证')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        console.log(chalk.yellow('\n⚠️  未登录\n'));
        return;
      }

      const user = getUser();
      const token = getAccessToken();

      // 尝试撤销 token
      if (token) {
        const spinner = ora('正在登出...').start();
        try {
          await authApi.logout(token);
          spinner.succeed(chalk.green('Token 已撤销'));
        } catch (error: any) {
          // 即使撤销失败，也继续清除本地配置
          spinner.warn(chalk.yellow('无法撤销 token，但本地凭证已清除'));
        }
      }

      clearConfig();

      console.log(chalk.green('\n✓ 已登出'));
      console.log(chalk.gray(`   账号: ${user?.email}`));
      console.log(chalk.gray('\n   使用 ') + chalk.cyan('optima auth login') + chalk.gray(' 重新登录\n'));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 登出失败: ${error.message}\n`));
    }
  });
