import { Command } from 'commander';
import { listCategoriesCommand } from './list.js';
import { createCategoryCommand } from './create.js';
import { getCategoryCommand } from './get.js';
import { updateCategoryCommand } from './update.js';
import { deleteCategoryCommand } from './delete.js';

export const categoryCommand = new Command('category')
  .description('分类管理')
  .addCommand(listCategoriesCommand)
  .addCommand(createCategoryCommand)
  .addCommand(getCategoryCommand)
  .addCommand(updateCategoryCommand)
  .addCommand(deleteCategoryCommand);
