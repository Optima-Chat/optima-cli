import { Command } from 'commander';
import { createProductCommand } from './create.js';
import { listProductsCommand } from './list.js';
import { getProductCommand } from './get.js';
import { updateProductCommand } from './update.js';
import { deleteProductCommand } from './delete.js';
import { addImagesCommand } from './add-images.js';
import { urlCommand } from './url.js';

export const productCommand = new Command('product')
  .description('商品管理')
  .addCommand(createProductCommand)
  .addCommand(listProductsCommand)
  .addCommand(getProductCommand)
  .addCommand(updateProductCommand)
  .addCommand(deleteProductCommand)
  .addCommand(addImagesCommand)
  .addCommand(urlCommand);
