import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

interface SetupMerchantOptions {
  name?: string;
  description?: string;
}

export const setupCommand = new Command('setup')
  .description('初始化商户资料（OAuth 用户首次使用）')
  .option('-n, --name <name>', '商户名称')
  .option('-d, --description <description>', '商户描述')
  .action(async (options: SetupMerchantOptions) => {
    try {
      await setupMerchant(options);
    } catch (error) {
      handleError(error);
    }
  });

async function setupMerchant(options: SetupMerchantOptions) {
  let merchantData: any = {};

  // 如果没有提供必需参数，进入交互式模式
  if (!options.name) {
    console.log(chalk.cyan('\n🏪 初始化商户资料\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '商户名称:',
        default: options.name,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return '商户名称不能为空';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: '商户描述 (可选):',
        default: options.description || '',
      },
    ]);

    merchantData = {
      name: answers.name.trim(),
      description: answers.description?.trim() || undefined,
    };
  } else {
    // 命令行参数模式
    merchantData = {
      name: options.name,
      description: options.description,
    };
  }

  const spinner = ora('正在初始化商户资料...').start();

  try {
    const merchant = await commerceApi.merchant.setupProfile(merchantData);
    spinner.succeed('商户资料初始化成功！');

    console.log();
    console.log(chalk.gray('商户 ID: ') + chalk.cyan(merchant.id || merchant.merchant_id || '-'));
    console.log(chalk.gray('商户名称: ') + chalk.cyan(merchant.name));

    if (merchant.description) {
      console.log(chalk.gray('商户描述: ') + merchant.description);
    }

    console.log();
    console.log(chalk.green('✓ 您现在可以开始使用 Optima CLI 管理您的店铺了！'));
    console.log();
  } catch (error: any) {
    spinner.fail('商户资料初始化失败');
    throw createApiError(error);
  }
}
