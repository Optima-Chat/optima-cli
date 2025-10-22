import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

interface CreateOptions {
  lang?: string;
  name?: string;
  description?: string;
}

export const createMerchantTranslationCommand = new Command('create')
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

async function createMerchantTranslation(options: CreateOptions) {
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

  const spinner = ora('正在创建翻译...').start();
  const translation = await commerceApi.i18n.merchantTranslations.create(data);
  spinner.succeed('翻译创建成功！');

  console.log();
  console.log(chalk.gray('语言代码: ') + chalk.cyan(translation.language_code));
  console.log(chalk.gray('名称: ') + chalk.white(translation.name));
  if (translation.description) {
    console.log(chalk.gray('描述: ') + chalk.white(translation.description));
  }
  console.log();
}
