import { Command } from 'commander';
import chalk from 'chalk';
import { isAuthenticated, getUser, getConfigPath } from '../../utils/config.js';

export const whoamiCommand = new Command('whoami')
  .description('显示当前登录用户信息')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        console.log(chalk.yellow('\n⚠️  未登录'));
        console.log(chalk.gray('   使用 ') + chalk.cyan('optima auth login') + chalk.gray(' 登录\n'));
        return;
      }

      const user = getUser();
      if (!user) {
        console.log(chalk.red('\n❌ 无法获取用户信息\n'));
        return;
      }

      console.log(chalk.cyan('\n👤 当前用户\n'));
      console.log(chalk.white('用户信息:'));
      console.log(chalk.gray(`  邮箱: ${user.email}`));
      console.log(chalk.gray(`  姓名: ${user.name}`));
      console.log(chalk.gray(`  ID: ${user.id}`));
      console.log(chalk.gray(`  角色: ${user.role}`));
      console.log(chalk.white('\n配置文件:'));
      console.log(chalk.gray(`  ${getConfigPath()}\n`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 获取用户信息失败: ${error.message}\n`));
    }
  });
