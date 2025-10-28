import { Command } from 'commander';
import chalk from 'chalk';
import open from 'open';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('url')
  .description('Get public store URL and optionally open in browser')
  .option('--open', 'Open store homepage in browser')
  .action(async (options) => {
    try {
      await getStoreUrl(options.open);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get store URL',
    '$ optima merchant url',
    '',
    '# Open store in browser',
    '$ optima merchant url --open',
  ],
  output: {
    description: 'Returns public storefront URL',
    example: JSON.stringify({
      success: true,
      data: {
        url: 'https://my-store.optima.shop',
        slug: 'my-store',
        opened: false
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'merchant info', description: 'View merchant details' },
    { command: 'merchant setup', description: 'Initialize store slug' },
    { command: 'product url', description: 'Get product URLs' },
  ],
  notes: [
    'Merchant must have a slug configured',
    'URL format: https://{slug}.optima.shop',
    'Use --open to automatically open in browser',
  ]
});

export const urlCommand = cmd;

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
