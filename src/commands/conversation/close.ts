import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

export const closeConversationCommand = new Command('close')
  .description('关闭对话')
  .argument('<conversation-id>', '对话 ID')
  .action(async (conversationId: string) => {
    try {
      await closeConversation(conversationId);
    } catch (error) {
      handleError(error);
    }
  });

async function closeConversation(conversationId: string) {
  if (!conversationId || conversationId.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'conversation-id');
  }

  const spinner = ora('正在关闭对话...').start();

  try {
    await commerceApi.conversations.update(conversationId, { status: 'closed' });
    spinner.succeed('对话已关闭！');

    console.log();
    console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversationId));
    console.log(chalk.gray('状态: ') + chalk.gray('已关闭'));
    console.log();
  } catch (error: any) {
    spinner.fail('关闭对话失败');
    throw createApiError(error);
  }
}
