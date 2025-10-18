import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface UpdateMerchantOptions {
  name?: string;
  slug?: string;
  description?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export const updateCommand = new Command('update')
  .description('更新商户资料')
  .option('-n, --name <name>', '商户名称')
  .option('-s, --slug <slug>', '店铺 URL 标识符（用于 https://<slug>.optima.shop）')
  .option('-d, --description <description>', '商户描述')
  .option('-e, --email <email>', '邮箱')
  .option('--logo-url <url>', 'Logo URL')
  .option('--banner-url <url>', 'Banner URL')
  .action(async (options: UpdateMerchantOptions) => {
    try {
      await updateMerchant(options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateMerchant(options: UpdateMerchantOptions) {
  // 检查是否提供了至少一个更新字段
  const hasUpdates = !!(
    options.name ||
    options.slug ||
    options.description !== undefined ||
    options.email ||
    options.logoUrl ||
    options.bannerUrl
  );

  if (!hasUpdates) {
    throw new ValidationError('请至少提供一个要更新的字段');
  }

  // 构造更新数据
  const updateData: any = {};

  if (options.name) {
    updateData.name = options.name;
  }

  if (options.slug) {
    updateData.slug = options.slug;
  }

  if (options.description !== undefined) {
    updateData.description = options.description;
  }

  if (options.email) {
    updateData.email = options.email;
  }

  if (options.logoUrl) {
    updateData.logo_url = options.logoUrl;
  }

  if (options.bannerUrl) {
    updateData.banner_url = options.bannerUrl;
  }

  const spinner = ora('正在更新商户资料...').start();

  try {
    const merchant = await commerceApi.merchant.updateProfile(updateData);
    spinner.succeed('商户资料更新成功！');

    console.log();
    console.log(chalk.gray('商户名称: ') + chalk.cyan(merchant.name || '-'));

    if (merchant.slug) {
      console.log(chalk.gray('店铺链接: ') + chalk.cyan.underline(`https://${merchant.slug}.optima.shop`));
    }

    if (merchant.description) {
      console.log(chalk.gray('商户描述: ') + merchant.description);
    }

    console.log();
  } catch (error: any) {
    spinner.fail('商户资料更新失败');
    throw createApiError(error);
  }
}
