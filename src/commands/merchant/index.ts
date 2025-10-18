import { Command } from 'commander';
import { infoCommand } from './info.js';
import { updateCommand } from './update.js';
import { setupCommand } from './setup.js';
import { urlCommand } from './url.js';

export const merchantCommand = new Command('merchant')
  .description('商户管理')
  .addCommand(infoCommand)
  .addCommand(updateCommand)
  .addCommand(setupCommand)
  .addCommand(urlCommand);
