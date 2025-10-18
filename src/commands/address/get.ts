import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const getAddressCommand = new Command('get')
  .description('地址详情')
  .argument('<address-id>', '地址 ID')
  .action(async (addressId: string) => {
    try {
      await getAddress(addressId);
    } catch (error) {
      handleError(error);
    }
  });

async function getAddress(addressId: string) {
  if (!addressId || addressId.trim().length === 0) {
    throw new ValidationError('地址 ID 不能为空', 'address-id');
  }

  const spinner = ora('正在获取地址详情...').start();

  try {
    const address = await commerceApi.addresses.get(addressId);
    spinner.succeed('地址详情获取成功');

    console.log('\n' + '─'.repeat(60));
    console.log(chalk.bold('地址详情'));
    console.log('─'.repeat(60));
    console.log(chalk.gray('地址 ID: ') + chalk.cyan(address.id));
    console.log(chalk.gray('收件人: ') + (address.recipient_name || '-'));
    console.log(chalk.gray('电话: ') + (address.phone || '-'));

    const fullAddress = [
      address.line_1,
      address.line_2,
      address.city,
      address.state,
      address.postal_code,
      address.country,
    ].filter(Boolean).join(', ');

    console.log(chalk.gray('地址: ') + fullAddress);

    if (address.is_default) {
      console.log(chalk.gray('默认地址: ') + chalk.green('是'));
    }

    console.log('─'.repeat(60) + '\n');
  } catch (error: any) {
    spinner.fail('获取地址详情失败');
    throw createApiError(error);
  }
}
