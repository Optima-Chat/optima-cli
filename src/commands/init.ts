import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const PROJECT_CLAUDE_MD = path.join(process.cwd(), '.claude', 'CLAUDE.md');
const OPTIMA_START_MARKER = '## Optima CLI';
const OPTIMA_END_MARKER = '<!-- END_OPTIMA_CLI -->';

// 从 package.json 读取版本号
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const VERSION = packageJson.version;

const FULL_OPTIMA_SECTION = `
## Optima CLI
Optima CLI 是用自然语言管理电商店铺的命令行工具，专为 Claude Code 设计。

**当前版本**: v${VERSION}

**安装**：\`npm install -g @optima-chat/optima-cli@latest\`

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

### 已实现功能

**认证**：
- \`optima auth login\` - OAuth 2.0 Device Flow 登录（自动打开浏览器授权）
- \`optima auth logout\` - 登出并清除本地凭证
- \`optima auth whoami\` - 显示当前用户信息
- 自动 Token 刷新（15 分钟有效期，自动使用 refresh_token 续期）

### 开发中功能（预计 2-3 周）

**商品**: \`optima product create/list/get/update/delete/add-images\`
**订单**: \`optima order list/get/ship/complete/cancel\`
**库存**: \`optima inventory low-stock/update/history\`
**物流**: \`optima shipping calculate/create/track\`
**店铺**: \`optima shop info/update/setup\`
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
