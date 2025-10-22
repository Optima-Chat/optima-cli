import { Command } from 'commander';
import { listMerchantTranslationsCommand } from './list.js';
import { createMerchantTranslationCommand } from './create.js';
import { updateMerchantTranslationCommand } from './update.js';
import { deleteMerchantTranslationCommand } from './delete.js';

export const merchantTranslationCommand = new Command('merchant')
  .description('商户翻译管理')
  .addCommand(listMerchantTranslationsCommand)
  .addCommand(createMerchantTranslationCommand)
  .addCommand(updateMerchantTranslationCommand)
  .addCommand(deleteMerchantTranslationCommand);
