#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');

// 动态读取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

const OPTIMA_CLI_SECTION = `
## Optima CLI

**当用户要求启用/使用 Optima CLI 时**：
1. 运行 \`optima init\` 启用完整功能（会在项目 .claude/CLAUDE.md 添加详细指令）
2. 提示用户运行 \`optima auth login\` 登录

**注意**：只有执行 \`optima init\` 后，你才能调用 optima 命令（如 \`optima product list\`）来处理用户的电商管理请求。
`;

const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

async function setupClaude() {
  try {
    // 确保 .claude 目录存在
    const claudeDir = path.dirname(CLAUDE_MD_PATH);
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // 读取现有内容
    let existingContent = '';
    if (fs.existsSync(CLAUDE_MD_PATH)) {
      existingContent = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

      // 如果已包含 Optima CLI 配置，先移除（更精确的正则）
      if (existingContent.includes(OPTIMA_START_MARKER)) {
        // 方法1：使用标记（如果有）
        if (existingContent.includes(OPTIMA_END_MARKER)) {
          const regex = new RegExp(
            `${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}\\n?`,
            'g'
          );
          existingContent = existingContent.replace(regex, '');
        } else {
          // 方法2：匹配到下一个 ## 标题或文件末尾
          // 使用更准确的正则：匹配从 ## Optima CLI 开始，到下一个 ## 或文件末尾
          const regex = /## Optima CLI[\s\S]*?(?=\n## [^\n]|\n*$)/g;
          existingContent = existingContent.replace(regex, '');
        }
        // 清理多余的空行
        existingContent = existingContent.replace(/\n{3,}/g, '\n\n').trim();
      }
    }

    // 写入新配置（带结束标记）
    const newContent = existingContent.trim() + '\n\n' + OPTIMA_CLI_SECTION.trim() + '\n' + OPTIMA_END_MARKER + '\n';
    fs.writeFileSync(CLAUDE_MD_PATH, newContent, 'utf-8');

    console.log('✓ Optima CLI 已配置到 Claude Code');
    console.log(`  版本: v${VERSION}`);
    console.log('  现在可以使用 optima auth login 登录了！');
  } catch (error) {
    // 静默失败，不影响安装
    // console.log('⚠️  Claude Code 配置失败，可以稍后手动运行: optima setup-claude');
  }
}

// 只在全局安装时执行
if (process.env.npm_config_global === 'true') {
  setupClaude();
}
