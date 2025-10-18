import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';

interface MessagesOptions {
  limit?: number;
}

export const messagesCommand = new Command('messages')
  .description('查看对话消息')
  .argument('<conversation-id>', '对话 ID')
  .option('-l, --limit <number>', '消息数量', '50')
  .action(async (conversationId: string, options: MessagesOptions) => {
    try {
      await getMessages(conversationId, options);
    } catch (error) {
      handleError(error);
    }
  });

async function getMessages(conversationId: string, options: MessagesOptions) {
  if (!conversationId || conversationId.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'conversation-id');
  }

  const spinner = ora('正在获取消息...').start();

  try {
    const params: any = {};
    if (options.limit) {
      params.limit = parseInt(options.limit.toString());
    }

    const response = await commerceApi.conversations.getMessages(conversationId, params);
    spinner.succeed('消息获取成功');

    const messages = response.messages || [];

    if (messages.length === 0) {
      console.log(chalk.yellow('\n暂无消息\n'));
      return;
    }

    console.log('\n' + '─'.repeat(60));
    console.log(chalk.bold(`对话消息 (${messages.length})`));
    console.log('─'.repeat(60) + '\n');

    messages.forEach((msg: any) => {
      const senderType = msg.sender_type === 'merchant'
        ? chalk.blue('[商家]')
        : chalk.green('[客户]');

      const time = formatDate(msg.created_at);
      const readStatus = msg.is_read ? '' : chalk.red(' [未读]');

      console.log(`${senderType} ${chalk.gray(time)}${readStatus}`);
      console.log(msg.content);
      console.log();
    });

    if (response.has_more) {
      console.log(chalk.yellow('还有更多消息...'));
    }

    console.log();
  } catch (error: any) {
    spinner.fail('获取消息失败');
    throw createApiError(error);
  }
}
