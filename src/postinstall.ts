#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

const CLAUDE_MD_PATH = path.join(os.homedir(), '.claude', 'CLAUDE.md');

const OPTIMA_CLI_SECTION = `
## Optima CLI
Optima CLI 是用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

**当前版本**: v0.1.0（占位版本，核心功能开发中）

安装：\`npm install -g @optima-chat/optima-cli@latest\`

### 使用方式

直接用自然语言描述你的需求，我会自动调用相应的 optima 命令。

**商品管理示例**:
- "创建珍珠耳环，299 美元，库存 10"
- "查看所有商品"
- "商品 prod_123 改价 399"
- "删除商品 prod_456"

**订单管理示例**:
- "今天的订单"
- "待发货订单"
- "订单 order_123 发货，DHL123456"
- "取消订单 order_789"

**库存管理示例**:
- "库存低于 5"
- "商品 prod_123 库存改 50"

**物流查询示例**:
- "香港到纽约运费，0.5 公斤"
- "跟踪 DHL123456"

### 可用命令（供参考，建议用自然语言）

**商品**: \`optima product create/list/get/update/delete/add-images\`
**订单**: \`optima order list/get/ship/complete/cancel\`
**库存**: \`optima inventory low-stock/update/history\`
**物流**: \`optima shipping calculate/create/track\`
**店铺**: \`optima shop info/update/setup\`
**认证**: \`optima auth login/logout/whoami\`

**注意**: 当前版本为占位版本，以上功能正在开发中。
`;

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

      // 如果已包含 Optima CLI 配置，先移除
      if (existingContent.includes('## Optima CLI')) {
        existingContent = existingContent.replace(
          /## Optima CLI[\s\S]*?(?=\n##|$)/,
          ''
        );
      }
    }

    // 写入新配置
    const newContent = existingContent.trim() + '\n\n' + OPTIMA_CLI_SECTION.trim() + '\n';
    fs.writeFileSync(CLAUDE_MD_PATH, newContent, 'utf-8');

    console.log('✓ Optima CLI 已配置到 Claude Code');
    console.log('  现在可以在 Claude Code 中用自然语言管理店铺了！');
    console.log('  (当前为 v0.1.0 占位版本，核心功能开发中)');
  } catch (error) {
    // 静默失败，不影响安装
    // console.log('⚠️  Claude Code 配置失败，可以稍后手动运行: optima setup-claude');
  }
}

// 只在全局安装时执行
if (process.env.npm_config_global === 'true') {
  setupClaude();
}
