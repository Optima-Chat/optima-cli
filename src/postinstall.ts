#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GLOBAL_CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');
// 从环境变量获取安装时的工作目录
const INSTALL_CWD = process.env.INIT_CWD || process.env.PWD || process.cwd();
const PROJECT_CLAUDE_MD_PATH = path.join(INSTALL_CWD, '.claude', 'CLAUDE.md');
const TEMPLATE_CLAUDE_MD = path.join(__dirname, '..', '.claude', 'CLAUDE.md');

// 动态读取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

// 简化版配置（用于全局）
const GLOBAL_OPTIMA_SECTION = `
## Optima CLI

**全局可用** - 安装后即可在任何项目中使用 Optima 命令。

**常见需求映射**：
- "登录 Optima" / "Optima 登录" → \`optima auth login\`
- "查看商品" / "商品列表" → \`optima product list\`
- "创建商品 XX，价格 YY" → \`optima product create --title XX --price YY\`
- "订单 XX 发货" → \`optima order ship XX\`
- "给商品添加中文翻译" → \`optima i18n product create ...\`

**项目级启用**：如果用户想在当前项目启用完整配置文档，运行 \`optima init\`。

使用 \`optima --help\` 查看所有可用命令。
`;

// 从模板读取完整的 Optima CLI 配置
function getFullOptimaSection(): string {
  try {
    const templateContent = fs.readFileSync(TEMPLATE_CLAUDE_MD, 'utf-8');
    const match = templateContent.match(
      new RegExp(`${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}`)
    );
    if (match) {
      return match[0];
    }
  } catch (error) {
    // 如果读取失败，返回 null
  }
  return '';
}

// 通用的更新 CLAUDE.md 函数
function updateClaudeFile(filePath: string, optimaSection: string): boolean {
  try {
    const claudeDir = path.dirname(filePath);

    // 确保目录存在
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // 读取现有内容
    let existingContent = '';
    if (fs.existsSync(filePath)) {
      existingContent = fs.readFileSync(filePath, 'utf-8');

      // 移除旧的 Optima CLI 配置
      if (existingContent.includes(OPTIMA_START_MARKER)) {
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
    }

    // 写入新配置
    const newContent = existingContent.trim() + '\n\n' + optimaSection.trim() + '\n';
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

async function setupClaude() {
  try {
    // 更新全局 CLAUDE.md（简化版）
    const globalUpdated = updateClaudeFile(
      GLOBAL_CLAUDE_MD_PATH,
      GLOBAL_OPTIMA_SECTION + '\n' + OPTIMA_END_MARKER
    );

    // 如果当前项目有 .claude/CLAUDE.md，更新完整版
    if (fs.existsSync(PROJECT_CLAUDE_MD_PATH)) {
      const fullSection = getFullOptimaSection();
      if (fullSection) {
        updateClaudeFile(PROJECT_CLAUDE_MD_PATH, fullSection);
        console.log('✓ 已更新项目级 Optima CLI 配置');
      }
    }

    if (globalUpdated) {
      console.log('✓ Optima CLI 已配置到 Claude Code');
      console.log(`  版本: v${VERSION}`);
      console.log('  现在可以使用 optima auth login 登录了！');
    }
  } catch (error) {
    // 静默失败，不影响安装
  }
}

// 总是执行（函数内部会检查文件是否存在）
setupClaude();
