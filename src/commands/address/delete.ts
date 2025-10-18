import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface DeleteOptions {
  yes?: boolean;
}

export const deleteAddressCommand = new Command('delete')
  .description('删除地址')
  .argument('<address-id>', '地址 ID')
  .option('-y, --yes', '跳过确认')
  .action(async (addressId: string, options: DeleteOptions) => {
    try {
      await deleteAddress(addressId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteAddress(addressId: string, options: DeleteOptions) {
  if (!addressId || addressId.trim().length === 0) {
    throw new ValidationError('地址 ID 不能为空', 'address-id');
  }

  if (!options.yes) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除地址 ${addressId} 吗？`,
        default: false,
      },
    ]);

    if (!answers.confirm) {
      console.log(chalk.yellow('已取消删除'));
      return;
    }
  }

  const spinner = ora('正在删除地址...').start();

  try {
    await commerceApi.addresses.delete(addressId);
    spinner.succeed('地址删除成功！');

    console.log();
    console.log(chalk.gray('已删除地址: ') + chalk.cyan(addressId));
    console.log();
  } catch (error: any) {
    spinner.fail('地址删除失败');
    throw createApiError(error);
  }
}
