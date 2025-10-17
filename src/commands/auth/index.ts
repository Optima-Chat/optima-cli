import { Command } from 'commander';
import { loginCommand } from './login.js';
import { logoutCommand } from './logout.js';
import { whoamiCommand } from './whoami.js';

export const authCommand = new Command('auth')
  .description('认证管理')
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(whoamiCommand);
