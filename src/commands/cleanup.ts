import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

export const cleanupCommand = new Command('cleanup')
  .description('清理 Claude Code 配置文件中的 Optima CLI 区块')
  .option('--yes', '跳过确认直接清理')
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
