import { Command } from 'commander';
import { listVariantsCommand } from './list.js';
import { createVariantCommand } from './create.js';
import { updateVariantCommand } from './update.js';
import { deleteVariantCommand } from './delete.js';
import { addVariantImagesCommand } from './add-images.js';

export const variantCommand = new Command('variant')
  .description('商品变体管理')
  .addCommand(listVariantsCommand)
  .addCommand(createVariantCommand)
  .addCommand(updateVariantCommand)
  .addCommand(deleteVariantCommand)
  .addCommand(addVariantImagesCommand);
