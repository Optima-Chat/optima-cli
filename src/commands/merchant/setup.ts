import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface SetupMerchantOptions {
  name?: string;
  description?: string;
  slug?: string;
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
  logoUrl?: string;
  bannerUrl?: string;
}

const cmd = new Command('setup')
  .description('Initialize merchant profile (first-time setup for OAuth users)')
  .option('-n, --name <name>', '商户名称')
  .option('-d, --description <description>', '商户描述')
  .option('--slug <slug>', '店铺唯一标识（URL slug）')
  .option('--default-currency <currency>', '默认货币（默认: USD）')
  .option('--origin-country-alpha2 <code>', '发货国家代码（如: CN, US, HK）')
  .option('--origin-city <city>', '发货城市')
  .option('--origin-postal-code <code>', '发货邮政编码')
  .option('--origin-line-1 <address>', '发货地址第一行')
  .option('--origin-line-2 <address>', '发货地址第二行（可选）')
  .option('--origin-state <state>', '发货省/州')
  .option('--contact-name <name>', '联系人姓名')
  .option('--contact-phone <phone>', '联系电话')
  .option('--contact-email <email>', '联系邮箱')
  .option('--company-name <name>', '公司名称（可选）')
  .option('--logo-url <url>', 'Logo 图片 URL（可选）')
  .option('--banner-url <url>', 'Banner 图片 URL（可选）')
  .action(async (options: SetupMerchantOptions) => {
    try {
      await setupMerchant(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Initialize merchant profile',
    '$ optima merchant setup \\',
    '  --name "My Store" \\',
    '  --slug "my-store" \\',
    '  --origin-country-alpha2 CN \\',
    '  --origin-city "Shanghai"',
    '',
    '# Setup with contact info',
    '$ optima merchant setup \\',
    '  --name "Tech Store" \\',
    '  --contact-email "support@example.com" \\',
    '  --contact-phone "+1-555-0100"',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        merchant_id: 'uuid',
        name: 'My Store',
        slug: 'my-store',
        default_currency: 'USD',
        origin_country: 'CN',
        origin_city: 'Shanghai'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'merchant info', description: 'View current profile' },
    { command: 'merchant update', description: 'Update profile later' },
    { command: 'merchant url', description: 'Get store URL' },
  ],
  notes: [
    'First-time setup for OAuth authenticated users',
    'Name, slug, and origin address are required',
    'Slug becomes your store URL: {slug}.optima.shop',
    'Can update profile later with merchant update',
  ]
});

export const setupCommand = cmd;

async function setupMerchant(options: SetupMerchantOptions) {
  let merchantData: any = {};

  // 检查是否所有必填字段都已提供
  const hasAllRequired =
    options.name &&
    options.originCountryAlpha2 &&
    options.originCity &&
    options.originLine1 &&
    options.originState &&
    options.contactName &&
    options.contactPhone &&
    options.contactEmail;

  // 如果没有提供所有必需参数，进入交互式模式
  if (!hasAllRequired) {
    console.log(chalk.cyan('\n🏪 初始化商户资料\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '商户名称:',
        default: options.name,
        validate: (input) => (input?.trim() ? true : '商户名称不能为空'),
      },
      {
        type: 'input',
        name: 'description',
        message: '商户描述 (可选):',
        default: options.description || '',
      },
      {
        type: 'input',
        name: 'origin_country_alpha2',
        message: '发货国家代码 (如 CN, US, HK):',
        default: options.originCountryAlpha2,
        validate: (input) => (input?.trim().length === 2 ? true : '请输入2位国家代码'),
      },
      {
        type: 'input',
        name: 'origin_city',
        message: '发货城市:',
        default: options.originCity,
        validate: (input) => (input?.trim() ? true : '城市不能为空'),
      },
      {
        type: 'input',
        name: 'origin_state',
        message: '发货省/州:',
        default: options.originState,
        validate: (input) => (input?.trim() ? true : '省/州不能为空'),
      },
      {
        type: 'input',
        name: 'origin_line_1',
        message: '发货地址第一行:',
        default: options.originLine1,
        validate: (input) => (input?.trim() ? true : '地址不能为空'),
      },
      {
        type: 'input',
        name: 'origin_line_2',
        message: '发货地址第二行 (可选):',
        default: options.originLine2 || '',
      },
      {
        type: 'input',
        name: 'origin_postal_code',
        message: '邮政编码 (可选):',
        default: options.originPostalCode || '',
      },
      {
        type: 'input',
        name: 'contact_name',
        message: '联系人姓名:',
        default: options.contactName,
        validate: (input) => (input?.trim() ? true : '联系人姓名不能为空'),
      },
      {
        type: 'input',
        name: 'contact_phone',
        message: '联系电话:',
        default: options.contactPhone,
        validate: (input) => (input?.trim() ? true : '联系电话不能为空'),
      },
      {
        type: 'input',
        name: 'contact_email',
        message: '联系邮箱:',
        default: options.contactEmail,
        validate: (input) => (input?.includes('@') ? true : '请输入有效的邮箱地址'),
      },
    ]);

    merchantData = {
      name: answers.name.trim(),
      description: answers.description?.trim() || undefined,
      origin_country_alpha2: answers.origin_country_alpha2.trim().toUpperCase(),
      origin_city: answers.origin_city.trim(),
      origin_state: answers.origin_state.trim(),
      origin_line_1: answers.origin_line_1.trim(),
      origin_line_2: answers.origin_line_2?.trim() || undefined,
      origin_postal_code: answers.origin_postal_code?.trim() || undefined,
      contact_name: answers.contact_name.trim(),
      contact_phone: answers.contact_phone.trim(),
      contact_email: answers.contact_email.trim(),
    };
  } else {
    // 命令行参数模式 - 转换 camelCase 到 snake_case
    merchantData = {
      name: options.name,
      description: options.description,
      slug: options.slug,
      default_currency: options.defaultCurrency || 'USD',
      origin_country_alpha2: options.originCountryAlpha2!.toUpperCase(),
      origin_city: options.originCity!,
      origin_postal_code: options.originPostalCode,
      origin_line_1: options.originLine1!,
      origin_line_2: options.originLine2,
      origin_state: options.originState!,
      contact_name: options.contactName!,
      contact_phone: options.contactPhone!,
      contact_email: options.contactEmail!,
      company_name: options.companyName,
      logo_url: options.logoUrl,
      banner_url: options.bannerUrl,
    };
  }

  const spinner = output.spinner('正在初始化商户资料...');

  try {
    const merchant = await commerceApi.merchant.setupProfile(merchantData);
    spinner.succeed('商户资料初始化成功！');

    if (output.isJson()) {
      output.success({
        merchant_id: merchant.id || merchant.merchant_id,
        name: merchant.name,
        ...(merchant.description && { description: merchant.description })
      });
    } else {
      console.log();
      console.log(chalk.gray('商户 ID: ') + chalk.cyan(merchant.id || merchant.merchant_id || '-'));
      console.log(chalk.gray('商户名称: ') + chalk.cyan(merchant.name));

      if (merchant.description) {
        console.log(chalk.gray('商户描述: ') + merchant.description);
      }

      console.log();
      console.log(chalk.green('✓ 您现在可以开始使用 Optima CLI 管理您的店铺了！'));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('商户资料初始化失败');
    throw createApiError(error);
  }
}
