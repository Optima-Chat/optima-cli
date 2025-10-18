import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';

export const listAddressesCommand = new Command('list')
  .description('地址列表')
  .action(async () => {
    try {
      const spinner = ora('正在获取地址列表...').start();
      const addresses = await commerceApi.addresses.list();
      spinner.succeed('地址列表获取成功');

      if (addresses.length === 0) {
        console.log(chalk.yellow('\n暂无地址\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('姓名'), chalk.cyan('地址'), chalk.cyan('电话'), chalk.cyan('默认')],
        colWidths: [38, 15, 50, 15, 8],
      });

      addresses.forEach((addr: any) => {
        const fullAddress = [addr.line_1, addr.line_2, addr.city, addr.state, addr.postal_code, addr.country]
          .filter(Boolean).join(', ');
        const isDefault = addr.is_default ? chalk.green('是') : '-';

        table.push([addr.id, addr.recipient_name || '-', fullAddress, addr.phone || '-', isDefault]);
      });

      console.log('\n' + table.toString() + '\n');
    } catch (error) {
      handleError(error);
    }
  });
