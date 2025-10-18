import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

export const infoCommand = new Command('info')
  .description('获取商户信息')
  .action(async () => {
    try {
      await getMerchantInfo();
    } catch (error) {
      handleError(error);
    }
  });

async function getMerchantInfo() {
  const spinner = ora('正在获取商户信息...').start();

  try {
    const merchant = await commerceApi.merchant.getProfile();
    spinner.stop();

    // 显示商户信息
    const separator = chalk.gray('─'.repeat(60));

    console.log();
    console.log(separator);
    console.log(chalk.cyan.bold('商户信息'));
    console.log(separator);

    console.log(`${chalk.gray('商户 ID:')}     ${merchant.id || merchant.merchant_id || '-'}`);
    console.log(`${chalk.gray('商户名称:')}   ${merchant.name || '-'}`);

    // 店铺链接（重要！）
    if (merchant.slug) {
      const storeUrl = `https://${merchant.slug}.optima.shop`;
      console.log(`${chalk.gray('店铺链接:')}   ${chalk.cyan.underline(storeUrl)}`);
    }

    if (merchant.email) {
      console.log(`${chalk.gray('邮箱:')}       ${merchant.email}`);
    }

    if (merchant.description) {
      console.log(`${chalk.gray('描述:')}       ${merchant.description}`);
    }

    if (merchant.logo_url) {
      console.log(`${chalk.gray('Logo URL:')}   ${chalk.cyan(merchant.logo_url)}`);
    }

    if (merchant.banner_url) {
      console.log(`${chalk.gray('Banner URL:')} ${chalk.cyan(merchant.banner_url)}`);
    }

    console.log(separator);
    console.log();
  } catch (error: any) {
    spinner.fail('获取商户信息失败');
    throw createApiError(error);
  }
}
