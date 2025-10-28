import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

interface CreateOptions {
  customerId?: string;
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
}

const cmd = new Command('create')
  .description('Create customer support conversation')
  .option('--customer-id <uuid>', 'Customer user ID from order (required)')
  .option('-e, --email <email>', 'Customer email (optional)')
  .option('-p, --phone <phone>', 'Customer phone (optional)')
  .option('-n, --name <name>', 'Customer name (optional)')
  .option('-m, --message <message>', 'Initial message (optional)')
  .action(async (options: CreateOptions) => {
    try {
      await createConversation(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Get customer ID from order first',
    '$ optima order get --id order-123',
    '# Copy customer_user_id from response',
    '',
    '# Create conversation',
    '$ optima conversation create \\',
    '  --customer-id cust-456 \\',
    '  --email "customer@example.com" \\',
    '  --name "John Doe" \\',
    '  --message "How can I help you?"',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        conversation_id: 'uuid',
        customer_id: 'uuid',
        customer_email: 'customer@example.com',
        customer_name: 'John Doe',
        initial_message: 'How can I help you?'
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'order get', description: 'Get customer_user_id from order' },
    { command: 'conversation send', description: 'Send message to conversation' },
    { command: 'conversation list', description: 'View all conversations' },
  ],
  notes: [
    'customer-id is required (get from order.customer_user_id)',
    'Email, phone, and name are optional but recommended',
    'Initial message is optional',
    'Use this to start support conversations with customers',
  ]
});

export const createConversationCommand = cmd;

async function createConversation(options: CreateOptions) {
  let { customerId, email, phone, name, message } = options;

  // 交互式输入客户 ID（如果未提供）
  if (!customerId) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'customerId',
        message: '客户 ID（从订单详情中获取）:',
        validate: (input) => input.trim().length > 0 || '客户 ID 不能为空',
      },
    ]);
    customerId = answers.customerId;
  }

  if (!customerId || customerId.trim().length === 0) {
    throw new ValidationError('客户 ID 不能为空，请从订单详情中获取 customer_user_id', 'customer-id');
  }

  // 交互式输入可选字段
  if (!email && !phone && !name && !message) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: '客户邮箱（可选，按回车跳过）:',
      },
      {
        type: 'input',
        name: 'phone',
        message: '客户电话（可选，按回车跳过）:',
      },
      {
        type: 'input',
        name: 'name',
        message: '客户姓名（可选，按回车跳过）:',
      },
      {
        type: 'input',
        name: 'message',
        message: '初始消息（可选，按回车跳过）:',
      },
    ]);

    email = answers.email || undefined;
    phone = answers.phone || undefined;
    name = answers.name || undefined;
    message = answers.message || undefined;
  }

  const spinner = output.spinner('正在创建对话...');

  try {
    const data: any = {
      participants: [
        {
          role: 'customer',
          customer_id: customerId,
          ...(email && { customer_email: email }),
          ...(phone && { customer_phone: phone }),
          ...(name && { customer_name: name }),
        },
      ],
    };

    if (message) {
      data.initial_message = message;
    }

    const conversation = await commerceApi.conversations.create(data);
    spinner.succeed('对话创建成功！');

    if (output.isJson()) {
      output.success({
        conversation_id: conversation.id,
        customer_id: customerId,
        ...(email && { customer_email: email }),
        ...(phone && { customer_phone: phone }),
        ...(name && { customer_name: name }),
        ...(message && { initial_message: message })
      });
    } else {
      console.log();
      console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversation.id));
      console.log(chalk.gray('客户 ID: ') + chalk.cyan(customerId));
      if (email) console.log(chalk.gray('客户邮箱: ') + email);
      if (phone) console.log(chalk.gray('客户电话: ') + phone);
      if (name) console.log(chalk.gray('客户姓名: ') + name);
      console.log();
    }
  } catch (error: any) {
    spinner.fail('对话创建失败');
    throw createApiError(error);
  }
}
