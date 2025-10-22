import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { commerceApi } from '../../../api/rest/commerce.js';
import { handleError, ValidationError } from '../../../utils/error.js';
import { validateLanguageCode, SUPPORTED_LANGUAGES } from '../../../utils/validation.js';

interface CreateOptions {
  productId?: string;
  lang?: string;
  name?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export const createProductTranslationCommand = new Command('create')
  .description('创建商品翻译')
  .option('--product-id <id>', '商品 ID')
  .option('-l, --lang <code>', `语言代码（支持: ${SUPPORTED_LANGUAGES.join(', ')}）`)
  .option('-n, --name <name>', '翻译后的名称')
  .option('-d, --description <description>', '翻译后的描述')
  .option('--meta-title <title>', 'SEO 标题')
  .option('--meta-description <description>', 'SEO 描述')
  .action(async (options: CreateOptions) => {
    try {
      await createProductTranslation(options);
    } catch (error) {
      handleError(error);
    }
  });

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

  const spinner = ora('正在创建翻译...').start();
  const translation = await commerceApi.i18n.productTranslations.create(productId, data);
  spinner.succeed('翻译创建成功！');

  console.log();
  console.log(chalk.gray('语言代码: ') + chalk.cyan(translation.language_code));
  console.log(chalk.gray('名称: ') + chalk.white(translation.name));
  if (translation.description) {
    console.log(chalk.gray('描述: ') + chalk.white(translation.description));
  }
  console.log();
}
