import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface DeleteOptions {
  id?: string;
  yes?: boolean;
}

export const deleteZoneCommand = new Command('delete')
  .description('删除运费区域')
  .option('--id <id>', '区域 ID')
  .option('-y, --yes', '跳过确认')
  .action(async (options: DeleteOptions) => {
    try {
      await deleteZone(options);
    } catch (error) {
      handleError(error);
    }
  });

async function deleteZone(options: DeleteOptions) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'id');
  }

  const zoneId = options.id;

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

  const spinner = output.spinner('正在删除运费区域...');

  try {
    await commerceApi.shippingFixed.deleteZone(zoneId);
    spinner.succeed('运费区域删除成功！');

    if (output.isJson()) {
      output.success({
        zone_id: zoneId,
        deleted: true
      });
    } else {
      console.log();
      console.log(chalk.gray('已删除区域: ') + chalk.cyan(zoneId));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('运费区域删除失败');
    throw createApiError(error);
  }
}
