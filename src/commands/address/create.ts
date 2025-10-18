import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

interface CreateAddressOptions {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal?: string;
  country?: string;
}

export const createAddressCommand = new Command('create')
  .description('创建地址')
  .option('-n, --name <name>', '收件人姓名')
  .option('-p, --phone <phone>', '电话')
  .option('--line1 <line1>', '地址行1')
  .option('--line2 <line2>', '地址行2')
  .option('--city <city>', '城市')
  .option('--state <state>', '省/州')
  .option('--postal <postal>', '邮政编码')
  .option('--country <country>', '国家代码 (如 CN, US)')
  .action(async (options: CreateAddressOptions) => {
    try {
      await createAddress(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createAddress(options: CreateAddressOptions) {
  let { name, phone, line1, line2, city, state, postal, country } = options;

  // 交互式输入缺失的必填字段
  if (!name || !phone || !line1 || !city || !postal || !country) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '收件人姓名:',
        when: !name,
        validate: (input) => input.trim().length > 0 || '姓名不能为空',
      },
      {
        type: 'input',
        name: 'phone',
        message: '电话:',
        when: !phone,
        validate: (input) => input.trim().length > 0 || '电话不能为空',
      },
      {
        type: 'input',
        name: 'line1',
        message: '地址行1:',
        when: !line1,
        validate: (input) => input.trim().length > 0 || '地址不能为空',
      },
      {
        type: 'input',
        name: 'line2',
        message: '地址行2（可选）:',
        when: !line2,
      },
      {
        type: 'input',
        name: 'city',
        message: '城市:',
        when: !city,
        validate: (input) => input.trim().length > 0 || '城市不能为空',
      },
      {
        type: 'input',
        name: 'state',
        message: '省/州（可选）:',
        when: !state,
      },
      {
        type: 'input',
        name: 'postal',
        message: '邮政编码:',
        when: !postal,
        validate: (input) => input.trim().length > 0 || '邮政编码不能为空',
      },
      {
        type: 'input',
        name: 'country',
        message: '国家代码 (如 CN, US):',
        when: !country,
        validate: (input) => input.trim().length === 2 || '国家代码必须是2位字母',
      },
    ]);

    name = name || answers.name;
    phone = phone || answers.phone;
    line1 = line1 || answers.line1;
    line2 = line2 || answers.line2;
    city = city || answers.city;
    state = state || answers.state;
    postal = postal || answers.postal;
    country = country || answers.country;
  }

  const spinner = ora('正在创建地址...').start();

  try {
    const data: any = {
      recipient_name: name,
      phone,
      line_1: line1,
      city,
      postal_code: postal,
      country: country?.toUpperCase(),
    };

    if (line2) data.line_2 = line2;
    if (state) data.state = state;

    const address = await commerceApi.addresses.create(data);
    spinner.succeed('地址创建成功！');

    console.log();
    console.log(chalk.gray('地址 ID: ') + chalk.cyan(address.id));
    console.log(chalk.gray('收件人: ') + name);
    console.log(chalk.gray('电话: ') + phone);
    console.log(chalk.gray('地址: ') + [line1, line2, city, state, postal, country].filter(Boolean).join(', '));
    console.log();
  } catch (error: any) {
    spinner.fail('地址创建失败');
    throw createApiError(error);
  }
}
