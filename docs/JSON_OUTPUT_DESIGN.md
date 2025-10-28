# JSON 输出格式设计方案

> **Issue**: #9 - 默认输出 JSON 格式以优化 AI Agent 解析
> **状态**: 待实施
> **作者**: Claude Code
> **日期**: 2025-10-28

---

## 📋 问题背景

`optima-cli` 主要设计用于 AI Shell (optima-ai-shell) 中的 AI Agent 调用，当前的表格格式输出（带 ANSI 颜色代码）对 AI 解析造成困难：

1. **Token 消耗高**：表格边框和 ANSI 代码占用 50%+ tokens
2. **解析不可靠**：AI 可能误读表格对齐或颜色代码
3. **响应慢**：AI 需要额外推理来理解格式化文本

### 当前输出示例

```bash
$ optima product list
┌──────────────────────────────────────┬────────────┬──────────┬────────┬────────┬──────────┐
│ ID                                   │ 名称       │ 价格     │ 库存   │ 状态   │ 创建时间 │
├──────────────────────────────────────┼────────────┼──────────┼────────┼────────┼──────────┤
│ 9771d11b-d7d5-46fa-bddc-34e633d4ab48 │ 测试商品   │ $99.00   │ 10     │ 在售   │ 2025-10-28│
└──────────────────────────────────────┴────────────┴──────────┴────────┴────────┴──────────┘

共 1 件商品
```

**问题**：
- 表格边框占用大量字符
- ANSI 颜色代码（如 `\x1b[36m`）干扰解析
- AI 需要理解中文和表格结构

---

## 🎯 设计目标

1. **默认 JSON 输出**：结构化、易解析、Token 高效
2. **保留人类可读选项**：`--pretty` / `--table` 输出原有格式
3. **统一响应结构**：成功/失败使用一致的 JSON schema
4. **向后兼容**：逐步迁移，避免破坏现有用户

---

## 📊 当前代码统计

### 命令数量
- **16 个模块**: auth, product, order, category, variant, merchant, shipping, inventory, conversation, i18n, upload, transfer, refund, shipping-zone, cart, checkout
- **73 个命令文件**（不含 index.ts）
- **57 个实际命令**

### 输出模式分布
| 模式 | 使用文件数 | 说明 |
|------|-----------|------|
| `Table` (cli-table3) | 10 | 表格输出 |
| `chalk` (颜色) | 63 | 彩色文本 |
| `console.log` | 73 | 标准输出 |
| `ora` (spinner) | 69 | 加载动画 |

### 命令类型分布
| 类型 | 数量 | 示例 |
|------|------|------|
| 列表命令 | ~15 | product list, order list, category list |
| 详情命令 | ~15 | product get, order get, merchant info |
| 操作命令 | ~27 | create, update, delete, ship, cancel |

---

## 🏗️ 技术方案

### 方案 A：渐进式重构（推荐）

#### 阶段 1：基础设施（2-3 小时）

**1.1 创建统一输出工具** `src/utils/output.ts`

```typescript
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { program } from 'commander';

/**
 * 输出格式枚举
 */
export enum OutputFormat {
  JSON = 'json',
  PRETTY = 'pretty'
}

/**
 * CLI 响应结构
 */
export interface CliResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

/**
 * Mock Spinner（JSON 模式下不显示 spinner）
 */
class MockSpinner {
  succeed() { return this; }
  fail() { return this; }
  stop() { return this; }
  start() { return this; }
}

/**
 * 输出管理器
 */
export class OutputManager {
  private format: OutputFormat;

  constructor() {
    // 优先级：CLI 参数 > 环境变量 > 默认值
    const opts = program.opts();

    if (opts.pretty) {
      this.format = OutputFormat.PRETTY;
    } else if (opts.json) {
      this.format = OutputFormat.JSON;
    } else {
      const envFormat = process.env.OPTIMA_CLI_FORMAT?.toLowerCase();
      this.format = envFormat === 'pretty'
        ? OutputFormat.PRETTY
        : OutputFormat.JSON;
    }
  }

  /**
   * 获取当前输出格式
   */
  getFormat(): OutputFormat {
    return this.format;
  }

  /**
   * 输出成功响应
   */
  success(data: any, message?: string): void {
    if (this.format === OutputFormat.JSON) {
      const response: CliResponse = {
        success: true,
        data,
        ...(message && { message })
      };
      console.log(JSON.stringify(response, null, 2));
    } else {
      // Pretty 模式：保留原有格式化逻辑
      if (message) {
        console.log(chalk.green(`✓ ${message}`));
      }
      // 数据由调用方负责格式化（使用 format.ts 中的函数）
    }
  }

  /**
   * 输出错误响应
   */
  error(error: Error | string, code?: string): never {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    if (this.format === OutputFormat.JSON) {
      const response: CliResponse = {
        success: false,
        error: {
          code: code || errorObj.name || 'UNKNOWN_ERROR',
          message: errorObj.message,
          ...(process.env.DEBUG === 'true' && {
            stack: errorObj.stack,
            details: (errorObj as any).details
          })
        }
      };
      console.log(JSON.stringify(response, null, 2));
      process.exit(1);
    } else {
      // Pretty 模式：使用原有错误处理
      const { handleError } = require('./error.js');
      handleError(errorObj);
    }
  }

  /**
   * 创建 spinner（JSON 模式下返回 mock）
   */
  spinner(text: string): Ora | MockSpinner {
    if (this.format === OutputFormat.JSON) {
      return new MockSpinner() as any;
    }
    return ora(text).start();
  }

  /**
   * 判断是否为 JSON 模式
   */
  isJson(): boolean {
    return this.format === OutputFormat.JSON;
  }

  /**
   * 判断是否为 Pretty 模式
   */
  isPretty(): boolean {
    return this.format === OutputFormat.PRETTY;
  }
}

/**
 * 全局输出管理器实例
 */
export const output = new OutputManager();
```

**1.2 修改全局选项** `src/index.ts`

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('optima')
  .description('Optima Commerce CLI - 电商管理命令行工具')
  .version(VERSION)
  // 新增全局输出选项
  .option('--json', '输出 JSON 格式（默认，AI 友好）', true)
  .option('--pretty', '输出表格格式（人类可读）')
  .option('--no-color', '禁用颜色输出');

// 注册所有命令模块...
program.addCommand(authCommand);
program.addCommand(productCommand);
// ...

program.parse();
```

**1.3 环境变量支持**

```bash
# 用户可以在 ~/.bashrc 或 ~/.zshrc 中设置
export OPTIMA_CLI_FORMAT=json   # 或 pretty
export OPTIMA_CLI_NO_COLOR=1    # 禁用颜色
```

---

#### 阶段 2：核心命令迁移（6-8 小时）

优先迁移 **20 个高频命令**，覆盖 80% 使用场景。

##### 迁移模式示例

**Before** (`src/commands/product/list.ts`):
```typescript
async function listProducts(options: ListProductsOptions) {
  const spinner = ora('正在获取商品列表...').start();

  const result = await commerceApi.products.list(params);
  spinner.stop();

  if (!result.products || result.products.length === 0) {
    console.log(chalk.yellow('\n暂无商品\n'));
    return;
  }

  console.log();
  console.log(formatProductList(result.products));
  console.log(chalk.gray(`\n显示 ${offset + 1}-${end} / 共 ${total} 件商品`));
  console.log();
}
```

**After**:
```typescript
import { output } from '../../utils/output.js';
import { formatProductList } from '../../utils/format.js';

async function listProducts(options: ListProductsOptions) {
  const spinner = output.spinner('正在获取商品列表...');

  const result = await commerceApi.products.list(params);
  spinner.succeed('商品列表获取成功');

  if (!result.products || result.products.length === 0) {
    output.success({
      products: [],
      total: 0,
      page: params.page,
      per_page: params.per_page
    }, '暂无商品');
    return;
  }

  if (output.isJson()) {
    // JSON 模式：输出结构化数据
    output.success({
      products: result.products,
      total: result.total,
      page: result.page,
      per_page: result.per_page,
      has_next: result.total > (params.offset + params.limit)
    });
  } else {
    // Pretty 模式：保留原有表格输出
    console.log();
    console.log(formatProductList(result.products));
    console.log(chalk.gray(`\n显示 ${offset + 1}-${end} / 共 ${total} 件商品`));

    if (result.total > params.offset + params.limit) {
      const nextOffset = params.offset + params.limit;
      console.log(
        chalk.gray(`下一页: `) +
        chalk.cyan(`optima product list --limit ${params.limit} --offset ${nextOffset}`)
      );
    }
    console.log();
  }
}
```

##### 错误处理迁移

**Before** (`src/utils/error.ts`):
```typescript
export function handleError(error: unknown): never {
  if (error instanceof AuthenticationError) {
    console.error(chalk.red(`\n❌ 认证错误: ${error.message}`));
    console.error(chalk.gray('\n提示: 运行 ') + chalk.cyan('optima auth login') + chalk.gray(' 登录\n'));
    process.exit(1);
  }
  // ...
}
```

**After**:
```typescript
import { output } from './output.js';

export function handleError(error: unknown): never {
  if (error instanceof AuthenticationError) {
    output.error(error, 'AUTH_REQUIRED');
  }

  if (error instanceof ValidationError) {
    output.error(error, 'VALIDATION_ERROR');
  }

  if (error instanceof ApiError) {
    output.error(error, error.code || 'API_ERROR');
  }

  // 默认错误
  output.error(error as Error, 'UNKNOWN_ERROR');
}
```

##### 优先迁移命令列表

| 模块 | 命令 | 使用频率 | 优先级 |
|------|------|---------|--------|
| auth | login, whoami | 极高 | P0 |
| product | list, get, create | 极高 | P0 |
| order | list, get | 高 | P0 |
| merchant | info | 高 | P0 |
| category | list, get | 中 | P1 |
| shipping-zone | list | 中 | P1 |
| inventory | low-stock, update | 中 | P1 |
| variant | list, get | 中 | P1 |
| conversation | list, get | 中 | P1 |
| upload | image | 中 | P1 |

**总计**：约 20 个命令

---

#### 阶段 3：剩余命令迁移（8-10 小时）

- 剩余 ~37 个命令
- 使用脚本辅助批量重构相似命令
- 分模块逐步迁移

---

#### 阶段 4：测试与文档（5-6 小时）

**4.1 单元测试**

```typescript
// tests/output.test.ts
import { output, OutputFormat } from '../src/utils/output';

describe('OutputManager', () => {
  it('should output JSON format', () => {
    process.env.OPTIMA_CLI_FORMAT = 'json';
    const consoleSpy = jest.spyOn(console, 'log');

    output.success({ id: '123', name: 'Test' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('"success": true')
    );
  });

  it('should handle errors in JSON format', () => {
    process.env.OPTIMA_CLI_FORMAT = 'json';
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation();

    try {
      output.error(new Error('Test error'), 'TEST_ERROR');
    } catch (e) {}

    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
```

**4.2 集成测试**

```bash
# tests/integration/product.test.sh

# JSON 输出测试
result=$(OPTIMA_TOKEN="$TOKEN" node dist/index.js product list --json)
echo "$result" | jq -e '.success == true'
echo "$result" | jq -e '.data.products | length > 0'

# Pretty 输出测试
result=$(OPTIMA_TOKEN="$TOKEN" node dist/index.js product list --pretty)
echo "$result" | grep -q "共.*件商品"
```

**4.3 文档更新**

- 更新 `README.md` 说明输出格式选项
- 更新 `.claude/CLAUDE.md` 和 `CLAUDE.md`
- 添加 JSON schema 文档
- 更新所有命令的 `--help` 说明

---

## 📐 JSON 响应规范

### 成功响应

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "9771d11b-d7d5-46fa-bddc-34e633d4ab48",
        "name": "测试商品",
        "price": 99.00,
        "currency": "USD",
        "stock_quantity": 10,
        "status": "active",
        "created_at": "2025-10-28T10:30:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "per_page": 20,
    "has_next": false
  },
  "message": "商品列表获取成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "未登录，请先执行 optima auth login",
    "details": {
      "suggestion": "Run: optima auth login"
    }
  }
}
```

### 错误码规范

| 错误码 | 说明 | HTTP 状态码对应 |
|--------|------|----------------|
| `AUTH_REQUIRED` | 未登录 | 401 |
| `FORBIDDEN` | 权限不足 | 403 |
| `NOT_FOUND` | 资源不存在 | 404 |
| `VALIDATION_ERROR` | 参数验证失败 | 422 |
| `API_ERROR` | API 调用失败 | 500 |
| `NETWORK_ERROR` | 网络错误 | - |
| `UNKNOWN_ERROR` | 未知错误 | - |

---

## ⏱️ 工作量估算

| 阶段 | 任务 | 工时 | 优先级 |
|------|------|------|--------|
| **阶段 1** | 设计输出工具 | 2h | P0 |
| | 实现 OutputManager | 2h | P0 |
| | 添加全局选项 | 1h | P0 |
| | **小计** | **5h** | |
| **阶段 2** | 迁移 auth 模块 (4 命令) | 1.5h | P0 |
| | 迁移 product 模块 (7 命令) | 2.5h | P0 |
| | 迁移 order 模块 (6 命令) | 2h | P0 |
| | 迁移其他核心命令 (3 命令) | 1h | P0 |
| | **小计** | **7h** | |
| **阶段 3** | 迁移剩余 37 个命令 | 10h | P1 |
| **阶段 4** | 单元测试 | 2h | P1 |
| | 集成测试 | 2h | P1 |
| | 文档更新 | 2h | P1 |
| | **小计** | **6h** | |
| **总计** | | **28h** | |

### 分阶段交付

| 里程碑 | 包含阶段 | 工时 | 交付价值 |
|--------|---------|------|---------|
| **MVP** | 阶段 1 + 阶段 2 | 12h | 基础设施 + 20 个核心命令，覆盖 80% 场景 |
| **完整版** | 全部阶段 | 28h | 所有命令 + 测试 + 文档 |

---

## ⚠️ 风险与挑战

### 1. 破坏性变更
**风险**：现有用户可能依赖表格输出（如脚本解析）

**缓解措施**：
- 采用渐进式迁移策略
- v0.14.x: 默认 `--pretty`，`--json` 可选
- v0.15.x: 添加弃用警告，鼓励使用 `--json`
- v1.0.0: 正式默认 JSON 输出

### 2. 格式化逻辑复杂
**风险**：10+ 个 `format*` 函数需要维护两套逻辑

**缓解措施**：
- Pretty 模式继续使用现有 `src/utils/format.ts`
- JSON 模式直接输出原始数据（由 AI 或前端处理）

### 3. 测试覆盖不足
**风险**：73 个命令需要测试 JSON 和 Pretty 两种输出

**缓解措施**：
- 优先测试核心命令（20 个）
- 使用集成测试脚本批量验证
- 剩余命令手动验证

### 4. AI Agent 适配
**风险**：AI 需要学习新的 JSON 结构

**缓解措施**：
- 提供清晰的 JSON schema 文档
- 在 `.claude/CLAUDE.md` 中更新示例
- 提供 migration guide

---

## 🔄 迁移策略

### 向后兼容计划

#### v0.14.x（当前版本 + 基础设施）
```bash
# 默认 pretty 模式（向后兼容）
optima product list
# Output: 表格格式

# 显式使用 JSON
optima product list --json
# Output: {"success": true, "data": {...}}
```

#### v0.15.x（过渡版本）
```bash
# 默认 pretty，但显示弃用警告
optima product list
# Output:
# ⚠️  WARNING: Pretty output will be deprecated in v1.0.0.
#     Use --pretty to suppress this warning, or --json for structured output.
# [表格格式]

# 推荐使用 JSON
optima product list --json
# Output: {"success": true, "data": {...}}
```

#### v1.0.0（正式版本）
```bash
# 默认 JSON 模式
optima product list
# Output: {"success": true, "data": {...}}

# 显式使用 pretty
optima product list --pretty
# Output: 表格格式
```

### 环境变量控制

```bash
# 全局设置 JSON 模式（推荐给 AI Shell 用户）
export OPTIMA_CLI_FORMAT=json

# 全局设置 Pretty 模式（推荐给人类用户）
export OPTIMA_CLI_FORMAT=pretty

# 禁用颜色（CI/CD 环境）
export OPTIMA_CLI_NO_COLOR=1
```

---

## 📚 参考实现

### 类似 CLI 工具的输出模式

| CLI | 默认输出 | JSON 选项 | 说明 |
|-----|---------|----------|------|
| `gh` (GitHub CLI) | Pretty | `--json` | 默认彩色表格，支持 JSON |
| `aws` | Pretty | `--output json` | 支持 json/yaml/text/table |
| `gcloud` | Pretty | `--format=json` | 支持多种格式 |
| `kubectl` | Pretty | `-o json` | 默认表格，支持 JSON/YAML |
| `docker` | Pretty | `--format json` | 支持 JSON template |

**趋势**：现代 CLI 工具都支持 JSON 输出，但默认保持人类可读格式。

**我们的创新**：针对 AI Agent 使用场景，**默认 JSON**，可选 Pretty。

---

## 🎯 实施建议

### 推荐方案：渐进式重构（方案 A）

**理由**：
1. ✅ 风险可控：分阶段交付，每阶段可独立验证
2. ✅ 快速见效：MVP（12h）即可覆盖 80% 场景
3. ✅ 向后兼容：不破坏现有用户工作流
4. ✅ 易于维护：保留现有代码结构，只增加输出层

**第一步（立即开始）**：
- 实施阶段 1：基础设施（5h）
- 实施阶段 2：核心命令（7h）
- 发布 v0.14.0-beta

**第二步（1-2 周后）**：
- 实施阶段 3：剩余命令（10h）
- 实施阶段 4：测试与文档（6h）
- 发布 v0.14.0

**第三步（根据反馈）**：
- 收集 AI Agent 和人类用户反馈
- 优化 JSON schema
- 考虑 v1.0.0 默认 JSON

---

## 📝 待办事项

- [ ] 创建 `src/utils/output.ts`
- [ ] 修改 `src/index.ts` 添加全局选项
- [ ] 迁移 `auth` 模块（4 命令）
- [ ] 迁移 `product` 模块（7 命令）
- [ ] 迁移 `order` 模块（6 命令）
- [ ] 迁移 `merchant` 模块（4 命令）
- [ ] 迁移剩余核心命令（~20 命令总计）
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新文档（README, CLAUDE.md）
- [ ] 创建 JSON schema 文档
- [ ] 发布 v0.14.0-beta

---

## 🔗 相关链接

- Issue: #9
- 相关项目: [comfy-cli](https://github.com/Optima-Chat/comfy-cli)
- AI Shell: [optima-ai-shell](https://github.com/Optima-Chat/optima-ai-shell)

---

## 附录：命令清单

### 16 个模块的完整命令列表

```
auth (4):
  - login, logout, whoami, refresh

product (7):
  - list, get, create, update, delete, add-images, url

order (6):
  - list, get, ship, cancel, complete, mark-delivered

category (5):
  - list, get, create, update, delete

variant (5):
  - list, get, create, update, delete

merchant (4):
  - info, update, setup, url

shipping-zone (4):
  - list, create, list-rates, add-rate

inventory (4):
  - low-stock, update, history, reserve

conversation (7):
  - list, get, create, send, close, mark-read, delete

shipping (3):
  - calculate, history, update-status

upload (3):
  - image, video, file

transfer (2):
  - list, summary

refund (2):
  - create, get

i18n (1):
  - [产品/分类/商户的翻译管理]

cart (0):
  - [待实现]

checkout (0):
  - [待实现]
```

**总计**：57 个命令
