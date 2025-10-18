import { Command } from 'commander';
import { listOrdersCommand } from './list.js';
import { getOrderCommand } from './get.js';
import { shipOrderCommand } from './ship.js';
import { completeOrderCommand } from './complete.js';
import { cancelOrderCommand } from './cancel.js';

export const orderCommand = new Command('order')
  .description('订单管理')
  .addCommand(listOrdersCommand)
  .addCommand(getOrderCommand)
  .addCommand(shipOrderCommand)
  .addCommand(completeOrderCommand)
  .addCommand(cancelOrderCommand);
