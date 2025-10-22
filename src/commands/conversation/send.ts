import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface SendOptions {
  id?: string;
  content?: string;
}

export const sendMessageCommand = new Command('send')
  .description('发送消息')
  .option('--id <id>', '对话 ID')
  .option('-c, --content <content>', '消息内容')
  .action(async (options: SendOptions) => {
    try {
      await sendMessage(options);
    } catch (error) {
      handleError(error);
    }
  });

async function sendMessage(options: SendOptions) {
  if (!options.id || options.id.trim().length === 0) {
    throw new ValidationError('对话 ID 不能为空', 'id');
  }

  const conversationId = options.id;

  let { content } = options;

  if (!content) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'content',
        message: '消息内容:',
        validate: (input) => input.trim().length > 0 || '消息内容不能为空',
      },
    ]);

    content = answers.content;
  }

  if (!content || content.trim().length === 0) {
    throw new ValidationError('消息内容不能为空', 'content');
  }

  const spinner = ora('正在发送消息...').start();

  try {
    const message = await commerceApi.conversations.sendMessage(conversationId, {
      content,
      message_type: 'text',
    });
    spinner.succeed('消息发送成功！');

    console.log();
    console.log(chalk.gray('消息 ID: ') + chalk.cyan(message.id));
    console.log(chalk.gray('内容: ') + content);
    console.log();
  } catch (error: any) {
    spinner.fail('消息发送失败');
    throw createApiError(error);
  }
}
