import { Command } from 'commander';
import { lowStockCommand } from './low-stock.js';
import { updateStockCommand } from './update.js';
import { historyCommand } from './history.js';

export const inventoryCommand = new Command('inventory')
  .description('库存管理')
  .addCommand(lowStockCommand)
  .addCommand(updateStockCommand)
  .addCommand(historyCommand);
