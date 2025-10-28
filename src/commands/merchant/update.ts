import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface UpdateMerchantOptions {
  name?: string;
  slug?: string;
  description?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  defaultCurrency?: string;
  originCountryAlpha2?: string;
  originCity?: string;
  originPostalCode?: string;
  originLine1?: string;
  originLine2?: string;
  originState?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  companyName?: string;
}

export const updateCommand = new Command('update')
  .description('更新商户资料')
  .option('-n, --name <name>', '商户名称')
  .option('-s, --slug <slug>', '店铺 URL 标识符（用于 https://<slug>.optima.shop）')
  .option('-d, --description <description>', '商户描述')
  .option('-e, --email <email>', '邮箱')
  .option('--logo-url <url>', 'Logo URL')
  .option('--banner-url <url>', 'Banner URL')
  .option('--default-currency <currency>', '默认货币')
  .option('--origin-country-alpha2 <code>', '发货国家代码（如: CN, US, HK）')
  .option('--origin-city <city>', '发货城市')
  .option('--origin-postal-code <code>', '发货邮政编码')
  .option('--origin-line-1 <address>', '发货地址第一行')
  .option('--origin-line-2 <address>', '发货地址第二行')
  .option('--origin-state <state>', '发货省/州')
  .option('--contact-name <name>', '联系人姓名')
  .option('--contact-phone <phone>', '联系电话')
  .option('--contact-email <email>', '联系邮箱')
  .option('--company-name <name>', '公司名称')
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
    options.bannerUrl ||
    options.defaultCurrency ||
    options.originCountryAlpha2 ||
    options.originCity ||
    options.originPostalCode ||
    options.originLine1 ||
    options.originLine2 ||
    options.originState ||
    options.contactName ||
    options.contactPhone ||
    options.contactEmail ||
    options.companyName
  );

  if (!hasUpdates) {
    throw new ValidationError('请至少提供一个要更新的字段');
  }

  // 构造更新数据（转换 camelCase 到 snake_case）
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

  if (options.defaultCurrency) {
    updateData.default_currency = options.defaultCurrency;
  }

  if (options.originCountryAlpha2) {
    updateData.origin_country_alpha2 = options.originCountryAlpha2.toUpperCase();
  }

  if (options.originCity) {
    updateData.origin_city = options.originCity;
  }

  if (options.originPostalCode !== undefined) {
    updateData.origin_postal_code = options.originPostalCode;
  }

  if (options.originLine1) {
    updateData.origin_line_1 = options.originLine1;
  }

  if (options.originLine2 !== undefined) {
    updateData.origin_line_2 = options.originLine2;
  }

  if (options.originState) {
    updateData.origin_state = options.originState;
  }

  if (options.contactName) {
    updateData.contact_name = options.contactName;
  }

  if (options.contactPhone) {
    updateData.contact_phone = options.contactPhone;
  }

  if (options.contactEmail) {
    updateData.contact_email = options.contactEmail;
  }

  if (options.companyName !== undefined) {
    updateData.company_name = options.companyName;
  }

  const spinner = output.spinner('正在更新商户资料...');

  try {
    const merchant = await commerceApi.merchant.updateProfile(updateData);
    spinner.succeed('商户资料更新成功！');

    if (output.isJson()) {
      output.success({
        merchant_id: merchant.id,
        updated_fields: Object.keys(updateData),
        merchant: merchant
      });
    } else {
      console.log();
      console.log(chalk.gray('商户名称: ') + chalk.cyan(merchant.name || '-'));

      if (merchant.slug) {
        console.log(chalk.gray('店铺链接: ') + chalk.cyan.underline(`https://${merchant.slug}.optima.shop`));
      }

      if (merchant.description) {
        console.log(chalk.gray('商户描述: ') + merchant.description);
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('商户资料更新失败');
    throw createApiError(error);
  }
}
