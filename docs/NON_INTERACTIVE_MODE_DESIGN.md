# 非交互模式智能检测技术方案

## 问题背景

### 当前问题

Optima CLI 当前设计存在**系统性的交互模式问题**，导致在非交互环境（如 AI 助手、CI/CD）中无法正常使用：

**问题表现**：
```bash
# AI 助手尝试运行
$ optima shipping calculate --country HK --postal-code 999077 --weight 0.5

# 实际发生：命令卡住，等待交互输入
📦 计算运费
? 目的地国家代码 (如 US, CN): _  # 等待用户输入，AI 无法响应
```

**影响范围**：
- ✅ 20+ 个命令使用 `inquirer.prompt()` 进入交互模式
- ✅ 包括核心命令：product create, shipping calculate, order ship 等
- ✅ 与 `.claude/CLAUDE.md` 中的"非交互原则"直接冲突

### 代码示例

当前实现（`src/commands/shipping/calculate.ts:90`）：

```typescript
// ❌ 问题代码
if (!options.country || !options.weight) {
    // 缺少必需参数时进入交互模式
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'country',
            message: '目的地国家代码 (如 US, CN):',
            validate: (input) => input ? true : '国家代码不能为空'
        },
        // ... 更多提示
    ]);
}
```

### 根本原因

1. **设计冲突**：命令标记参数为 "required"，但缺失时不报错而是进入交互模式
2. **环境假设**：假设所有用户都在终端环境运行，忽略了 AI/CI 场景
3. **行为不一致**：用户（包括 AI）无法预测命令是否会要求交互输入

---

## 解决方案：智能 TTY 检测

### 方案概述

**核心思路**：自动检测运行环境，在非交互环境中禁用交互式提示

```typescript
// ✅ 解决方案
function isInteractiveEnvironment(): boolean {
    // 1. 检测标准输入是否为 TTY（终端）
    if (!process.stdin.isTTY) {
        return false;
    }

    // 2. 检测 CI 环境变量
    if (process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true') {
        return false;
    }

    // 3. 检测显式禁用标志
    if (process.env.NON_INTERACTIVE === '1' || process.env.OPTIMA_NON_INTERACTIVE === 'true') {
        return false;
    }

    return true;
}
```

### 技术优势

1. **零配置**：大多数情况自动检测，无需用户配置
2. **向后兼容**：终端用户保留友好的交互式体验
3. **可控性**：提供环境变量覆盖机制
4. **明确错误**：非交互环境报清晰的参数错误

---

## 实现方案

### 第一阶段：核心工具函数

**文件**：`src/utils/interactive.ts`（新建）

```typescript
/**
 * 交互式环境检测工具
 *
 * 自动检测是否应该使用交互式提示（inquirer）
 * 在非交互环境（AI、CI/CD）中返回 false
 */

/**
 * 检测当前是否为交互式环境
 *
 * @returns true 如果在交互式终端环境，false 如果在非交互环境
 *
 * 检测逻辑：
 * 1. process.stdin.isTTY - 标准输入是否为终端
 * 2. CI 环境变量 - 是否在 CI/CD 环境
 * 3. 显式禁用标志 - 用户手动禁用交互模式
 */
export function isInteractiveEnvironment(): boolean {
    // 检测 1：标准输入是否为 TTY
    // 非 TTY 场景：管道、重定向、AI 环境、后台进程
    if (!process.stdin.isTTY) {
        return false;
    }

    // 检测 2：CI 环境
    // 常见 CI 环境变量
    const ciEnvVars = [
        'CI',                      // 通用 CI 标志
        'CONTINUOUS_INTEGRATION',  // Jenkins, Travis
        'BUILD_ID',                // Jenkins
        'GITHUB_ACTIONS',          // GitHub Actions
        'GITLAB_CI',               // GitLab CI
        'CIRCLECI',                // CircleCI
        'TRAVIS',                  // Travis CI
    ];

    for (const envVar of ciEnvVars) {
        if (process.env[envVar] === 'true' || process.env[envVar] === '1') {
            return false;
        }
    }

    // 检测 3：显式禁用标志
    // 用户可以通过环境变量强制禁用交互模式
    if (process.env.NON_INTERACTIVE === '1' ||
        process.env.OPTIMA_NON_INTERACTIVE === 'true') {
        return false;
    }

    // 默认：允许交互
    return true;
}

/**
 * 确保参数已提供，否则抛出验证错误
 *
 * 在非交互环境中使用此函数代替 inquirer.prompt()
 *
 * @param value - 参数值
 * @param paramName - 参数名称（用于错误消息）
 * @param friendlyName - 友好名称（用于错误消息）
 * @throws ValidationError 如果值为空
 */
export function requireParam(
    value: string | undefined | null,
    paramName: string,
    friendlyName?: string
): string {
    if (!value || value.trim().length === 0) {
        const displayName = friendlyName || paramName;
        throw new ValidationError(
            `缺少必需参数: --${paramName} (${displayName})`,
            paramName
        );
    }
    return value.trim();
}

/**
 * 确保数值参数已提供且有效
 *
 * @param value - 参数值
 * @param paramName - 参数名称
 * @param friendlyName - 友好名称
 * @param min - 最小值（可选）
 * @param max - 最大值（可选）
 * @throws ValidationError 如果值无效
 */
export function requireNumberParam(
    value: string | undefined | null,
    paramName: string,
    friendlyName?: string,
    min?: number,
    max?: number
): number {
    if (!value || value.trim().length === 0) {
        const displayName = friendlyName || paramName;
        throw new ValidationError(
            `缺少必需参数: --${paramName} (${displayName})`,
            paramName
        );
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
        const displayName = friendlyName || paramName;
        throw new ValidationError(
            `参数 --${paramName} 必须是有效数字: ${value}`,
            paramName
        );
    }

    if (min !== undefined && numValue < min) {
        throw new ValidationError(
            `参数 --${paramName} 必须大于等于 ${min}`,
            paramName
        );
    }

    if (max !== undefined && numValue > max) {
        throw new ValidationError(
            `参数 --${paramName} 必须小于等于 ${max}`,
            paramName
        );
    }

    return numValue;
}
```

---

### 第二阶段：命令重构模式

**标准重构模式**（适用于所有命令）：

#### 重构前（current）

```typescript
// ❌ 当前实现
async function createProduct(options: CreateProductOptions) {
    if (!options.title || !options.price) {
        // 进入交互模式
        const answers = await inquirer.prompt([
            { name: 'title', message: '商品名称:' },
            { name: 'price', message: '价格:' }
        ]);
        options.title = answers.title;
        options.price = answers.price;
    }

    // 业务逻辑...
}
```

#### 重构后（target）

```typescript
// ✅ 推荐实现
import { isInteractiveEnvironment, requireParam, requireNumberParam } from '../../utils/interactive.js';

async function createProduct(options: CreateProductOptions) {
    let title: string;
    let price: number;

    // 检测环境
    if (isInteractiveEnvironment()) {
        // 交互模式：友好提示
        if (!options.title || !options.price) {
            console.log(chalk.cyan('\n📦 创建新商品\n'));

            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'title',
                    message: '商品名称:',
                    default: options.title,
                    validate: (input) => input ? true : '商品名称不能为空'
                },
                {
                    type: 'input',
                    name: 'price',
                    message: '价格:',
                    default: options.price,
                    validate: (input) => {
                        const num = parseFloat(input);
                        return !isNaN(num) && num > 0 ? true : '价格必须是大于 0 的数字';
                    }
                }
            ]);

            title = answers.title;
            price = parseFloat(answers.price);
        } else {
            title = options.title;
            price = parseFloat(options.price);
        }
    } else {
        // 非交互模式：直接验证参数
        title = requireParam(options.title, 'title', '商品名称');
        price = requireNumberParam(options.price, 'price', '商品价格', 0);
    }

    // 业务逻辑...
    const productData = {
        name: title,
        price: price.toString(),
        // ...
    };
}
```

---

### 第三阶段：批量重构命令

**影响的命令清单**（按优先级）：

#### 高优先级（Tier 1 - 核心命令）
1. ✅ `src/commands/shipping/calculate.ts` - 运费计算
2. ✅ `src/commands/product/create.ts` - 创建商品
3. ✅ `src/commands/order/ship.ts` - 发货
4. ✅ `src/commands/category/create.ts` - 创建分类

#### 中优先级（Tier 2 - 常用命令）
5. ✅ `src/commands/variant/create.ts` - 创建变体
6. ✅ `src/commands/inventory/update.ts` - 更新库存
7. ✅ `src/commands/inventory/reserve.ts` - 预留库存
8. ✅ `src/commands/shipping-zone/create.ts` - 创建运费区域
9. ✅ `src/commands/shipping-zone/rates.ts` - 添加运费费率

#### 低优先级（Tier 3 - 确认类命令）
10. ✅ `src/commands/product/delete.ts` - 删除确认
11. ✅ `src/commands/category/delete.ts` - 删除确认
12. ✅ `src/commands/variant/delete.ts` - 删除确认
13. ✅ `src/commands/order/cancel.ts` - 取消确认
14. ✅ `src/commands/order/complete.ts` - 完成确认
15. ✅ `src/commands/shipping-zone/delete.ts` - 删除确认
16. ✅ `src/commands/cleanup.ts` - 清理确认
17. ✅ `src/commands/shipping/update-status.ts` - 更新状态
18. ✅ `src/commands/i18n/*/create.ts` - i18n 创建命令

**注意**：删除确认类命令已经有 `--yes` 标志，优先级较低。

---

## 实施计划

### Phase 1: 基础设施 (Week 1)

**任务**：
- [ ] 创建 `src/utils/interactive.ts` 工具模块
- [ ] 添加单元测试 `src/utils/interactive.test.ts`
- [ ] 更新 `src/utils/error.ts` 确保 ValidationError 清晰

**测试用例**：
```typescript
describe('isInteractiveEnvironment', () => {
    it('should return false in CI environment', () => {
        process.env.CI = 'true';
        expect(isInteractiveEnvironment()).toBe(false);
    });

    it('should return false when NON_INTERACTIVE is set', () => {
        process.env.NON_INTERACTIVE = '1';
        expect(isInteractiveEnvironment()).toBe(false);
    });

    it('should return true in normal terminal', () => {
        // 假设 isTTY = true
        expect(isInteractiveEnvironment()).toBe(true);
    });
});
```

**验收标准**：
- ✅ 所有测试通过
- ✅ 工具函数文档完整
- ✅ 在 3 种环境测试：终端、CI、AI

---

### Phase 2: 高优先级命令重构 (Week 2)

**任务**：重构 Tier 1 核心命令（4 个）

1. **shipping calculate**
   - 文件：`src/commands/shipping/calculate.ts`
   - 修改点：第 90 行 `if (!options.country || !options.weight)`
   - 测试：`optima shipping calculate` 无参数应报错

2. **product create**
   - 文件：`src/commands/product/create.ts`
   - 修改点：第 106 行 `if (!options.title || !options.price)`
   - 测试：`optima product create` 无参数应报错

3. **order ship**
   - 文件：`src/commands/order/ship.ts`
   - 修改点：检查 tracking/carrier 参数
   - 测试：`optima order ship --id xxx` 缺少 tracking 应报错

4. **category create**
   - 文件：`src/commands/category/create.ts`
   - 修改点：name 参数验证
   - 测试：`optima category create` 无参数应报错

**测试策略**：
```bash
# 终端测试（应进入交互模式）
$ optima product create
📦 创建新商品
? 商品名称: _

# AI 环境测试（应报错）
$ NON_INTERACTIVE=1 optima product create
❌ 缺少必需参数: --title (商品名称)

用法: optima product create --title <name> --price <price>
详细帮助: optima product create --help
```

**验收标准**：
- ✅ 终端用户体验不变（保留交互模式）
- ✅ 非交互环境报清晰错误
- ✅ 所有测试通过
- ✅ 更新 help text 示例

---

### Phase 3: 中低优先级命令重构 (Week 3-4)

**任务**：重构 Tier 2/3 命令（14+ 个）

**批处理策略**：
- 使用脚本生成重构 diff
- 人工审核每个变更
- 分批提交（每批 3-5 个命令）

**Python 辅助脚本**：
```python
#!/usr/bin/env python3
# scripts/refactor-interactive.py

import re
import os

FILES_TO_REFACTOR = [
    'src/commands/variant/create.ts',
    'src/commands/inventory/update.ts',
    # ... 更多文件
]

def add_interactive_import(content):
    """添加 interactive 工具导入"""
    import_line = "import { isInteractiveEnvironment, requireParam } from '../../utils/interactive.js';\n"

    # 在 inquirer 导入后添加
    pattern = r"(import inquirer from 'inquirer';)"
    return re.sub(pattern, r"\1\n" + import_line, content)

def wrap_inquirer_prompt(content):
    """用 isInteractiveEnvironment() 包装 inquirer.prompt"""
    # 匹配模式：if (!options.xxx) { inquirer.prompt(...) }
    # 替换为：if (isInteractiveEnvironment()) { if (!options.xxx) { inquirer.prompt(...) } } else { requireParam(...) }
    pass

for file_path in FILES_TO_REFACTOR:
    with open(file_path, 'r') as f:
        content = f.read()

    content = add_interactive_import(content)
    content = wrap_inquirer_prompt(content)

    with open(file_path, 'w') as f:
        f.write(content)
```

---

### Phase 4: 测试与文档 (Week 5)

**集成测试**：
```bash
# 创建测试套件
npm run test:non-interactive

# 测试所有命令的非交互模式
for cmd in create ship calculate update; do
    NON_INTERACTIVE=1 optima $module $cmd || echo "✅ $cmd requires params"
done
```

**更新文档**：
1. ✅ `CLAUDE.md` - 添加非交互模式说明
2. ✅ `README.md` - 更新 CI/CD 使用指南
3. ✅ `.claude/CLAUDE.md` - 更新 AI 使用说明

**文档示例**：
```markdown
## 非交互模式

Optima CLI 自动检测运行环境：

### 终端用户
在终端运行时，缺少必需参数会进入友好的交互式提示：
```bash
$ optima product create
📦 创建新商品
? 商品名称: _
```

### AI 助手 / CI/CD
在非交互环境（AI、管道、后台任务）自动禁用交互模式：
```bash
# 自动检测
$ optima product create
❌ 缺少必需参数: --title (商品名称)

# 或显式禁用
$ NON_INTERACTIVE=1 optima product create
```

### 环境变量
- `NON_INTERACTIVE=1` - 强制禁用交互模式
- `OPTIMA_NON_INTERACTIVE=true` - 同上（更明确）
- `CI=true` - CI 环境自动禁用
```

---

## 风险评估

### 潜在风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **TTY 检测失败** | 某些终端环境误判为非交互 | 提供 `OPTIMA_INTERACTIVE=1` 强制启用 |
| **用户习惯改变** | 用户依赖交互提示的旧行为 | 发布说明强调仅影响非交互环境 |
| **测试覆盖不足** | 边界情况未覆盖 | 添加多环境集成测试 |
| **性能影响** | 环境检测增加启动时间 | 检测逻辑简单，性能影响 < 1ms |

### 回滚方案

如果出现严重问题：

```typescript
// 临时禁用非交互检测
export function isInteractiveEnvironment(): boolean {
    return true; // 恢复旧行为
}
```

---

## 成功指标

### 技术指标
- ✅ 所有 20+ 命令支持非交互模式
- ✅ 代码覆盖率 > 80%
- ✅ 零破坏性变更（终端用户体验不变）

### 用户体验指标
- ✅ AI 助手成功率提升至 100%（从当前 ~60%）
- ✅ CI/CD 集成无需特殊配置
- ✅ 错误消息清晰，包含 --help 提示

### 文档指标
- ✅ CLAUDE.md 包含完整非交互说明
- ✅ README 更新 CI/CD 示例
- ✅ 每个命令 help text 包含非交互示例

---

## 版本规划

### v0.16.0 (Major Feature Release)

**发布内容**：
- 🎯 智能非交互模式检测
- 🎯 20+ 命令支持 AI/CI 环境
- 🎯 完整文档和测试

**Breaking Changes**: 无（向后兼容）

**Migration Guide**:
```markdown
## 升级到 v0.16.0

### 用户无需操作
- 终端用户体验不变
- 交互式提示保留

### CI/CD 用户
- 现在可以安全使用所有命令
- 无需 `--yes` 或特殊配置
- 自动检测 CI 环境

### AI 助手开发者
- 所有命令现在完全非交互
- 缺少参数时返回清晰错误
- 更新 system prompt 移除交互限制
```

**Changelog**:
```markdown
## [0.16.0] - 2025-11-XX

### Added
- Smart TTY detection for interactive mode
- Non-interactive mode support for 20+ commands
- Environment variable overrides (NON_INTERACTIVE, CI)
- Utility functions: isInteractiveEnvironment(), requireParam()

### Changed
- Commands now auto-detect AI/CI environments
- Clearer error messages when parameters missing

### Fixed
- Commands no longer hang in non-interactive environments
- AI assistants can now use all commands without issues

### Documentation
- Added non-interactive mode guide
- Updated CLAUDE.md with CI/CD examples
- Enhanced help text for all affected commands
```

---

## 附录

### A. 环境检测优先级

```
1. NON_INTERACTIVE=1 (显式禁用) → false
2. OPTIMA_INTERACTIVE=1 (显式启用) → true
3. CI=true (CI 环境) → false
4. !process.stdin.isTTY (非 TTY) → false
5. 默认 → true
```

### B. 影响的命令完整清单

```typescript
const COMMANDS_WITH_INTERACTIVE_PROMPTS = [
    // Tier 1 - 核心业务命令 (4)
    'shipping/calculate.ts',
    'product/create.ts',
    'order/ship.ts',
    'category/create.ts',

    // Tier 2 - 常用命令 (5)
    'variant/create.ts',
    'inventory/update.ts',
    'inventory/reserve.ts',
    'shipping-zone/create.ts',
    'shipping-zone/rates.ts',

    // Tier 3 - 确认类命令 (已有 --yes，低优先级) (9)
    'product/delete.ts',
    'category/delete.ts',
    'variant/delete.ts',
    'order/cancel.ts',
    'order/complete.ts',
    'shipping-zone/delete.ts',
    'cleanup.ts',
    'shipping/update-status.ts',

    // Tier 4 - i18n 命令 (3)
    'i18n/category/create.ts',
    'i18n/product/create.ts',
    'i18n/merchant/create.ts',
];

// 总计：21 个命令需要重构
```

### C. 测试 Checklist

**手动测试**：
```bash
# 1. 终端测试（macOS/Linux）
$ optima product create
# 预期：进入交互模式

# 2. 非交互测试
$ echo "" | optima product create
# 预期：报错（管道输入）

# 3. CI 模拟测试
$ CI=true optima product create
# 预期：报错

# 4. 显式禁用
$ NON_INTERACTIVE=1 optima product create
# 预期：报错

# 5. 强制启用（边界情况）
$ CI=true OPTIMA_INTERACTIVE=1 optima product create
# 预期：进入交互模式（覆盖 CI）
```

**自动化测试**：
```typescript
describe('Non-interactive mode', () => {
    it('should throw error when params missing in CI', () => {
        process.env.CI = 'true';
        expect(() => {
            // 运行命令
        }).toThrow('缺少必需参数');
    });

    it('should prompt in terminal mode', async () => {
        process.stdin.isTTY = true;
        delete process.env.CI;
        // 模拟交互输入
    });
});
```

---

## 相关文档

- [JSON 输出设计](./JSON_OUTPUT_DESIGN.md) - 非交互模式的输出格式
- [帮助文本设计](./HELP_TEXT_DESIGN.md) - 增强的帮助文本（v0.15.0）
- [技术设计文档](./TECHNICAL_DESIGN.md) - 整体架构设计

---

**文档版本**: v1.0
**创建日期**: 2025-10-29
**作者**: Claude Code
**状态**: ✅ 待审核
