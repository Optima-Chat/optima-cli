import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import open from 'open';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

export const urlCommand = new Command('url')
  .description('获取店铺链接')
  .option('--open', '在浏览器中打开店铺')
  .action(async (options) => {
    try {
      await getStoreUrl(options.open);
    } catch (error) {
      handleError(error);
    }
  });

async function getStoreUrl(shouldOpen: boolean) {
  const spinner = ora('正在获取店铺信息...').start();

  try {
    const merchant = await commerceApi.merchant.getProfile();
    spinner.stop();

    if (!merchant.slug) {
      console.log(chalk.yellow('\n⚠️  店铺 slug 未设置\n'));
      return;
    }

    const storeUrl = `https://${merchant.slug}.optima.shop`;

    // 只输出链接（方便脚本使用）
    console.log(storeUrl);

    // 如果指定了 --open，在浏览器中打开
    if (shouldOpen) {
      try {
        await open(storeUrl);
        console.log(chalk.gray('\n已在浏览器中打开店铺\n'));
      } catch (error) {
        console.log(chalk.yellow(`\n⚠️  无法自动打开浏览器，请手动访问: ${storeUrl}\n`));
      }
    }
  } catch (error: any) {
    spinner.fail('获取店铺信息失败');
    throw createApiError(error);
  }
}
