import { Command } from 'commander';
import { listAddressesCommand } from './list.js';

export const addressCommand = new Command('address')
  .description('地址管理')
  .addCommand(listAddressesCommand);
