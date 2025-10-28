import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('close')
  .description('Close a conversation (mark as resolved)')
  .option('--id <uuid>', 'Conversation ID (required)')
  .action(async (options: { id?: string }) => {
    try {
      await closeConversation(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Close conversation after resolving issue',
    '$ optima conversation close --id conv-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        conversation_id: 'uuid',
        status: 'closed'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'conversation list', description: 'View all conversations' },
    { command: 'conversation get', description: 'Check conversation status' },
  ],
  notes: [
    'Conversation ID is required',
    'Marks conversation as closed/resolved',
    'Use after customer issue is resolved',
  ]
});

export const closeConversationCommand = cmd;

async function closeConversation(options: { id?: string }) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'id');
  }

  const conversationId = options.id;

  const spinner = output.spinner('正在关闭对话...');

  try {
    await commerceApi.conversations.update(conversationId, { status: 'closed' });
    spinner.succeed('对话已关闭！');

    if (output.isJson()) {
      output.success({
        conversation_id: conversationId,
        status: 'closed'
      });
    } else {
      console.log();
      console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversationId));
      console.log(chalk.gray('状态: ') + chalk.gray('已关闭'));
      console.log();
    }
  } catch (error: any) {
    spinner.fail('关闭对话失败');
    throw createApiError(error);
  }
}
