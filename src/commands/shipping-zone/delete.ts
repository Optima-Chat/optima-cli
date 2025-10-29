import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';
import { isInteractiveEnvironment } from '../../utils/interactive.js';

interface DeleteOptions {
  id?: string;
  yes?: boolean;
}

const cmd = new Command('delete')
  .description('Delete shipping zone permanently')
  .option('--id <id>', 'Zone ID (required)')
  .option('-y, --yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options: DeleteOptions) => {
    try {
      await deleteZone(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Delete zone with confirmation',
    '$ optima shipping-zone delete --id zone-123',
    '',
    '# Delete without confirmation (non-interactive)',
    '$ optima shipping-zone delete --id zone-123 --yes',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        zone_id: 'uuid',
        deleted: true
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'shipping-zone list', description: 'Find zone IDs' },
    { command: 'shipping-zone list-rates', description: 'View rates before deleting' },
  ],
  notes: [
    'Zone ID is required',
    'This action cannot be undone',
    'All rates in this zone will also be deleted',
    'Requires confirmation unless --yes flag is used',
  ]
});

export const deleteZoneCommand = cmd;

async function deleteZone(options: DeleteOptions) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('区域 ID 不能为空', 'id');
  }

  const zoneId = options.id;

  if (!options.yes) {
    if (isInteractiveEnvironment()) {
      // 交互模式：显示确认提示
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
    } else {
      // 非交互模式：要求使用 --yes 标志
      throw new ValidationError(
        '非交互环境需要使用 --yes 标志确认删除操作',
        'yes'
      );
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
