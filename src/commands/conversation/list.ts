import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';

interface ListOptions {
  status?: string;
  limit?: number;
}

export const listConversationsCommand = new Command('list')
  .description('对话列表')
  .option('-s, --status <status>', '对话状态 (open/closed)')
  .option('-l, --limit <number>', '每页数量', '20')
  .action(async (options: ListOptions) => {
    try {
      await listConversations(options);
    } catch (error) {
      handleError(error);
    }
  });

async function listConversations(options: ListOptions) {
  const spinner = ora('正在获取对话列表...').start();

  try {
    const params: any = {
      per_page: options.limit ? parseInt(options.limit.toString()) : 20,
    };

    if (options.status) {
      params.status = options.status;
    }

    const response = await commerceApi.conversations.list(params);
    spinner.succeed('对话列表获取成功');

    const conversations = response.conversations || [];

    if (conversations.length === 0) {
      console.log(chalk.yellow('\n暂无对话\n'));
      return;
    }

    const table = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('客户'),
        chalk.cyan('状态'),
        chalk.cyan('未读'),
        chalk.cyan('最后消息时间'),
      ],
      colWidths: [38, 30, 12, 10, 20],
    });

    conversations.forEach((conv: any) => {
      const customer = conv.customer_name || conv.customer_email || conv.customer_phone || '-';
      const status = conv.status === 'open' ? chalk.green('进行中') : chalk.gray('已关闭');
      const unread = conv.unread_count > 0 ? chalk.red(conv.unread_count) : '-';
      const lastMessage = conv.last_message_at ? formatDate(conv.last_message_at) : '-';

      table.push([
        conv.id,
        customer,
        status,
        unread,
        lastMessage,
      ]);
    });

    console.log('\n' + table.toString());
    console.log(chalk.gray(`\n显示 ${conversations.length} / 共 ${response.total} 个对话\n`));
  } catch (error: any) {
    spinner.fail('获取对话列表失败');
    throw createApiError(error);
  }
}
