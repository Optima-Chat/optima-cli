import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';

export const listZonesCommand = new Command('list')
  .description('运费区域列表')
  .action(async () => {
    try {
      const spinner = ora('正在获取运费区域...').start();
      const zones = await commerceApi.shippingFixed.listZones();
      spinner.succeed('运费区域获取成功');

      if (zones.length === 0) {
        console.log(chalk.yellow('\n暂无运费区域\n'));
        return;
      }

      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('名称'), chalk.cyan('国家'), chalk.cyan('费率数')],
        colWidths: [38, 20, 30, 12],
      });

      zones.forEach((zone: any) => {
        const countries = zone.country_count > 0
          ? `${zone.country_count} 个国家`
          : '-';
        const rateCount = zone.rate_count || 0;

        table.push([zone.id, zone.name, countries, rateCount.toString()]);
      });

      console.log('\n' + table.toString());
      console.log(chalk.gray(`\n共 ${zones.length} 个运费区域\n`));
    } catch (error) {
      handleError(error);
    }
  });
