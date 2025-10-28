import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';
import { output } from '../../utils/output.js';
import { addEnhancedHelp } from '../../utils/helpText.js';

const cmd = new Command('languages')
  .description('List supported language codes for translations')
  .option('--all', 'Show all languages (including inactive)')
  .action(async (options) => {
    try {
      const spinner = output.spinner('正在获取语言列表...');
      const languages = await commerceApi.i18n.listLanguages(!options.all);
      spinner.succeed('语言列表获取成功');

      if (languages.length === 0) {
        if (output.isJson()) {
          output.success({
            languages: [],
            total: 0
          }, '暂无语言');
        } else {
          console.log(chalk.yellow('\n暂无语言\n'));
        }
        return;
      }

      if (output.isJson()) {
        output.success({
          languages: languages,
          total: languages.length
        });
      } else {
        const table = new Table({
          head: [chalk.cyan('代码'), chalk.cyan('名称'), chalk.cyan('本地名称'), chalk.cyan('状态')],
          colWidths: [10, 20, 20, 10],
        });

        languages.forEach((lang: any) => {
          const status = lang.is_active ? chalk.green('激活') : chalk.gray('未激活');
          table.push([
            lang.code,
            lang.english_name || '-',
            lang.native_name || '-',
            status,
          ]);
        });

        console.log('\n' + table.toString());
        console.log(chalk.gray(`\n共 ${languages.length} 种语言\n`));
      }
    } catch (error) {
      handleError(error);
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# List supported languages',
    '$ optima i18n languages',
    '',
    '# Show all languages including inactive',
    '$ optima i18n languages --all',
  ],
  output: {
    description: 'Returns list of language codes with names and status',
    example: JSON.stringify({
      success: true,
      data: {
        languages: [
          { code: 'en-US', english_name: 'English', native_name: 'English', is_active: true },
          { code: 'zh-CN', english_name: 'Chinese', native_name: '中文', is_active: true },
          { code: 'es-ES', english_name: 'Spanish', native_name: 'Español', is_active: true }
        ],
        total: 3
      }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'i18n product create', description: 'Create product translation' },
    { command: 'i18n category create', description: 'Create category translation' },
    { command: 'i18n merchant create', description: 'Create merchant translation' },
  ],
  notes: [
    'Supported codes: en-US, es-ES, ja-JP, vi-VN, zh-CN',
    'Use BCP 47 format (language-COUNTRY)',
    'By default shows only active languages',
  ]
});

export const languagesCommand = cmd;
