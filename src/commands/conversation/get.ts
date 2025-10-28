import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { formatDate } from '../../utils/format.js';
import { output } from '../../utils/output.js';

export const getConversationCommand = new Command('get')
  .description('对话详情')
  .option('--id <id>', '对话 ID')
  .action(async (options: { id?: string }) => {
    try {
      await getConversation(options);
    } catch (error) {
      handleError(error);
    }
  });

async function getConversation(options: { id?: string }) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'id');
  }

  const conversationId = options.id;

  const spinner = output.spinner('正在获取对话详情...');

  try {
    const conversation = await commerceApi.conversations.get(conversationId);
    spinner.succeed('对话详情获取成功');

    if (output.isJson()) {
      // JSON 模式：输出结构化数据
      const recentMessages = conversation.messages && conversation.messages.length > 0
        ? conversation.messages.slice(0, 5).map((msg: any) => ({
            sender_type: msg.sender_type,
            content: msg.content,
            created_at: msg.created_at
          }))
        : [];

      output.success({
        id: conversation.id,
        customer_name: conversation.customer_name,
        customer_email: conversation.customer_email,
        customer_phone: conversation.customer_phone,
        status: conversation.status,
        unread_count: conversation.unread_count,
        created_at: conversation.created_at,
        last_message_at: conversation.last_message_at,
        recent_messages: recentMessages
      });
    } else {
      // Pretty 模式：保持原有格式化输出
      console.log('\n' + '─'.repeat(60));
      console.log(chalk.bold('对话详情'));
      console.log('─'.repeat(60));
      console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversation.id));

      const customer = conversation.customer_name || conversation.customer_email || conversation.customer_phone || '-';
      console.log(chalk.gray('客户: ') + customer);

      const statusColor = conversation.status === 'open' ? chalk.green : chalk.gray;
      const statusText = conversation.status === 'open' ? '进行中' : '已关闭';
      console.log(chalk.gray('状态: ') + statusColor(statusText));

      if (conversation.unread_count > 0) {
        console.log(chalk.gray('未读消息: ') + chalk.red(conversation.unread_count));
      }

      console.log(chalk.gray('创建时间: ') + formatDate(conversation.created_at));

      if (conversation.last_message_at) {
        console.log(chalk.gray('最后消息: ') + formatDate(conversation.last_message_at));
      }

      console.log('─'.repeat(60) + '\n');

      // 显示最近的消息
      if (conversation.messages && conversation.messages.length > 0) {
        console.log(chalk.bold('最近消息:'));
        console.log();

        conversation.messages.slice(0, 5).forEach((msg: any) => {
          const senderType = msg.sender_type === 'merchant' ? chalk.blue('[商家]') : chalk.green('[客户]');
          const time = formatDate(msg.created_at);
          console.log(`${senderType} ${chalk.gray(time)}`);
          console.log(msg.content);
          console.log();
        });
      }
    }
  } catch (error: any) {
    spinner.fail('获取对话详情失败');
    throw createApiError(error);
  }
}
