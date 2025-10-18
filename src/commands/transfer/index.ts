import { Command } from 'commander';
import { listTransfersCommand } from './list.js';
import { summaryCommand } from './summary.js';

export const transferCommand = new Command('transfer')
  .description('财务管理')
  .addCommand(listTransfersCommand)
  .addCommand(summaryCommand);
