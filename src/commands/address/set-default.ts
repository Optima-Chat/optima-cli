import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const setDefaultAddressCommand = new Command('set-default')
  .description('设为默认地址')
  .argument('<address-id>', '地址 ID')
  .action(async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error) {
      handleError(error);
    }
  });

async function setDefaultAddress(addressId: string) {
  if (!addressId || addressId.trim().length === 0) {
    throw new ValidationError('地址 ID 不能为空', 'address-id');
  }

  const spinner = ora('正在设置默认地址...').start();

  try {
    await commerceApi.addresses.setDefault(addressId);
    spinner.succeed('默认地址设置成功！');

    console.log();
    console.log(chalk.gray('默认地址: ') + chalk.cyan(addressId));
    console.log();
  } catch (error: any) {
    spinner.fail('设置默认地址失败');
    throw createApiError(error);
  }
}
