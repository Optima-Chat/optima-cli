import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError, createApiError, ValidationError } from '../../utils/error.js';

interface CreateOptions {
  email?: string;
  phone?: string;
  name?: string;
  message?: string;
}

export const createConversationCommand = new Command('create')
  .description('创建对话')
  .option('-e, --email <email>', '客户邮箱')
  .option('-p, --phone <phone>', '客户电话')
  .option('-n, --name <name>', '客户姓名')
  .option('-m, --message <message>', '初始消息')
  .action(async (options: CreateOptions) => {
    try {
      await createConversation(options);
    } catch (error) {
      handleError(error);
    }
  });

async function createConversation(options: CreateOptions) {
  let { email, phone, name, message } = options;

  // 如果没有提供任何客户信息，交互式输入
  if (!email && !phone && !name) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: '客户邮箱（可选）:',
      },
      {
        type: 'input',
        name: 'phone',
        message: '客户电话（可选）:',
      },
      {
        type: 'input',
        name: 'name',
        message: '客户姓名（可选）:',
      },
      {
        type: 'input',
        name: 'message',
        message: '初始消息（可选）:',
      },
    ]);

    email = answers.email || undefined;
    phone = answers.phone || undefined;
    name = answers.name || undefined;
    message = answers.message || undefined;
  }

  if (!email && !phone && !name) {
    throw new ValidationError('至少需要提供客户邮箱、电话或姓名之一', 'customer');
  }

  const spinner = ora('正在创建对话...').start();

  try {
    const data: any = {};
    if (email) data.customer_email = email;
    if (phone) data.customer_phone = phone;
    if (name) data.customer_name = name;
    if (message) data.initial_message = message;

    const conversation = await commerceApi.conversations.create(data);
    spinner.succeed('对话创建成功！');

    console.log();
    console.log(chalk.gray('对话 ID: ') + chalk.cyan(conversation.id));
    if (email) console.log(chalk.gray('客户邮箱: ') + email);
    if (phone) console.log(chalk.gray('客户电话: ') + phone);
    if (name) console.log(chalk.gray('客户姓名: ') + name);
    console.log();
  } catch (error: any) {
    spinner.fail('对话创建失败');
    throw createApiError(error);
  }
}
