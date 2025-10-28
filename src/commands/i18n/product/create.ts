import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';
import { output } from '../../../utils/output.js';

interface CreateOptions {
  productId?: string;
  lang?: string;
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

import { addEnhancedHelp } from '../../../utils/helpText.js';

const cmd = new Command('create')
  .description('Create product translation for a specific language')
  .option('--product-id <id>', 'Product ID (required)')
  .option('-l, --lang <code>', `Language code (required, supported: ${SUPPORTED_LANGUAGES.join(', ')})`)
  .option('-n, --name <name>', 'Translated product name (required)')
  .option('-d, --description <description>', 'Translated description (optional)')
  .option('--meta-title <title>', 'SEO title (optional)')
  .option('--meta-description <description>', 'SEO description (optional)')
  .action(async (options: CreateOptions) => {
    try {
      await createProductTranslation(options);
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create Chinese translation for product',
    '$ optima i18n product create \\',
    '  --product-id prod-123 \\',
    '  --lang zh-CN \\',
    '  --name "陶瓷杯" \\',
    '  --description "精美手工陶瓷杯"',
  ],
  output: {
    example: JSON.stringify({
      success: true,
      data: {
        product_id: 'uuid',
        language_code: 'zh-CN',
        translation: { language_code: 'zh-CN', name: '陶瓷杯', description: '精美手工陶瓷杯' }
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'i18n languages', description: 'View supported language codes' },
    { command: 'i18n product list', description: 'View all translations for product' },
    { command: 'product get', description: 'View original product details' },
  ],
  notes: [
    'Product ID, language code, and name are required',
    'Supported languages: en-US, es-ES, ja-JP, vi-VN, zh-CN',
    'Use BCP 47 format (e.g., zh-CN not zh)',
  ]
});

export const createProductTranslationCommand = cmd;

async function createProductTranslation(options: CreateOptions) {
  if (!options.productId || options.productId.trim().length === 0) {
    throw new ValidationError('商品 ID 不能为空', 'product-id');
  }

  const productId = options.productId;

  let { lang, name, description, metaTitle, metaDescription } = options;

  // 交互式填写必填字段
  if (!lang || !name) {
    const questions: any[] = [];

    if (!lang) {
      questions.push({
        type: 'input',
        name: 'lang',
        message: `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）:`,
        validate: (input: string) => {
          if (input.trim().length === 0) return '语言代码不能为空';
          try {
            validateLanguageCode(input);
            return true;
          } catch (error: any) {
            return error.message;
          }
        },
      });
    }

    if (!name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: '翻译后的名称:',
        validate: (input: string) => {
          return input.trim().length > 0 ? true : '名称不能为空';
        },
      });
    }

    const answers = await inquirer.prompt(questions);
    lang = lang || answers.lang;
    name = name || answers.name;
  }

  if (!lang || !name) {
    throw new ValidationError('语言代码和名称不能为空', 'lang/name');
  }

  // Validate language code format
  validateLanguageCode(lang);

  const data: any = {
    language_code: lang,
    name,
  };

  if (description) data.description = description;
  if (metaTitle) data.meta_title = metaTitle;
  if (metaDescription) data.meta_description = metaDescription;

  const spinner = output.spinner('正在创建翻译...');
  const translation = await commerceApi.i18n.productTranslations.create(productId, data);
  spinner.succeed('翻译创建成功！');

  if (output.isJson()) {
    output.success({
      product_id: productId,
      language_code: translation.language_code,
      translation: translation
    });
  } else {
    console.log();
    console.log(chalk.gray('语言代码: ') + chalk.cyan(translation.language_code));
    console.log(chalk.gray('名称: ') + chalk.white(translation.name));
    if (translation.description) {
      console.log(chalk.gray('描述: ') + chalk.white(translation.description));
    }
    console.log();
  }
}
