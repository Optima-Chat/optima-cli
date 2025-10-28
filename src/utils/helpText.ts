import { Command } from 'commander';

/**
 * Options for enhancing command help text
 */
export interface HelpTextOptions {
  /**
   * Usage examples with descriptions
   * Format: "# Description\n$ optima command --options"
   */
  examples?: string[];

  /**
   * JSON output structure example
   * Show the data structure returned in JSON mode
   */
  output?: {
    description?: string;
    example: string;
  };

  /**
   * Related commands that users might need
   */
  relatedCommands?: Array<{
    command: string;
    description: string;
  }>;

  /**
   * Important notes, tips, and common pitfalls
   */
  notes?: string[];
}

/**
 * Add enhanced help text sections to a Commander command
 *
 * This utility adds LLM-friendly documentation including:
 * - Real usage examples
 * - JSON output structure
 * - Related commands for workflow guidance
 * - Important notes and best practices
 *
 * @param command - The Commander command to enhance
 * @param options - Help text content options
 * @returns The enhanced command (for chaining)
 *
 * @example
 * ```typescript
 * const cmd = new Command('create')
 *   .description('Create a product')
 *   .option('--title <string>', 'Product name (required)')
 *   .option('--price <number>', 'Product price (required)');
 *
 * addEnhancedHelp(cmd, {
 *   examples: [
 *     '# Create a basic product',
 *     '$ optima product create --title "Mug" --price 29.99',
 *     '',
 *     '# Create with JSON output',
 *     '$ optima product create --title "Mug" --price 29.99 --json'
 *   ],
 *   output: {
 *     example: JSON.stringify({
 *       success: true,
 *       data: { product_id: 'uuid', name: 'Mug', price: '29.99' }
 *     }, null, 2)
 *   },
 *   relatedCommands: [
 *     { command: 'product list', description: 'View created products' },
 *     { command: 'upload image', description: 'Upload product images' }
 *   ],
 *   notes: [
 *     'title and price are required parameters',
 *     'Upload images first to get media IDs'
 *   ]
 * });
 * ```
 */
export function addEnhancedHelp(
  command: Command,
  options: HelpTextOptions
): Command {
  command.addHelpText('after', () => {
    let text = '';

    // Add Examples section
    if (options.examples && options.examples.length > 0) {
      text += '\nExamples:\n';
      options.examples.forEach((line) => {
        text += `  ${line}\n`;
      });
    }

    // Add Output section
    if (options.output) {
      text += '\nOutput (JSON):\n';
      if (options.output.description) {
        text += `  ${options.output.description}\n\n`;
      }
      // Indent JSON output
      const lines = options.output.example.split('\n');
      lines.forEach((line) => {
        text += `  ${line}\n`;
      });
    }

    // Add Related Commands section
    if (options.relatedCommands && options.relatedCommands.length > 0) {
      text += '\nRelated Commands:\n';
      options.relatedCommands.forEach((rc) => {
        const commandPadded = `optima ${rc.command}`.padEnd(28);
        text += `  ${commandPadded}${rc.description}\n`;
      });
    }

    // Add Notes section
    if (options.notes && options.notes.length > 0) {
      text += '\nNotes:\n';
      options.notes.forEach((note) => {
        text += `  - ${note}\n`;
      });
    }

    return text;
  });

  return command;
}

/**
 * Standardized output format documentation for success responses
 */
export const OUTPUT_SUCCESS_TEMPLATE = {
  success: true,
  data: {
    '...': 'Resource data here',
  },
  message: 'Optional success message',
};

/**
 * Standardized output format documentation for error responses
 */
export const OUTPUT_ERROR_TEMPLATE = {
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error description',
  },
};

/**
 * Helper to format option description with type and requirement info
 *
 * @param description - The option description
 * @param type - The parameter type (string, number, uuid, etc.)
 * @param required - Whether the parameter is required
 * @param defaultValue - Default value if any
 * @returns Formatted description
 *
 * @example
 * ```typescript
 * formatOptionDescription('Product name', 'string', true)
 * // Returns: "Product name (required)"
 *
 * formatOptionDescription('Stock quantity', 'number', false, 0)
 * // Returns: "Stock quantity (default: 0)"
 * ```
 */
export function formatOptionDescription(
  description: string,
  type?: string,
  required?: boolean,
  defaultValue?: string | number
): string {
  let formatted = description;

  if (type) {
    formatted = `${formatted} <${type}>`;
  }

  if (required) {
    formatted = `${formatted} (required)`;
  } else if (defaultValue !== undefined) {
    formatted = `${formatted} (default: ${defaultValue})`;
  }

  return formatted;
}
