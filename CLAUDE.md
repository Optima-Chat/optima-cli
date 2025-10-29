# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Optima CLI - E-commerce store management tool designed for Claude Code. 14 modules, 72 commands covering products, orders, inventory, shipping, and i18n.

**Stack**: TypeScript ES Modules, Commander.js, Axios, Inquirer.js, OAuth 2.0

**Auth**: OAuth login or `OPTIMA_TOKEN` env var (priority: env var > config file)

**Backend Config**: `OPTIMA_API_URL`, `OPTIMA_AUTH_URL` env vars for custom endpoints

## Development

```bash
npm run dev              # Run in dev mode
npm run build            # Compile to dist/
DEBUG=true optima <cmd>  # Enable debug output

# Release (automated via GitHub Actions)
npm version patch/minor/major
git push --follow-tags
```

## Architecture

**Directory Structure**:
- `src/index.ts` - Entry point, registers all commands
- `src/api/rest/` - API clients (auth.ts, commerce.ts, base.ts)
- `src/commands/` - 14 module directories (auth, product, order, etc.)
- `src/utils/` - config.ts, error.ts, format.ts, helpText.ts

**Key Patterns**:

1. **Authentication** (`src/api/rest/base.ts` + `src/utils/config.ts`)
   - All requests use `createAuthenticatedClient()` with auto token refresh
   - `ensureValidToken()` checks expiration before each request
   - Tokens stored encrypted in `~/.config/optima-cli/`

2. **Command Structure** (every command follows this)
   ```typescript
   import { Command } from 'commander';
   import { addEnhancedHelp } from '../../utils/helpText.js';

   const cmd = new Command('create')
     .description('Create resource')
     .option('--title <title>', 'Title (required)')
     .action(async (options) => {
       try {
         // Validate, prompt missing fields, call API, display result
       } catch (error) {
         handleError(error);
       }
     });

   addEnhancedHelp(cmd, {
     examples: ['$ optima resource create --title "Example"'],
     output: { example: '{"success": true, "data": {...}}' },
     relatedCommands: [{ command: 'resource list', description: 'View all' }],
     notes: ['Title is required']
   });

   export const createCommand = cmd;
   ```

3. **Enhanced Help System (v0.15.0)** (`src/utils/helpText.ts`)
   - All 72 commands have structured help: Examples, JSON Output, Related Commands, Notes
   - `addEnhancedHelp(command, options)` adds LLM-friendly documentation

## Key Files

- **`src/api/rest/commerce.ts`** - All Commerce API endpoints (987 lines)
- **`src/utils/config.ts`** - Token storage, auto-refresh logic
- **`src/utils/helpText.ts`** - Enhanced help system
- **`src/index.ts`** - Command registration
- **`src/postinstall.ts`** - Auto-configures `~/.claude/CLAUDE.md` on install

## TypeScript ES Modules

**Critical**: Must use `.js` extensions in imports even though files are `.ts`:

```typescript
// ✅ Correct
import { commerceApi } from '../../api/rest/commerce.js';

// ❌ Wrong
import { commerceApi } from '../../api/rest/commerce';
```

Required because `tsconfig.json` uses `"module": "ES2022"`.

## Adding New Commands

1. Create `src/commands/<module>/<action>.ts` following command pattern
2. Add enhanced help with `addEnhancedHelp()`
3. Add API method to `src/api/rest/commerce.ts` if needed
4. Export from module's `index.ts`
5. Register in `src/index.ts` with `program.addCommand()`
6. Update `.claude/CLAUDE.md` with command reference
7. Test: `optima <command> --help`
8. Build: `npm run build`

## Testing Locally

```bash
npm run build
npm install -g .
optima <command> --help
npm uninstall -g @optima-chat/optima-cli
```

## Publishing

GitHub Actions auto-publishes on version tags. Required secret: `NPM_TOKEN`.

```bash
npm version patch   # or minor/major
git push --follow-tags
```

## API Endpoints

**Auth API**: `https://auth.optima.shop`
- OAuth 2.0 Device Flow, Client ID: `optima-cli-cwkbnadr`
- Override: `OPTIMA_AUTH_URL` env var

**Commerce API**: `https://api.optima.shop`
- All product/order/inventory/shipping operations
- Bearer token auth, auto-refresh every 15 min
- Override: `OPTIMA_API_URL` env var

## Non-Interactive Mode (v0.16.0)

Optima CLI automatically detects the execution environment and adapts its behavior:

### Terminal Users
When running in a terminal, missing required parameters trigger friendly interactive prompts:

```bash
$ optima product create
📦 创建新商品
? 商品名称: _
? 价格: _
```

### AI Assistants / CI/CD
In non-interactive environments (AI, pipelines, background tasks), interactive prompts are automatically disabled:

```bash
# Automatic detection (no TTY, CI env vars, etc.)
$ optima product create
⚠️  验证错误: 缺少必需参数: --title (商品名称)
   字段: title

# Explicit disable
$ NON_INTERACTIVE=1 optima product create
```

### Environment Variables

**Force interactive mode** (when auto-detection fails):
- `OPTIMA_INTERACTIVE=1` - Highest priority, always enables prompts

**Force non-interactive mode** (when needed):
- `NON_INTERACTIVE=1` - Disables all interactive prompts
- `OPTIMA_NON_INTERACTIVE=true` - Alternative syntax
- `CI=true` - Auto-detected in CI/CD environments (GitHub Actions, GitLab CI, etc.)

### Confirmation Commands

Commands with `--yes` flag (delete, cancel, complete, cleanup) require explicit confirmation:

```bash
# Terminal: shows confirmation prompt
$ optima product delete --id prod-123
⚠️  即将删除商品: prod-123
? 确定要删除此商品吗？ (y/N)

# Non-interactive: requires --yes flag
$ optima product delete --id prod-123 --yes
✓ 商品删除成功！
```

### Affected Commands (20 total)

**Tier 1 - Core commands**: shipping calculate, product create, order ship, category create

**Tier 2 - Common commands**: variant create, inventory update/reserve, shipping-zone create/add-rate

**Tier 3 - Confirmation commands**: product/category/variant delete, order cancel/complete, shipping-zone delete, cleanup, shipping update-status

**Tier 4 - i18n commands**: i18n product/category/merchant create

See `docs/NON_INTERACTIVE_MODE_DESIGN.md` for full technical specification.

## Common Issues

**Authentication**:
- Run `optima auth login` or set `OPTIMA_TOKEN` env var
- Env var tokens don't auto-refresh (use long-lived tokens for CI/CD)

**TypeScript errors**: Check imports use `.js` extension

**Token refresh failing**: Check `~/.config/optima-cli/config.json` exists, or re-login

**I18n language codes**: Use BCP 47 format (en-US, zh-CN) not short codes (en, zh)

**Custom backends**: `OPTIMA_API_URL=http://localhost:8000 optima product list`
