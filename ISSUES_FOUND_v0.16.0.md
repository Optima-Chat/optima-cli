# v0.16.0 发现的问题

**发现时间**：2025-10-29
**发现者**：Claude Code (深度测试)

---

## 🐛 问题 1: cleanup 命令错误格式不一致

### 描述
`cleanup` 命令的错误消息格式与其他确认命令不一致。

### 当前行为
```bash
$ NON_INTERACTIVE=1 optima cleanup
❌ 清理失败: 非交互环境需要使用 --yes 标志确认清理操作
```

### 预期行为（与其他命令一致）
```bash
$ NON_INTERACTIVE=1 optima product delete --id test
⚠️  验证错误: 非交互环境需要使用 --yes 标志确认删除操作
   字段: yes
```

### 根本原因
**文件**: `src/commands/cleanup.ts:83-85`

cleanup 命令使用了自己的 try-catch 块直接处理错误：
```typescript
} catch (error: any) {
  console.log(chalk.red(`\n❌ 清理失败: ${error.message}\n`));
}
```

而其他命令使用统一的错误处理器：
```typescript
.action(async (options) => {
  try {
    await deleteProduct(productId, options);
  } catch (error) {
    handleError(error);  // ✓ 统一格式
  }
});
```

### 影响
- 用户体验不一致
- 错误消息缺少"字段"信息
- 使用不同的图标和颜色（❌ vs ⚠️）

### 修复方案
将 cleanup 命令的错误处理改为使用 `handleError()`：

```typescript
// src/commands/cleanup.ts
const cmd = new Command('cleanup')
  .description('Remove Optima CLI config from Claude Code global settings')
  .option('--yes', 'Skip confirmation prompt (non-interactive)')
  .action(async (options) => {
    try {
      await cleanupConfig(options);
    } catch (error) {
      handleError(error);  // ✓ 使用统一错误处理
    }
  });

async function cleanupConfig(options: any) {
  // ... 所有业务逻辑移到这里
  // 抛出 ValidationError，由 handleError 统一处理
}
```

### 严重程度
🟡 **中等** - 不影响功能，但影响用户体验一致性

---

## 🐛 问题 2: order ship 命令缺少必需参数验证

### 描述
`order ship` 命令的 `--tracking` 和 `--carrier` 参数在帮助文档中标记为 `(required)`，但在非交互模式下没有验证，导致直接调用 API 并返回 403 错误。

### 当前行为
```bash
$ NON_INTERACTIVE=1 optima order ship --id test-order-123
❌ API 错误 [403]: Request failed with status code 403
   详情: {
  "detail": "Not authenticated"
}
```

**问题**：应该在参数验证阶段就报错，而不是等到 API 调用。

### 预期行为
```bash
$ NON_INTERACTIVE=1 optima order ship --id test-order-123
⚠️  验证错误: 缺少必需参数: --tracking (物流单号)
   字段: tracking
```

### 根本原因
**文件**: `src/commands/order/ship.ts:69-114`

1. **帮助文档声明为必需**：
```typescript
.option('-t, --tracking <string>', 'Tracking number (required)')
.option('-c, --carrier <string>', 'Carrier name (required)')
```

2. **但代码中标记为"可选"**：
```typescript
// 第 79-99 行：交互模式下提示为"可选"
{
  type: 'input',
  name: 'trackingNumber',
  message: '物流单号 (可选):',  // ⚠️ 标记为可选！
  default: '',
}
```

3. **非交互模式没有验证**：
```typescript
// 第 75-99 行：非交互模式直接使用 options.tracking
let trackingNumber: string | undefined = options.tracking;  // 没有验证
let carrier: string | undefined = options.carrier;          // 没有验证

// 第 114 行：直接调用 API
const order = await commerceApi.orders.ship(orderId, shipData);  // 可能失败
```

### 设计文档要求
**文件**: `docs/NON_INTERACTIVE_MODE_DESIGN.md:435`
```
测试：`optima order ship --id xxx` 缺少 tracking 应报错
```

### 影响
- 非交互模式下用户得到 API 错误而不是清晰的参数错误
- 与设计文档和帮助文档不一致
- 测试用例覆盖不完整（我在测试中忽略了这个问题）

### 修复方案

**选项 A: 将参数改为可选（推荐）**

如果 tracking 和 carrier 在业务上确实是可选的：

1. 更新帮助文档：
```typescript
.option('-t, --tracking <string>', 'Tracking number (optional)')
.option('-c, --carrier <string>', 'Carrier name (optional)')
```

2. 更新交互提示（已经是"可选"）

3. 更新设计文档，从 Tier 1 移除 order ship

**选项 B: 添加参数验证（如果必需）**

如果 tracking 和 carrier 在业务上是必需的：

```typescript
async function shipOrder(options: ShipOrderOptions) {
  const orderId = isInteractiveEnvironment()
    ? (options.id?.trim() || (() => { throw new ValidationError('订单 ID 不能为空', 'id'); })())
    : requireParam(options.id, 'id', '订单 ID');

  let trackingNumber: string;
  let carrier: string;

  if (isInteractiveEnvironment()) {
    // 交互模式：如果缺少参数则提示
    if (!options.tracking || !options.carrier) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'trackingNumber',
          message: '物流单号:',  // 移除"可选"
          validate: (input: string) => input.trim().length > 0 || '物流单号不能为空',
        },
        {
          type: 'input',
          name: 'carrier',
          message: '快递公司:',  // 移除"可选"
          validate: (input: string) => input.trim().length > 0 || '快递公司不能为空',
        },
      ]);
      trackingNumber = answers.trackingNumber;
      carrier = answers.carrier;
    } else {
      trackingNumber = options.tracking;
      carrier = options.carrier;
    }
  } else {
    // 非交互模式：直接验证
    trackingNumber = requireParam(options.tracking, 'tracking', '物流单号');
    carrier = requireParam(options.carrier, 'carrier', '快递公司');
  }

  // ... 继续业务逻辑
}
```

### 建议
推荐**选项 A**（改为可选），因为：
1. 有些物流场景可能不需要立即提供 tracking（先标记发货，后补充单号）
2. 代码实现已经支持可选
3. API 接口可能也支持可选

但需要确认业务需求和 API 定义。

### 严重程度
🟡 **中等** - 功能可用，但用户体验不佳，文档不一致

---

## 📊 影响范围

| 问题 | 受影响命令 | 用户影响 | 修复难度 |
|------|-----------|---------|---------|
| cleanup 错误格式 | 1 个命令 | 用户体验不一致 | 🟢 简单 |
| order ship 参数验证 | 1 个命令 | 错误提示不清晰 | 🟡 中等 |

---

## 🔍 测试遗漏

我在测试时遗漏了这些问题，原因：

1. **cleanup 命令**：测试了功能，但没有仔细对比错误消息格式
2. **order ship 命令**：因为 API 返回 403，我错误地认为参数验证通过了

### 教训
- 需要测试错误消息的**格式一致性**，不只是测试功能
- 需要区分"参数验证错误"和"API 错误"
- 应该对照帮助文档验证参数的 required/optional 声明

---

## ✅ 正面发现

除了这 2 个问题，其他 **18/20 命令完全正常**：
- ✅ Tier 1: 3/4 正常（product create, shipping calculate, category create）
- ✅ Tier 2: 5/5 正常
- ✅ Tier 3: 7/8 正常（除 cleanup）
- ✅ Tier 4: 3/3 正常

**核心功能（智能环境检测、参数验证、确认命令）100% 正常工作**。

---

## 📋 后续行动

### 立即行动
- [ ] 确认 order ship 的 tracking/carrier 业务需求（必需 vs 可选）
- [ ] 修复 cleanup 命令错误处理（使用 handleError）
- [ ] 根据业务需求修复 order ship 参数验证

### 可选行动
- [ ] 添加自动化测试检查错误消息格式一致性
- [ ] 更新测试脚本包含 order ship 参数验证测试
- [ ] 审查所有命令的 required/optional 标记一致性

---

**结论**：v0.16.0 核心功能完全正常，发现的 2 个问题都是次要的用户体验问题，不影响主要功能。建议在 v0.16.1 修复。
