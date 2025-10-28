import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatOrder } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface ShipOrderOptions {
  id?: string;
  tracking?: string;
  carrier?: string;
}

export const shipOrderCommand = new Command('ship')
  .description('订单发货')
  .option('--id <id>', '订单 ID')
  .option('-t, --tracking <number>', '物流单号')
  .option('-c, --carrier <name>', '快递公司')
  .action(async (options: ShipOrderOptions) => {
    try {
      await shipOrder(options);
    } catch (error) {
      handleError(error);
    }
  });

async function shipOrder(options: ShipOrderOptions) {
  // 验证参数
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('订单 ID 不能为空', 'id');
  }

  const orderId = options.id;

  let trackingNumber = options.tracking;
  let carrier = options.carrier;

  // 如果没有提供物流信息，进入交互式模式
  if (!trackingNumber && !carrier) {
    console.log(chalk.cyan('\n📦 订单发货\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'trackingNumber',
        message: '物流单号 (可选):',
        default: '',
      },
      {
        type: 'input',
        name: 'carrier',
        message: '快递公司 (可选):',
        default: '',
      },
    ]);

    trackingNumber = answers.trackingNumber || undefined;
    carrier = answers.carrier || undefined;
  }

  const spinner = output.spinner('正在标记订单已发货...');

  try {
    const shipData: any = {};

    if (trackingNumber) {
      shipData.tracking_number = trackingNumber;
    }

    if (carrier) {
      shipData.carrier = carrier;
    }

    const order = await commerceApi.orders.ship(orderId, shipData);
    spinner.succeed('订单已标记为发货！');

    if (output.isJson()) {
      output.success({
        order_id: order.id || order.order_id,
        status: order.status,
        tracking_number: trackingNumber,
        carrier: carrier
      });
    } else {
      // 显示更新后的订单信息
      console.log();
      console.log(formatOrder(order));

      if (trackingNumber) {
        console.log(chalk.gray('物流单号: ') + chalk.cyan(trackingNumber));
      }

      if (carrier) {
        console.log(chalk.gray('快递公司: ') + chalk.cyan(carrier));
      }

      console.log();
    }
  } catch (error: any) {
    spinner.fail('订单发货失败');
    throw createApiError(error);
  }
}
