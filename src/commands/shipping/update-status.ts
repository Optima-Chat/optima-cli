import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface UpdateStatusOptions {
  status?: string;
  note?: string;
}

export const updateStatusCommand = new Command('update-status')
  .description('更新物流状态')
  .argument('<order-id>', '订单 ID')
  .option('-s, --status <status>', '物流状态')
  .option('-n, --note <note>', '备注')
  .action(async (orderId: string, options: UpdateStatusOptions) => {
    try {
      await updateShippingStatus(orderId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function updateShippingStatus(orderId: string, options: UpdateStatusOptions) {
  // 验证参数
  if (!orderId || orderId.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'order-id');
  }

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

  const spinner = ora('正在更新物流状态...').start();

  try {
    await commerceApi.shipping.updateShippingStatus(orderId, statusData);
    spinner.succeed('物流状态更新成功！');

    console.log();
    console.log(chalk.gray('订单 ID: ') + chalk.cyan(orderId));
    console.log(chalk.gray('新状态: ') + chalk.green(statusData.status));

    if (statusData.note) {
      console.log(chalk.gray('备注: ') + statusData.note);
    }

    console.log();
  } catch (error: any) {
    spinner.fail('物流状态更新失败');
    throw createApiError(error);
  }
}
