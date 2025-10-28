import { Command } from 'commander';
import chalk from 'chalk';
import { clearConfig, isAuthenticated, getUser, getAccessToken } from '../../utils/config.js';
import { authApi } from '../../api/rest/auth.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('logout')
  .description('Logout and clear local credentials')
  .action(async () => {
    try {
      if (!isAuthenticated()) {
        console.log(chalk.yellow('\n⚠️  未登录\n'));
        return;
      }

      const user = getUser();
      const token = getAccessToken();

      // 尝试撤销 token
      let tokenRevoked = false;
      if (token) {
        const spinner = output.spinner('正在登出...');
        try {
          await authApi.logout(token);
          spinner.succeed(chalk.green('Token 已撤销'));
          tokenRevoked = true;
        } catch (error: any) {
          // 即使撤销失败，也继续清除本地配置
          spinner.warn(chalk.yellow('无法撤销 token，但本地凭证已清除'));
        }
      }

      clearConfig();

      if (output.isJson()) {
        output.success({
          logged_out: true,
          token_revoked: tokenRevoked,
          email: user?.email
        });
      } else {
        console.log(chalk.green('\n✓ 已登出'));
        console.log(chalk.gray(`   账号: ${user?.email}`));
        console.log(chalk.gray('\n   使用 ') + chalk.cyan('optima auth login') + chalk.gray(' 重新登录\n'));
      }
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 登出失败: ${error.message}\n`));
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Logout from current session',
    '$ optima auth logout',
  ],
  output: {
    description: 'Revokes access token and clears local credentials',
    example: JSON.stringify({
      success: true,
      data: {
        logged_out: true,
        token_revoked: true,
        email: 'user@example.com'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'auth login', description: 'Login again' },
    { command: 'auth whoami', description: 'Check login status' },
  ],
  notes: [
    'Revokes access token on server',
    'Clears local credentials from ~/.config/optima-cli/',
    'Use "optima auth login" to login again',
  ]
});

export const logoutCommand = cmd;
