import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface ListOptions {
  status?: string;
  limit?: number;
}

const cmd = new Command('list')
  .description('List customer support conversations')
  .option('-s, --status <string>', 'Filter by status (open/closed)')
  .option('-l, --limit <number>', 'Number of conversations per page (default: 20)', '20')
  .action(async (options: ListOptions) => {
    try {
      await listConversations(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List all conversations',
    '$ optima conversation list',
    '',
    '# List only open conversations',
    '$ optima conversation list --status open',
    '',
    '# List with custom limit',
    '$ optima conversation list --limit 50',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        conversations: [
          {
            id: 'uuid',
            customer_name: 'John Doe',
            customer_email: 'john@example.com',
            status: 'open',
            unread_count: 2,
            last_message_at: 'timestamp'
          }
        ],
        total: 1,
        per_page: 20
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'conversation get', description: 'View conversation details' },
    { command: 'conversation messages', description: 'View all messages' },
    { command: 'conversation send', description: 'Send reply message' },
  ],
  notes: [
    'Shows all conversations with status and unread count',
    'Use --status to filter by open/closed',
    'Default limit is 20 conversations',
  ]
});

export const listConversationsCommand = cmd;

async function listConversations(options: ListOptions) {
  const spinner = output.spinner('正在获取对话列表...');

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
      if (output.isJson()) {
        output.success({
          conversations: [],
          total: 0
        }, '暂无对话');
      } else {
        console.log(chalk.yellow('\n暂无对话\n'));
      }
      return;
    }

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      output.success({
        conversations,
        total: response.total,
        per_page: params.per_page
      });
    } else {
      // Pretty 模式：保持原有表格输出
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
    }
  } catch (error: any) {
    spinner.fail('获取对话列表失败');
    throw createApiError(error);
  }
}
