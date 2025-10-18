import { Command } from 'commander';
import { createRefundCommand } from './create.js';
import { getRefundCommand } from './get.js';

export const refundCommand = new Command('refund')
  .description('退款管理')
  .addCommand(createRefundCommand)
  .addCommand(getRefundCommand);
