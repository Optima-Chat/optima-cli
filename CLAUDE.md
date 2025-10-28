# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Optima CLI is a command-line tool for managing e-commerce stores through natural language, designed specifically for Claude Code. It provides 14 modules with 72 commands covering products, orders, inventory, shipping, and internationalization.

**Key technologies**: TypeScript ES Modules, Commander.js, Axios, Inquirer.js, OAuth 2.0

**Authentication**: Supports both OAuth login and environment variable (`OPTIMA_TOKEN`). Priority: env var > config file.

**Backend Configuration**: Supports environment variables for custom backend URLs:
- `OPTIMA_API_URL` - Commerce API URL (default: https://api.optima.shop)
- `OPTIMA_AUTH_URL` - Auth API URL (default: https://auth.optima.shop)

## Development Commands

```bash
# Development
npm run dev              # Run in dev mode with tsx
npm run build            # Compile TypeScript to dist/
npm start               # Run compiled version

# Testing commands manually
DEBUG=true optima <command>    # Enable debug output

# Publishing (automated via GitHub Actions)
npm version patch/minor/major  # Bump version
git push --follow-tags         # Triggers CI/CD workflow
```

## Architecture

### Directory Structure

```
src/
├── index.ts                 # Entry point, registers all commands
├── api/rest/
│   ├── base.ts             # Authenticated Axios client with auto token refresh
│   ├── auth.ts             # OAuth 2.0 Device Flow authentication
│   └── commerce.ts         # Commerce API client (products, orders, etc.)
├── commands/               # 15 module directories, each with index.ts
│   ├── auth/              # OAuth login/logout/whoami
│   ├── product/           # Product CRUD + image management
│   ├── order/             # Order management + shipping
│   ├── i18n/              # Multi-language translations (product/category/merchant)
│   └── ...                # 11 more modules
└── utils/
    ├── config.ts          # Encrypted token storage with Conf, auto-refresh logic
    ├── error.ts           # Custom error classes + unified error handler
    └── format.ts          # Date/time/currency formatting utilities
```

### Key Patterns

**1. Authentication Flow** (`src/api/rest/base.ts` + `src/utils/config.ts`)
- All API clients use `createAuthenticatedClient()` which adds request interceptor
- Before each request, `ensureValidToken()` checks token expiration
- If expired, automatically calls `authApi.refreshToken()` to get new access token
- Tokens stored encrypted via `Conf` in `~/.config/optima-cli/`

**2. Command Structure** (every command follows this pattern)
```typescript
// 1. Import dependencies
import { Command } from 'commander';
import ora from 'ora';
import { commerceApi } from '../../api/rest/commerce.js';
import { handleError } from '../../utils/error.js';

// 2. Create command with Commander
export const createCommand = new Command('create')
  .description('创建资源')
  .argument('<id>', '资源 ID')
  .option('-t, --title <title>', '标题')
  .action(async (id, options) => {
    try {
      await create(id, options);
    } catch (error) {
      handleError(error);  // Unified error handling
    }
  });

// 3. Business logic function
async function create(id: string, options: any) {
  // Validate inputs
  if (!id) throw new ValidationError('ID 不能为空', 'id');

  // Interactive prompts for missing required fields
  if (!options.title) {
    const answers = await inquirer.prompt([...]);
    options.title = answers.title;
  }

  // API call with loading spinner
  const spinner = ora('正在创建...').start();
  const result = await commerceApi.resources.create(options);
  spinner.succeed('创建成功！');

  // Display results
  console.log(chalk.cyan(result.id));
}
```

**3. API Client Pattern** (`src/api/rest/commerce.ts`)
- Single `CommerceApiClient` class with 15 module properties
- Each module groups related endpoints (e.g., `products.create()`, `products.list()`)
- All methods are async, return typed responses
- Example: `await commerceApi.products.create({ title, price, ... })`

**4. Error Handling** (`src/utils/error.ts`)
- Three error types: `ApiError`, `ValidationError`, `AuthenticationError`
- `handleError(error)` displays colored output and exits with code 1
- `createApiError(axiosError)` extracts message from response
- All commands wrap main logic in try/catch with `handleError()`

**5. Interactive Prompts**
- Use `inquirer.prompt()` for missing required options
- Validate inputs in `validate` callback
- Example: If `--title` not provided, prompt user interactively

**6. Enhanced Help System (v0.15.0)** (`src/utils/helpText.ts`)
- All 72 user-facing commands have LLM-friendly enhanced help text
- Use `optima <command> --help` to see structured documentation
- Help includes: Examples, JSON Output Format, Related Commands, Notes

**Adding Enhanced Help to New Commands**:
```typescript
import { addEnhancedHelp } from '../../utils/helpText.js';
import { Command } from 'commander';

const cmd = new Command('create')
  .description('Create a new resource')
  .option('--title <title>', 'Resource title')
  .action(async (options) => {
    // Command logic
  });

addEnhancedHelp(cmd, {
  examples: [
    '# Create resource',
    '$ optima resource create --title "Example"',
  ],
  output: {
    description: 'Returns created resource with ID',
    example: JSON.stringify({
      success: true,
      data: { id: 'uuid', title: 'Example' }
    }, null, 2)
  },
  relatedCommands: [
    { command: 'resource list', description: 'View all resources' },
    { command: 'resource update', description: 'Modify resource' },
  ],
  notes: [
    'Title is required',
    'Returns permanent resource ID',
    'Use --json for machine-readable output',
  ]
});

export const createCommand = cmd;
```

**Help Text Structure** (see `src/utils/helpText.ts:HelpTextOptions`):
- `examples`: Array of command usage examples with comments
- `output`: Optional JSON output format specification
- `relatedCommands`: Links to related commands for discovery
- `notes`: Important details, requirements, caveats

## Important Files

**`src/api/rest/commerce.ts`** (987 lines)
- Single source of truth for all Commerce API endpoints
- 14 modules: products, orders, inventory, shipping, i18n, etc.
- When adding new features, add methods here first
- Uses TypeScript interfaces for request/response types

**`src/utils/config.ts`**
- `ensureValidToken()`: Core auth logic, auto-refreshes tokens
- `saveTokens()`: Encrypts and stores access/refresh tokens
- `isTokenExpired()`: Checks if current token needs refresh
- Uses `Conf` library for encrypted storage

**`src/utils/helpText.ts`**
- `addEnhancedHelp()`: Adds LLM-friendly help text to commands
- `HelpTextOptions` interface: TypeScript type for help structure
- Used by all 72 user-facing commands
- Provides Examples, Output, Related Commands, Notes sections

**`src/index.ts`**
- Registers all 15 command modules with Commander
- Must `addCommand()` for each new module

**`src/postinstall.ts`**
- Auto-configures `~/.claude/CLAUDE.md` on `npm install -g`
- Adds Optima CLI section with natural language command mappings
- Users can then say "登录 Optima" and Claude knows to run `optima auth login`

## TypeScript ES Modules

**Critical**: Must use `.js` extensions in imports even though files are `.ts`:

```typescript
// ✅ Correct
import { commerceApi } from '../../api/rest/commerce.js';

// ❌ Wrong
import { commerceApi } from '../../api/rest/commerce';
```

This is required because `tsconfig.json` uses `"module": "ES2022"` and Node.js needs the `.js` extension for ES modules.

## Adding New Commands

1. Create command file in `src/commands/<module>/<action>.ts`
2. Follow the standard command pattern (see "Command Structure" above)
3. **Add enhanced help text** using `addEnhancedHelp()` (see "Enhanced Help System" pattern)
4. Add method to `src/api/rest/commerce.ts` if needed
5. Export from module's `index.ts`
6. Register in `src/index.ts` with `program.addCommand()`
7. Update `.claude/CLAUDE.md` with new command reference
8. Test help output: `optima <command> --help`
9. Run `npm run build` to compile

## Testing Locally

```bash
# Build first
npm run build

# Test global install locally
npm install -g .

# Test command
optima <command> --help

# Enable debug mode
DEBUG=true optima <command>

# Uninstall
npm uninstall -g @optima-chat/optima-cli
```

## Publishing (Automated)

GitHub Actions workflow (`.github/workflows/release.yml`) handles:
1. Build (`npm run build`)
2. Publish to NPM
3. Create GitHub Release with auto-generated changelog

To release:
```bash
npm version patch   # or minor/major
git push --follow-tags
```

**Required secret**: `NPM_TOKEN` must be set in GitHub repository secrets.

## API Endpoints

**Auth API**: `https://auth.optima.shop`
- OAuth 2.0 Device Flow
- Client ID: `optima-cli-cwkbnadr`
- Environment variable: `OPTIMA_TOKEN` (alternative to login)
- Custom URL: `OPTIMA_AUTH_URL` env var (for development/testing)

**Commerce API**: `https://api.optima.shop`
- All product/order/inventory/shipping operations
- Requires Bearer token authentication
- Tokens auto-refresh every 15 minutes (config file only, env var tokens don't refresh)
- Custom URL: `OPTIMA_API_URL` env var (for development/testing)

## Common Issues

**"未登录" error**:
- User needs to run `optima auth login` first
- OR set `OPTIMA_TOKEN` environment variable

**Environment variable authentication**:
- Set `OPTIMA_TOKEN=<access_token>` to bypass login (useful for containers/CI/CD)
- Priority: `OPTIMA_TOKEN` env var > config file
- Env var tokens don't auto-refresh (use long-lived tokens or manage refresh externally)

**Custom backend URLs**:
- Set `OPTIMA_API_URL` to override Commerce API URL (useful for local development)
- Set `OPTIMA_AUTH_URL` to override Auth API URL (useful for local development)
- Example: `OPTIMA_API_URL=http://localhost:8000 optima product list`

**TypeScript import errors**: Check that imports use `.js` extension

**Token refresh failing**:
- Check `~/.config/optima-cli/config.json` exists
- Verify refresh_token hasn't expired (> 30 days)
- User may need to re-login

**Command not found after adding**: Must rebuild (`npm run build`) and re-register in `src/index.ts`

**I18n language codes**:
- Backend requires BCP 47 format (e.g., "en-US", "zh-CN") not short codes ("en", "zh")
- Supported languages: en-US, es-ES, ja-JP, vi-VN, zh-CN
