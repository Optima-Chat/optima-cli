import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_CLAUDE_MD = path.join(process.cwd(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

// 从 NPM 包内读取模板内容
const TEMPLATE_CLAUDE_MD = path.join(__dirname, '..', '..', '.claude', 'CLAUDE.md');

function getOptimaSection(): string {
  try {
    const templateContent = fs.readFileSync(TEMPLATE_CLAUDE_MD, 'utf-8');
    const match = templateContent.match(
      new RegExp(`${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}`)
    );
    if (match) {
      return match[0];
    }
  } catch (error) {
    console.log(chalk.yellow('⚠️  无法读取模板文件，使用默认配置'));
  }

  // 降级方案：简化版配置
  return `${OPTIMA_START_MARKER}

电商店铺管理命令行工具。

使用 \`optima --help\` 查看所有命令。
${OPTIMA_END_MARKER}`;
}

export const initCommand = new Command('init')
  .description('在当前项目中启用 Optima CLI（添加完整配置到 .claude/CLAUDE.md）')
  .action(async () => {
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

      // 移除旧的 Optima CLI 区块（如果存在）
      if (hasExisting) {
        console.log(chalk.cyan('\n正在更新 Optima CLI 配置...\n'));

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
      const optimaSection = getOptimaSection();
      const newContent = existingContent.trim() + '\n\n' + optimaSection.trim() + '\n';
      fs.writeFileSync(PROJECT_CLAUDE_MD, newContent, 'utf-8');

      console.log(chalk.green('\n✓ Optima CLI 已在当前项目中启用'));
      console.log(chalk.gray(`  配置文件: ${PROJECT_CLAUDE_MD}`));
      console.log(chalk.gray('\n  现在可以使用 optima auth login 登录了！\n'));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 配置失败: ${error.message}\n`));
    }
  });
