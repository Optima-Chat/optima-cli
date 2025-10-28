import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

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
  const spinner = output.spinner('正在获取店铺信息...');

  try {
    const merchant = await commerceApi.merchant.getProfile();
    spinner.succeed('店铺信息获取成功');

    if (!merchant.slug) {
      if (output.isJson()) {
        output.error(new Error('店铺 slug 未设置'), 'SLUG_NOT_SET');
      } else {
        console.log(chalk.yellow('\n⚠️  店铺 slug 未设置\n'));
      }
      return;
    }

    const storeUrl = `https://${merchant.slug}.optima.shop`;

    // 如果指定了 --open，在浏览器中打开
    if (shouldOpen) {
      try {
        await open(storeUrl);
      } catch (error) {
        // 静默失败
      }
    }

    if (output.isJson()) {
      output.success({
        url: storeUrl,
        slug: merchant.slug,
        opened: shouldOpen
      });
    } else {
      // 只输出链接（方便脚本使用）
      console.log(storeUrl);

      if (shouldOpen) {
        console.log(chalk.gray('\n已在浏览器中打开店铺\n'));
      }
    }
  } catch (error: any) {
    spinner.fail('获取店铺信息失败');
    throw createApiError(error);
  }
}
