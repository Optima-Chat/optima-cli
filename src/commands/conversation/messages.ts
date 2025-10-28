import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';
import { output } from '../../utils/output.js';

interface MessagesOptions {
  id?: string;
  limit?: number;
}

export const messagesCommand = new Command('messages')
  .description('查看对话消息')
  .option('--id <id>', '对话 ID')
  .option('-l, --limit <number>', '消息数量', '50')
  .action(async (options: MessagesOptions) => {
    try {
      await getMessages(options);
    } catch (error) {
      handleError(error);
    }
  });

async function getMessages(options: MessagesOptions) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'id');
  }

  const conversationId = options.id;

  const spinner = output.spinner('正在获取消息...');

  try {
    const params: any = {};
    if (options.limit) {
      params.limit = parseInt(options.limit.toString());
    }

    const response = await commerceApi.conversations.getMessages(conversationId, params);
    spinner.succeed('消息获取成功');

    const messages = response.messages || [];

    if (messages.length === 0) {
      if (output.isJson()) {
        output.success({
          conversation_id: conversationId,
          messages: [],
          total: 0,
          has_more: false
        }, '暂无消息');
      } else {
        console.log(chalk.yellow('\n暂无消息\n'));
      }
      return;
    }

    if (output.isJson()) {
      output.success({
        conversation_id: conversationId,
        messages: messages,
        total: messages.length,
        has_more: response.has_more || false
      });
    } else {
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
    }
  } catch (error: any) {
    spinner.fail('获取消息失败');
    throw createApiError(error);
  }
}
