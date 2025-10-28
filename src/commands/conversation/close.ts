import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

export const closeConversationCommand = new Command('close')
  .description('关闭对话')
  .option('--id <id>', '对话 ID')
  .action(async (options: { id?: string }) => {
    try {
      await closeConversation(options);
    } catch (error) {
      handleError(error);
    }
  });

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
