import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import open from 'open';
import { authApi } from '../../api/rest/auth.js';
import { saveTokens, saveUser, isAuthenticated, getUser } from '../../utils/config.js';

export const loginCommand = new Command('login')
  .description('Device Flow 登录（在浏览器中完成授权）')
  .action(async () => {
    try {
      // 检查是否已登录
      if (isAuthenticated()) {
        const user = getUser();
        console.log(chalk.yellow('\n⚠️  已登录'));
        console.log(chalk.gray(`   当前用户: ${user?.email}`));
        console.log(chalk.gray('   使用 ') + chalk.cyan('optima auth logout') + chalk.gray(' 退出登录\n'));
        return;
      }

      // 步骤 1: 请求 Device Code
      const spinner = ora('正在请求授权...').start();

      let deviceAuth;
      try {
        deviceAuth = await authApi.requestDeviceCode();
        spinner.stop();
      } catch (error: any) {
        spinner.fail(chalk.red('请求授权失败'));
        if (error.response?.data?.error_description) {
          console.log(chalk.red(`   错误: ${error.response.data.error_description}\n`));
        } else {
          console.log(chalk.red(`   错误: ${error.message}\n`));
        }
        return;
      }

      // 步骤 2: 显示授权信息
      console.log(chalk.cyan('\n✨ 请在浏览器中完成登录授权\n'));
      console.log(chalk.white('请访问: ') + chalk.green(deviceAuth.verification_uri));
      console.log(chalk.white('输入代码: ') + chalk.bold.yellow(deviceAuth.user_code));

      const expiresMinutes = Math.floor(deviceAuth.expires_in / 60);
      console.log(chalk.gray(`\n提示: 代码 ${expiresMinutes} 分钟内有效\n`));

      // 步骤 3: 自动打开浏览器
      try {
        await open(deviceAuth.verification_uri_complete || deviceAuth.verification_uri);
        console.log(chalk.gray('已在浏览器中打开授权页面...\n'));
      } catch (err) {
        // 静默失败，用户可以手动打开
      }

      // 步骤 4: 轮询获取 Token
      const pollSpinner = ora('等待授权中...').start();

      let result;
      try {
        result = await authApi.pollDeviceToken(
          deviceAuth.device_code,
          deviceAuth.interval,
          deviceAuth.expires_in
        );
      } catch (error: any) {
        pollSpinner.fail(chalk.red('授权失败'));
        console.log(chalk.red(`   错误: ${error.message}\n`));
        return;
      }

      pollSpinner.stop();

      // 步骤 5: 处理结果
      if (result.error) {
        // 处理各种错误
        switch (result.error) {
          case 'access_denied':
            console.log(chalk.red('\n❌ 您拒绝了授权请求\n'));
            break;
          case 'expired_token':
            console.log(chalk.red('\n❌ 授权码已过期'));
            console.log(chalk.gray('   请重新运行 ') + chalk.cyan('optima auth login\n'));
            break;
          default:
            console.log(chalk.red(`\n❌ 授权失败: ${result.error_description || result.error}\n`));
        }
        return;
      }

      // 步骤 6: 保存 Token 和用户信息
      if (!result.access_token || !result.refresh_token || !result.expires_in) {
        console.log(chalk.red('\n❌ 获取 token 失败\n'));
        return;
      }

      saveTokens(result.access_token, result.refresh_token, result.expires_in);

      // 获取用户信息
      let user;
      try {
        user = await authApi.getCurrentUser(result.access_token);
        saveUser(user);
      } catch (error: any) {
        console.log(chalk.yellow('\n⚠️  无法获取用户信息，但 token 已保存'));
        console.log(chalk.red(`   错误: ${error.message}`));
        if (error.response?.data) {
          console.log(chalk.red(`   详情: ${JSON.stringify(error.response.data)}`));
        }
        console.log(chalk.gray(`   API: GET /api/v1/users/me\n`));
        return;
      }

      // 步骤 7: 显示成功信息
      console.log(chalk.green('\n✓ 登录成功！\n'));
      console.log(chalk.white('👤 用户信息:'));
      console.log(chalk.gray(`   邮箱: ${user.email}`));
      console.log(chalk.gray(`   姓名: ${user.name}`));
      console.log(chalk.gray(`   角色: ${user.role}`));

      const tokenExpiresMinutes = Math.floor(result.expires_in / 60);
      console.log(chalk.gray(`   Token 有效期: ${tokenExpiresMinutes} 分钟`));

      console.log(chalk.gray('\n   运行 ') + chalk.cyan('optima --help') + chalk.gray(' 查看可用命令\n'));

    } catch (error: any) {
      console.log(chalk.red(`\n❌ 登录失败: ${error.message}\n`));
    }
  });
