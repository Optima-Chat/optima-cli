import { Command } from 'commander';
import { calculateCommand } from './calculate.js';
import { historyCommand } from './history.js';
import { updateStatusCommand } from './update-status.js';

export const shippingCommand = new Command('shipping')
  .description('物流管理')
  .addCommand(calculateCommand)
  .addCommand(historyCommand)
  .addCommand(updateStatusCommand);
