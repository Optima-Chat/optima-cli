#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

async function cleanupClaude() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(CLAUDE_MD_PATH)) {
      return;
    }

    // 读取现有内容
    let content = fs.readFileSync(CLAUDE_MD_PATH, 'utf-8');

    // 检查是否包含 Optima CLI 配置
    if (!content.includes(OPTIMA_START_MARKER)) {
      return;
    }

    // 移除 Optima CLI 区块
    if (content.includes(OPTIMA_END_MARKER)) {
      // 使用标记精确删除
      const regex = new RegExp(
        `${OPTIMA_START_MARKER}[\\s\\S]*?${OPTIMA_END_MARKER}\\n?`,
        'g'
      );
      content = content.replace(regex, '');
    } else {
      // 兼容旧版本：匹配到下一个 ## 或文件末尾
      const regex = /## Optima CLI[\s\S]*?(?=\n## [^\n]|\n*$)/g;
      content = content.replace(regex, '');
    }

    // 清理多余空行
    content = content.replace(/\n{3,}/g, '\n\n').trim() + '\n';

    // 写回文件
    fs.writeFileSync(CLAUDE_MD_PATH, content, 'utf-8');

    console.log('✓ 已从 Claude Code 配置中移除 Optima CLI');
  } catch (error) {
    // 静默失败，不影响卸载
    // console.log('⚠️  清理 Claude Code 配置失败');
  }
}

// 检查是否为全局安装位置
// 全局卸载时，脚本位置通常在 global node_modules 中
const isGlobalLocation = __dirname.includes('/node_modules/@optima-chat/optima-cli/dist') ||
                         __dirname.includes('\\node_modules\\@optima-chat\\optima-cli\\dist');

if (isGlobalLocation || process.env.npm_config_global === 'true') {
  cleanupClaude();
}
