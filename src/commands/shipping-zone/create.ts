import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';

interface CreateZoneOptions {
  name?: string;
  countries?: string;
}

export const createZoneCommand = new Command('create')
  .description('创建运费区域')
  .option('-n, --name <name>', '区域名称')
  .option('-c, --countries <countries>', '国家代码列表（逗号分隔，如 CN,US,JP）')
  .action(async (options: CreateZoneOptions) => {
    try {
      await createZone(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createZone(options: CreateZoneOptions) {
  let { name, countries } = options;

  if (!name || !countries) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '区域名称:',
        when: !name,
        validate: (input) => input.trim().length > 0 || '名称不能为空',
      },
      {
        type: 'input',
        name: 'countries',
        message: '国家代码（逗号分隔，如 CN,US,JP）:',
        when: !countries,
        validate: (input) => input.trim().length > 0 || '国家代码不能为空',
      },
    ]);

    name = name || answers.name;
    countries = countries || answers.countries;
  }

  const spinner = ora('正在创建运费区域...').start();

  try {
    const countriesArray = countries!.split(',').map((c) => c.trim().toUpperCase());
    const zone = await commerceApi.shippingFixed.createZone({
      name: name!,
      countries: countriesArray,
    });

    spinner.succeed('运费区域创建成功！');

    console.log();
    console.log(chalk.gray('区域 ID: ') + chalk.cyan(zone.id));
    console.log(chalk.gray('名称: ') + name);
    console.log(chalk.gray('国家: ') + countriesArray.join(', '));
    console.log();
  } catch (error: any) {
    spinner.fail('运费区域创建失败');
    throw createApiError(error);
  }
}
