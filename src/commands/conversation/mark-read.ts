import { Command } from 'commander';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';

export const markReadCommand = new Command('mark-read')
  .description('标记消息已读')
  .option('--id <id>', '对话 ID')
  .action(async (options: { id?: string }) => {
    try {
      await markRead(options);
    } catch (error) {
      handleError(error);
    }
  });

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
