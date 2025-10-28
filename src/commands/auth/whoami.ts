import { Command } from 'commander';
import chalk from 'chalk';
import { isAuthenticated, getUser, getConfigPath } from '../../utils/config.js';
import { output } from '../../utils/output.js';

export const whoamiCommand = new Command('whoami')
  .description('显示当前登录用户信息')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        if (output.isJson()) {
          output.error('未登录，请先执行 optima auth login', 'AUTH_REQUIRED');
        } else {
          console.log(chalk.yellow('\n⚠️  未登录'));
          console.log(chalk.gray('   使用 ') + chalk.cyan('optima auth login') + chalk.gray(' 登录\n'));
          process.exit(1);
        }
        return;
      }

      const user = getUser();
      if (!user) {
        if (output.isJson()) {
          output.error('无法获取用户信息', 'USER_INFO_ERROR');
        } else {
          console.log(chalk.red('\n❌ 无法获取用户信息\n'));
          process.exit(1);
        }
        return;
      }

      if (output.isJson()) {
        // JSON 模式：输出结构化数据
        output.success({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          config_path: getConfigPath()
        });
      } else {
        // Pretty 模式：保持原有格式
        console.log(chalk.cyan('\n👤 当前用户\n'));
        console.log(chalk.white('用户信息:'));
        console.log(chalk.gray(`  邮箱: ${user.email}`));
        console.log(chalk.gray(`  姓名: ${user.name}`));
        console.log(chalk.gray(`  ID: ${user.id}`));
        console.log(chalk.gray(`  角色: ${user.role}`));
        console.log(chalk.white('\n配置文件:'));
        console.log(chalk.gray(`  ${getConfigPath()}\n`));
      }
    } catch (error: any) {
      if (output.isJson()) {
        output.error(error, 'WHOAMI_ERROR');
      } else {
        console.log(chalk.red(`\n❌ 获取用户信息失败: ${error.message}\n`));
        process.exit(1);
      }
    }
  });
