import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('mark-read')
  .description('Mark all conversation messages as read')
  .option('--id <uuid>', 'Conversation ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await markRead(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Mark conversation as read',
    '$ optima conversation mark-read --id conv-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        conversation_id: 'uuid',
        marked_read: true
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'conversation get', description: 'Check unread count' },
    { command: 'conversation messages', description: 'View messages' },
  ],
  notes: [
    'Conversation ID is required',
    'Marks all messages in conversation as read',
    'Resets unread_count to 0',
  ]
});

export const markReadCommand = cmd;

async function markRead(options: { id?: string }) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'id');
  }

  const conversationId = options.id;

  const spinner = output.spinner('正在标记已读...');

  try {
    await commerceApi.conversations.markRead(conversationId);
    spinner.succeed('消息已标记为已读！');

    if (output.isJson()) {
      output.success({
        conversation_id: conversationId,
        marked_read: true
      });
    } else {
      console.log();
      console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversationId));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('标记已读失败');
    throw createApiError(error);
  }
}
