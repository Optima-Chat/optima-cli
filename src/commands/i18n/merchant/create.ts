import { addEnhancedHelp } from '../../../utils/helpText.js';
import { Command } from 'commander';
import inquirer from 'inquirer';

import chalk from 'chalk';
import { output } from '../../../utils/output.js';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';
import { isInteractiveEnvironment, requireParam } from '../../../utils/interactive.js';

interface CreateOptions {
  lang?: string;
  name?: string;
  description?: string;
}

const cmd = new Command('create')
  .description('创建商户翻译')
  .option('-l, --lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .action(async (options: CreateOptions) => {
    try {
      await createMerchantTranslation(options);
    } catch (error) {
      handleError(error);
    }
  });
addEnhancedHelp(cmd, {
  examples: ['$ optima i18n merchant create --lang zh-CN --name "名称"'],
  relatedCommands: [
    { command: 'i18n languages', description: 'View supported language codes' },
    { command: 'i18n merchant list', description: 'View all translations' },
  ],
  notes: ['Merchant ID, language code, and name are required', 'Supported: en-US, es-ES, ja-JP, vi-VN, zh-CN']
});

export const createMerchantTranslationCommand = cmd;

async function createMerchantTranslation(options: CreateOptions) {
  let { lang, name, description } = options;

  // 检测环境
  if (isInteractiveEnvironment()) {
    // 交互模式：填写必填字段
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
  } else {
    // 非交互模式：直接验证参数
    lang = requireParam(options.lang, 'lang', '语言代码');
    name = requireParam(options.name, 'name', '翻译名称');
  }

  // Validate lang and name exist (both modes)
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
  const translation = await commerceApi.i18n.merchantTranslations.create(data);
  spinner.succeed('翻译创建成功！');

  if (output.isJson()) {
    output.success({
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
