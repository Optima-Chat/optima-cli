import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

interface UpdateStatusOptions {
  id?: string;
  status?: string;
  note?: string;
}

export const updateStatusCommand = new Command('update-status')
  .description('更新物流状态')
  .option('--id <id>', '订单 ID')
  .option('-s, --status <status>', '物流状态')
  .option('-n, --note <note>', '备注')
  .action(async (options: UpdateStatusOptions) => {
    try {
      await updateShippingStatus(options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateShippingStatus(options: UpdateStatusOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  let statusData: any = {};

  // 如果没有提供状态，进入交互式模式
  if (!options.status) {
    console.log(chalk.cyan(`\n📦 更新物流状态: ${orderId}\n`));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'status',
        message: '物流状态:',
        choices: [
          { name: '待发货 (pending)', value: 'pending' },
          { name: '已发货 (shipped)', value: 'shipped' },
          { name: '运输中 (in_transit)', value: 'in_transit' },
          { name: '派送中 (out_for_delivery)', value: 'out_for_delivery' },
          { name: '已送达 (delivered)', value: 'delivered' },
          { name: '配送失败 (failed)', value: 'failed' },
        ],
      },
      {
        type: 'input',
        name: 'note',
        message: '备注 (可选):',
        default: options.note || '',
      },
    ]);

    statusData = {
      status: answers.status,
      note: answers.note?.trim() || undefined,
    };
  } else {
    // 命令行参数模式
    statusData = {
      status: options.status,
      note: options.note,
    };
  }

  const spinner = output.spinner('正在更新物流状态...');

  try {
    await commerceApi.shipping.updateShippingStatus(orderId, statusData);
    spinner.succeed('物流状态更新成功！');

    if (output.isJson()) {
      output.success({
        order_id: orderId,
        status: statusData.status,
        ...(statusData.note && { note: statusData.note })
      });
    } else {
      console.log();
      console.log(chalk.gray('订单 ID: ') + chalk.cyan(orderId));
      console.log(chalk.gray('新状态: ') + chalk.green(statusData.status));

      if (statusData.note) {
        console.log(chalk.gray('备注: ') + statusData.note);
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('物流状态更新失败');
    throw createApiError(error);
  }
}
