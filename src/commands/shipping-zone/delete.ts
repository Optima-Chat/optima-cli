import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface DeleteOptions {
  yes?: boolean;
}

export const deleteZoneCommand = new Command('delete')
  .description('删除运费区域')
  .argument('<zone-id>', '区域 ID')
  .option('-y, --yes', '跳过确认')
  .action(async (zoneId: string, options: DeleteOptions) => {
    try {
      await deleteZone(zoneId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteZone(zoneId: string, options: DeleteOptions) {
  if (!zoneId || zoneId.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'zone-id');
  }

  if (!options.yes) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除运费区域 ${zoneId} 吗？`,
        default: false,
      },
    ]);

    if (!answers.confirm) {
      console.log(chalk.yellow('已取消删除'));
      return;
    }
  }

  const spinner = ora('正在删除运费区域...').start();

  try {
    await commerceApi.shippingFixed.deleteZone(zoneId);
    spinner.succeed('运费区域删除成功！');

    console.log();
    console.log(chalk.gray('已删除区域: ') + chalk.cyan(zoneId));
    console.log();
  } catch (error: any) {
    spinner.fail('运费区域删除失败');
    throw createApiError(error);
  }
}
