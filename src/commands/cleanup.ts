import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { isInteractiveEnvironment } from '../utils/interactive.js';
import { ValidationError } from '../utils/error.js';

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

import { addEnhancedHelp } from '../utils/helpText.js';

const cmd = new Command('cleanup')
  .description('Remove Optima CLI config from Claude Code global settings')
  .option('--yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options) => {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(CLAUDE_MD_PATH)) {
        console.log(chalk.yellow('\n⚠️  未找到 Claude Code 配置文件\n'));
        return;
      }

      // 读取内容
      const content = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

      // 检查是否包含 Optima CLI 配置
      if (!content.includes(OPTIMA_START_MARKER)) {
        console.log(chalk.yellow('\n⚠️  配置文件中未找到 Optima CLI 区块\n'));
        return;
      }

      // 确认
      if (!options.yes) {
        if (isInteractiveEnvironment()) {
          // 交互模式：显示确认提示
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: '确定要从 Claude Code 配置中移除 Optima CLI 区块吗？',
              default: false,
            },
          ]);

          if (!answer.confirm) {
            console.log(chalk.gray('\n已取消\n'));
            return;
          }
        } else {
          // 非交互模式：要求使用 --yes 标志
          throw new ValidationError(
            '非交互环境需要使用 --yes 标志确认清理操作',
            'yes'
          );
        }
      }

      // 移除 Optima CLI 区块
      let newContent = content;
      if (content.includes(OPTIMA_END_MARKER)) {
        const regex = new RegExp(
          `${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}\\n?`,
          'g'
        );
        newContent = newContent.replace(regex, '');
      } else {
        const regex = /## Optima CLI[\s\S]*?(?=\n## [^\n]|\n*$)/g;
        newContent = newContent.replace(regex, '');
      }

      // 清理多余空行
      newContent = newContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

      // 写回文件
      fs.writeFileSync(CLAUDE_MD_PATH, newContent, 'utf-8');

      console.log(chalk.green('\n✓ 已从 Claude Code 配置中移除 Optima CLI'));
      console.log(chalk.gray(`  配置文件: ${CLAUDE_MD_PATH}\n`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 清理失败: ${error.message}\n`));
    }
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Remove Optima config with confirmation',
    '$ optima cleanup',
    '',
    '# Remove without confirmation (non-interactive)',
    '$ optima cleanup --yes',
  ],
  output: {
    description: 'Removes Optima CLI section from ~/.claude/CLAUDE.md',
    example: 'Configuration file: /Users/username/.claude/CLAUDE.md'
  },
  relatedCommands: [
    { command: 'init', description: 'Re-enable Optima in project' },
    { command: 'auth logout', description: 'Logout before cleanup' },
  ],
  notes: [
    'Removes global configuration from ~/.claude/CLAUDE.md',
    'Requires confirmation unless --yes flag is used',
    'Does not affect tokens or login status',
    'Project-level configs (.claude/CLAUDE.md) are not affected',
  ]
});

export const cleanupCommand = cmd;
