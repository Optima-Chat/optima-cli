import { addEnhancedHelp } from '../../../utils/helpText.js';
import { Command } from 'commander';
import inquirer from 'inquirer';

import chalk from 'chalk';
import { output } from '../../../utils/output.js';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

interface CreateOptions {
  categoryId?: string;
  lang?: string;
  name?: string;
  description?: string;
}

const cmd = new Command('create')
  .description('创建分类翻译')
  .option('--category-id <id>', '分类 ID')
  .option('-l, --lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .action(async (options: CreateOptions) => {
    try {
      await createCategoryTranslation(options);
    } catch (error) {
      handleError(error);
    }
  });
addEnhancedHelp(cmd, {
  examples: ['$ optima i18n category create --category-id id-123 --lang zh-CN --name "名称"'],
  relatedCommands: [
    { command: 'i18n languages', description: 'View supported language codes' },
    { command: 'i18n category list', description: 'View all translations' },
  ],
  notes: ['Category ID, language code, and name are required', 'Supported: en-US, es-ES, ja-JP, vi-VN, zh-CN']
});

export const createCategoryTranslationCommand = cmd;

async function createCategoryTranslation(options: CreateOptions) {
  if (!options.categoryId || options.categoryId.trim().length === 0) {
    throw new ValidationError('分类 ID 不能为空', 'category-id');
  }

  const categoryId = options.categoryId;

  let { lang, name, description } = options;

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

  validateLanguageCode(lang);

  const data: any = {
    language_code: lang,
    name,
  };

  if (description) data.description = description;

  const spinner = output.spinner('正在创建翻译...');
  const translation = await commerceApi.i18n.categoryTranslations.create(categoryId, data);
  spinner.succeed('翻译创建成功！');

  if (output.isJson()) {
    output.success({
      category_id: categoryId,
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
