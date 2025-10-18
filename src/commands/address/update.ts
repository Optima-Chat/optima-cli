import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface UpdateAddressOptions {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
}

export const updateAddressCommand = new Command('update')
  .description('更新地址')
  .argument('<address-id>', '地址 ID')
  .option('-n, --name <name>', '收件人姓名')
  .option('-p, --phone <phone>', '电话')
  .option('--line1 <line1>', '地址行1')
  .option('--line2 <line2>', '地址行2')
  .option('--city <city>', '城市')
  .option('--state <state>', '省/州')
  .option('--postal <postal>', '邮政编码')
  .option('--country <country>', '国家代码')
  .action(async (addressId: string, options: UpdateAddressOptions) => {
    try {
      await updateAddress(addressId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateAddress(addressId: string, options: UpdateAddressOptions) {
  if (!addressId || addressId.trim().length === 0) {
    throw new ValidationError('地址 ID 不能为空', 'address-id');
  }

  const { name, phone, line1, line2, city, state, postal, country } = options;

  // 至少需要一个更新字段
  if (!name && !phone && !line1 && !line2 && !city && !state && !postal && !country) {
    console.log(chalk.yellow('未提供任何更新字段'));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '是否继续交互式更新？',
        default: true,
      },
    ]);

    if (!answers.continue) {
      return;
    }

    // 交互式更新
    const updateAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '收件人姓名（留空跳过）:',
      },
      {
        type: 'input',
        name: 'phone',
        message: '电话（留空跳过）:',
      },
      {
        type: 'input',
        name: 'line1',
        message: '地址行1（留空跳过）:',
      },
      {
        type: 'input',
        name: 'line2',
        message: '地址行2（留空跳过）:',
      },
      {
        type: 'input',
        name: 'city',
        message: '城市（留空跳过）:',
      },
      {
        type: 'input',
        name: 'state',
        message: '省/州（留空跳过）:',
      },
      {
        type: 'input',
        name: 'postal',
        message: '邮政编码（留空跳过）:',
      },
      {
        type: 'input',
        name: 'country',
        message: '国家代码（留空跳过）:',
      },
    ]);

    Object.assign(options, updateAnswers);
  }

  const spinner = ora('正在更新地址...').start();

  try {
    const data: any = {};

    if (name) data.recipient_name = name;
    if (phone) data.phone = phone;
    if (line1) data.line_1 = line1;
    if (line2) data.line_2 = line2;
    if (city) data.city = city;
    if (state) data.state = state;
    if (postal) data.postal_code = postal;
    if (country) data.country = country.toUpperCase();

    await commerceApi.addresses.update(addressId, data);
    spinner.succeed('地址更新成功！');

    console.log();
    console.log(chalk.gray('地址 ID: ') + chalk.cyan(addressId));
    console.log();
  } catch (error: any) {
    spinner.fail('地址更新失败');
    throw createApiError(error);
  }
}
