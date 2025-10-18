import { Command } from 'commander';
import { listAddressesCommand } from './list.js';
import { getAddressCommand } from './get.js';
import { createAddressCommand } from './create.js';
import { updateAddressCommand } from './update.js';
import { deleteAddressCommand } from './delete.js';
import { setDefaultAddressCommand } from './set-default.js';

export const addressCommand = new Command('address')
  .description('地址管理')
  .addCommand(listAddressesCommand)
  .addCommand(getAddressCommand)
  .addCommand(createAddressCommand)
  .addCommand(updateAddressCommand)
  .addCommand(deleteAddressCommand)
  .addCommand(setDefaultAddressCommand);
