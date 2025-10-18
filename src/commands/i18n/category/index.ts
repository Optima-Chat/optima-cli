import { Command } from 'commander';
import { listCategoryTranslationsCommand } from './list.js';
import { getCategoryTranslationCommand } from './get.js';
import { createCategoryTranslationCommand } from './create.js';
import { updateCategoryTranslationCommand } from './update.js';
import { deleteCategoryTranslationCommand } from './delete.js';

export const categoryTranslationCommand = new Command('category')
  .description('分类翻译管理')
  .addCommand(listCategoryTranslationsCommand)
  .addCommand(getCategoryTranslationCommand)
  .addCommand(createCategoryTranslationCommand)
  .addCommand(updateCategoryTranslationCommand)
  .addCommand(deleteCategoryTranslationCommand);
