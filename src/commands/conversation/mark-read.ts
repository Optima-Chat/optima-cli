import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const markReadCommand = new Command('mark-read')
  .description('标记消息已读')
  .argument('<conversation-id>', '对话 ID')
  .action(async (conversationId: string) => {
    try {
      await markRead(conversationId);
    } catch (error) {
      handleError(error);
    }
  });

async function markRead(conversationId: string) {
  if (!conversationId || conversationId.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'conversation-id');
  }

  const spinner = ora('正在标记已读...').start();

  try {
    await commerceApi.conversations.markRead(conversationId);
    spinner.succeed('消息已标记为已读！');

    console.log();
    console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversationId));
    console.log();
  } catch (error: any) {
    spinner.fail('标记已读失败');
    throw createApiError(error);
  }
}
