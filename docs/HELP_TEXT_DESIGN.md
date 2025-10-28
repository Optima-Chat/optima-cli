# Help Text Design for LLM-Friendly CLI

**Version**: 1.0
**Target**: v0.15.0
**Goal**: Make all command help texts optimized for LLM comprehension and usage

## Problem Statement

Optima CLI is designed specifically for LLM usage (Claude Code), but current help texts lack critical information that LLMs need to use commands effectively:

- No output format explanation (--json/--pretty)
- No actual usage examples
- Required parameters not marked
- No return value documentation
- No related command suggestions
- No common error explanations

## Design Principles

1. **Structured Format** - Easy to parse sections
2. **Explicit Examples** - Real-world usage patterns
3. **Clear Parameters** - Type, requirement, defaults
4. **Output Documentation** - What data is returned
5. **Workflow Guidance** - Related commands and next steps
6. **Error Prevention** - Common mistakes and solutions

## Proposed Help Text Structure

```
Usage: optima <command> [options]

<Short description>

Arguments:
  <arg>    <description> (required/optional)

Options:
  --param <type>    <description> (required/default: value)
  --json            Output in JSON format (AI-friendly)
  --pretty          Output in human-readable format
  -h, --help        Display help for command

Examples:
  # <Example 1 description>
  $ optima <command> --param value

  # <Example 2 description>
  $ optima <command> --json --param value

Output (JSON):
  {
    "success": true,
    "data": {
      "<field>": "<description>"
    }
  }

Related Commands:
  optima <related1>    <When to use>
  optima <related2>    <When to use>

Notes:
  - <Important note 1>
  - <Common error and solution>
```

## Implementation Examples

### Example 1: product create (Complex command with many options)

```
Usage: optima product create [options]

Create a new product with title, price, and optional details.

Options:
  --title <string>         Product name (required)
  --price <number>         Product price (required)
  --description <string>   Product description
  --stock <number>         Stock quantity (default: 0)
  --sku <string>           SKU code
  --currency <string>      Currency code (default: USD)
  --status <string>        Status: active|inactive|draft (default: active)
  --category-id <uuid>     Category ID
  --images <paths>         Local image paths (comma-separated)
  --media-ids <uuids>      Media IDs from upload command (comma-separated)
  --json                   Output in JSON format
  --pretty                 Output in human-readable format (default)
  -h, --help               Display help for command

Examples:
  # Create a basic product
  $ optima product create --title "Ceramic Mug" --price 29.99

  # Create with full details
  $ optima product create \
    --title "Ceramic Mug" \
    --price 29.99 \
    --description "Handmade ceramic mug" \
    --stock 100 \
    --sku MUG-001

  # Create with images (recommended workflow)
  $ optima upload image --path mug.jpg  # Get media_id first
  $ optima product create \
    --title "Ceramic Mug" \
    --price 29.99 \
    --media-ids "abc-123-def"

  # Create with JSON output for scripting
  $ optima product create --title "Mug" --price 29.99 --json

Output (JSON):
  {
    "success": true,
    "data": {
      "product_id": "uuid",
      "name": "Product name",
      "handle": "url-slug",
      "price": "29.99",
      "currency": "USD",
      "status": "active",
      "product_url": "https://...",
      "created_at": "timestamp"
    }
  }

Related Commands:
  optima upload image      Upload product images first
  optima product list      View created products
  optima product update    Modify product details
  optima category create   Create category before assigning

Notes:
  - title and price are required (interactive prompt if not provided)
  - Upload images first with 'optima upload image' to get media IDs
  - Use --media-ids for uploaded images, not --images for local paths
  - Default output is human-readable, use --json for AI/scripts
```

### Example 2: merchant info (Simple query command)

```
Usage: optima merchant info [options]

Get current merchant account information and settings.

Options:
  --json      Output in JSON format
  --pretty    Output in human-readable format (default)
  -h, --help  Display help for command

Examples:
  # Get merchant info (human-readable)
  $ optima merchant info

  # Get merchant info in JSON
  $ optima merchant info --json

Output (JSON):
  {
    "success": true,
    "data": {
      "merchant": {
        "id": "uuid",
        "name": "Store name",
        "slug": "store-slug",
        "email": "contact@example.com",
        "origin_country_alpha2": "US",
        "origin_city": "New York",
        "created_at": "timestamp"
      }
    }
  }

Related Commands:
  optima merchant update    Update merchant information
  optima merchant url       Get store frontend URL

Notes:
  - Requires authentication (run 'optima auth login' first)
  - Returns information for currently logged-in merchant
```

### Example 3: order ship (Action command with required params)

```
Usage: optima order ship [options]

Mark an order as shipped and add tracking information.

Options:
  --id <uuid>              Order ID (required)
  -t, --tracking <string>  Tracking number (required)
  -c, --carrier <string>   Carrier name (required)
  --json                   Output in JSON format
  --pretty                 Output in human-readable format (default)
  -h, --help               Display help for command

Examples:
  # Ship an order
  $ optima order ship \
    --id abc-123-def \
    --tracking DHL1234567890 \
    --carrier DHL

  # Ship with JSON output
  $ optima order ship \
    --id abc-123-def \
    --tracking UPS123 \
    --carrier UPS \
    --json

Output (JSON):
  {
    "success": true,
    "data": {
      "order_id": "uuid",
      "status": "shipped",
      "tracking_number": "DHL1234567890",
      "carrier": "DHL",
      "shipped_at": "timestamp"
    }
  }

Related Commands:
  optima order list            List orders pending shipment
  optima order get             Get order details before shipping
  optima order mark-delivered  Mark order as delivered
  optima shipping history      View shipping history

Notes:
  - Order must be in 'paid' or 'processing' status
  - Tracking number will be sent to customer via email
  - Common carriers: DHL, UPS, FedEx, USPS, China Post
  - Use 'optima order list --status pending' to find orders to ship
```

## Implementation Strategy

### Phase 1: Create Helper Function
Create `src/utils/helpText.ts` with utilities to generate enhanced help text:

```typescript
export interface HelpTextOptions {
  examples?: string[];
  output?: string;
  relatedCommands?: Array<{ command: string; description: string }>;
  notes?: string[];
}

export function addEnhancedHelp(
  command: Command,
  options: HelpTextOptions
): Command {
  // Add after:help hook to append custom sections
  command.addHelpText('after', (context) => {
    let text = '\n';

    if (options.examples) {
      text += 'Examples:\n';
      options.examples.forEach(ex => {
        text += `  ${ex}\n`;
      });
      text += '\n';
    }

    if (options.output) {
      text += 'Output (JSON):\n';
      text += `  ${options.output}\n\n`;
    }

    if (options.relatedCommands) {
      text += 'Related Commands:\n';
      options.relatedCommands.forEach(rc => {
        text += `  optima ${rc.command.padEnd(20)} ${rc.description}\n`;
      });
      text += '\n';
    }

    if (options.notes) {
      text += 'Notes:\n';
      options.notes.forEach(note => {
        text += `  - ${note}\n`;
      });
    }

    return text;
  });

  return command;
}
```

### Phase 2: Update High-Priority Commands
Update help for most-used commands first:

**Tier 1 (Essential)**:
- product create, list, get, update
- order list, get, ship
- merchant info, update
- auth login, whoami

**Tier 2 (Common)**:
- category create, list
- inventory low-stock, update
- shipping-zone create, list
- upload image

**Tier 3 (Advanced)**:
- All i18n commands
- variant commands
- conversation commands

### Phase 3: Add Global Help
Update `src/index.ts` to add global help about --json/--pretty:

```typescript
program
  .name('optima')
  .description('用自然语言管理电商店铺 - 专为 Claude Code 设计')
  .version(version)
  .addHelpText('after', `
Output Formats:
  All commands support two output formats:
  --json    JSON format (default) - Machine-readable, AI-friendly
  --pretty  Pretty format - Human-readable with colors and tables

  You can also set OPTIMA_CLI_FORMAT=pretty environment variable.

Authentication:
  Most commands require authentication. Run 'optima auth login' first,
  or set OPTIMA_TOKEN environment variable.

Examples:
  $ optima auth login              # Login first
  $ optima product list            # JSON output (default)
  $ optima product list --pretty   # Human-readable output
  $ optima product create --title "Mug" --price 29.99 --json

Documentation:
  Visit https://github.com/Optima-Chat/optima-cli for full docs.
`);
```

## Success Metrics

- ✅ All 72 commands have Examples section
- ✅ All commands document --json/--pretty flags
- ✅ All commands mark required parameters
- ✅ All commands show output structure
- ✅ Top 20 commands have Related Commands section
- ✅ LLM can use commands without trial-and-error

## Timeline

- **Week 1**: Create helpText.ts utility + Update Tier 1 commands (10 commands)
- **Week 2**: Update Tier 2 commands (15 commands)
- **Week 3**: Update Tier 3 commands (47 commands)
- **Week 4**: Testing + Documentation

## Breaking Changes

None - This only enhances help text, no functionality changes.

## Testing

1. Manual review of all --help outputs
2. Test with Claude Code to ensure LLM can understand
3. User feedback from CC Chat community

## Future Enhancements

- Interactive help mode (`optima help interactive`)
- Search help across all commands (`optima help search "create product"`)
- Auto-generate API documentation from help texts
- Multi-language help text support
