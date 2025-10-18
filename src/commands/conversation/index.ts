import { Command } from 'commander';
import { listConversationsCommand } from './list.js';
import { getConversationCommand } from './get.js';
import { createConversationCommand } from './create.js';
import { closeConversationCommand } from './close.js';
import { messagesCommand } from './messages.js';
import { sendMessageCommand } from './send.js';
import { markReadCommand } from './mark-read.js';

export const conversationCommand = new Command('conversation')
  .alias('conv')
  .description('对话管理')
  .addCommand(listConversationsCommand)
  .addCommand(getConversationCommand)
  .addCommand(createConversationCommand)
  .addCommand(closeConversationCommand)
  .addCommand(messagesCommand)
  .addCommand(sendMessageCommand)
  .addCommand(markReadCommand);
