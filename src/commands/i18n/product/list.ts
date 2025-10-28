import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { output } from '../../../utils/output.js';
import { addEnhancedHelp } from '../../../utils/helpText.js';

const cmd = new Command('list')
  .description('List all translations for a product')
  .option('--product-id <id>', 'Product ID (required)')
  .action(async (options: { productId?: string }) => {
    try {
      if (!options.productId || options.productId.trim().length === 0) {
        throw new ValidationError('商品 ID 不能为空', 'product-id');
      }

      const productId = options.productId;

      const spinner = output.spinner('正在获取商品翻译...');
      const translations = await commerceApi.i18n.productTranslations.list(productId);
      spinner.succeed('商品翻译获取成功');

      if (translations.length === 0) {
        if (output.isJson()) {
          output.success({
            product_id: productId,
            translations: [],
            total: 0
          }, '该商品暂无翻译');
        } else {
          console.log(chalk.yellow('\n该商品暂无翻译\n'));
        }
        return;
      }

      if (output.isJson()) {
        output.success({
          product_id: productId,
          translations: translations,
          total: translations.length
        });
      } else {
        const table = new Table({
          head: [chalk.cyan('语言代码'), chalk.cyan('名称'), chalk.cyan('描述预览')],
          colWidths: [12, 30, 50],
        });

        translations.forEach((trans: any) => {
          const descPreview = trans.description
            ? trans.description.substring(0, 47) + (trans.description.length > 47 ? '...' : '')
            : '-';

          table.push([
            trans.language_code,
            trans.name || '-',
            descPreview,
          ]);
        });

        console.log('\n' + table.toString());
        console.log(chalk.gray(`\n共 ${translations.length} 个翻译\n`));
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List all translations for product',
    '$ optima i18n product list --product-id prod-123',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        translations: [
          { language_code: 'zh-CN', name: '陶瓷杯', description: '精美手工陶瓷杯' },
          { language_code: 'es-ES', name: 'Taza cerámica', description: 'Taza hecha a mano' }
        ],
        total: 2
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'i18n product create', description: 'Add new translation' },
    { command: 'i18n product get', description: 'View specific translation' },
  ],
  notes: ['Product ID is required', 'Shows all existing translations for the product']
});

export const listProductTranslationsCommand = cmd;
