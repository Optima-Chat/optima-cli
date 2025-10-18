import { Command } from 'commander';
import { listProductTranslationsCommand } from './list.js';
import { getProductTranslationCommand } from './get.js';
import { createProductTranslationCommand } from './create.js';
import { updateProductTranslationCommand } from './update.js';
import { deleteProductTranslationCommand } from './delete.js';

export const productTranslationCommand = new Command('product')
  .description('商品翻译管理')
  .addCommand(listProductTranslationsCommand)
  .addCommand(getProductTranslationCommand)
  .addCommand(createProductTranslationCommand)
  .addCommand(updateProductTranslationCommand)
  .addCommand(deleteProductTranslationCommand);
