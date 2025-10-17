import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const PROJECT_CLAUDE_MD = path.join(process.cwd(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

const FULL_OPTIMA_SECTION = `
## Optima CLI

电商店铺管理命令行工具。

### 可用命令

\`optima auth login\` - 登录（OAuth Device Flow，自动打开浏览器）
\`optima auth logout\` - 登出
\`optima auth whoami\` - 查看当前用户信息

其他功能正在开发中。
${OPTIMA_END_MARKER}
`;

export const initCommand = new Command('init')
  .description('在当前项目中启用 Optima CLI（添加完整配置到 .claude/CLAUDE.md）')
  .option('--force', '强制覆盖已存在的配置')
  .action(async (options) => {
    try {
      const claudeDir = path.dirname(PROJECT_CLAUDE_MD);

      // 确保 .claude 目录存在
      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      // 读取现有内容
      let existingContent = '';
      let hasExisting = false;

      if (fs.existsSync(PROJECT_CLAUDE_MD)) {
        existingContent = fs.readFileSync(PROJECT_CLAUDE_MD, 'utf-8');
        hasExisting = existingContent.includes(OPTIMA_START_MARKER);
      }

      // 如果已存在且未使用 --force，询问确认
      if (hasExisting && !options.force) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: '当前项目已配置 Optima CLI，是否覆盖？',
            default: false,
          },
        ]);

        if (!answer.confirm) {
          console.log(chalk.gray('\n已取消\n'));
          return;
        }
      }

      // 移除旧的 Optima CLI 区块（如果存在）
      if (hasExisting) {
        if (existingContent.includes(OPTIMA_END_MARKER)) {
          const regex = new RegExp(
            `${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}\\n?`,
            'g'
          );
          existingContent = existingContent.replace(regex, '');
        } else {
          const regex = /## Optima CLI[\s\S]*?(?=\n## [^\n]|\n*$)/g;
          existingContent = existingContent.replace(regex, '');
        }
        existingContent = existingContent.replace(/\n{3,}/g, '\n\n').trim();
      }

      // 写入新配置
      const newContent = existingContent.trim() + '\n\n' + FULL_OPTIMA_SECTION.trim() + '\n';
      fs.writeFileSync(PROJECT_CLAUDE_MD, newContent, 'utf-8');

      console.log(chalk.green('\n✓ Optima CLI 已在当前项目中启用'));
      console.log(chalk.gray(`  配置文件: ${PROJECT_CLAUDE_MD}`));
      console.log(chalk.gray('\n  现在可以使用 optima auth login 登录了！\n'));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 配置失败: ${error.message}\n`));
    }
  });
