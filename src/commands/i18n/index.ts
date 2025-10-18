import { Command } from 'commander';
import { languagesCommand } from './languages.js';
import { productTranslationCommand } from './product/index.js';
import { categoryTranslationCommand } from './category/index.js';
import { merchantTranslationCommand } from './merchant/index.js';

export const i18nCommand = new Command('i18n')
  .description('国际化翻译管理')
  .addCommand(languagesCommand)
  .addCommand(productTranslationCommand)
  .addCommand(categoryTranslationCommand)
  .addCommand(merchantTranslationCommand);
