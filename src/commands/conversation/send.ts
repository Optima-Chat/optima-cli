import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface SendOptions {
  id?: string;
  content?: string;
}

const cmd = new Command('send')
  .description('Send message to customer in conversation')
  .option('--id <uuid>', 'Conversation ID (required)')
  .option('-c, --content <string>', 'Message content (required)')
  .action(async (options: SendOptions) => {
    try {
      await sendMessage(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Send message to customer',
    '$ optima conversation send \\',
    '  --id conv-123 \\',
    '  --content "Thank you for contacting us. How can I help?"',
    '',
    '# Send message with quotes',
    '$ optima conversation send \\',
    '  --id conv-123 \\',
    '  --content "Your order #12345 has been shipped!"',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        conversation_id: 'uuid',
        message_id: 'uuid',
        content: 'Thank you for contacting us'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'conversation get', description: 'View conversation details' },
    { command: 'conversation messages', description: 'View message history' },
    { command: 'conversation list', description: 'Find conversation IDs' },
  ],
  notes: [
    'Conversation ID and content are required',
    'Message is sent as merchant (not customer)',
    'Use quotes around content with spaces',
  ]
});

export const sendMessageCommand = cmd;

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

  const spinner = output.spinner('正在发送消息...');

  try {
    const message = await commerceApi.conversations.sendMessage(conversationId, {
      content,
      message_type: 'text',
    });
    spinner.succeed('消息发送成功！');

    if (output.isJson()) {
      output.success({
        conversation_id: conversationId,
        message_id: message.id,
        content: content
      });
    } else {
      console.log();
      console.log(chalk.gray('消息 ID: ') + chalk.cyan(message.id));
      console.log(chalk.gray('内容: ') + content);
      console.log();
    }
  } catch (error: any) {
    spinner.fail('消息发送失败');
    throw createApiError(error);
  }
}
