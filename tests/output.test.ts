import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { OutputManager, OutputFormat } from '../src/utils/output.js';

describe('OutputManager', () => {
  let originalArgv: string[];
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let processExitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(() => {
    // Save original values
    originalArgv = process.argv;
    originalEnv = { ...process.env };

    // Setup spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: string | number | null) => {
      throw new Error(`process.exit(${code})`);
    }) as any) as any;
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.env = originalEnv;

    // Restore spies
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('Format Detection', () => {
    it('should default to JSON format', () => {
      process.argv = ['node', 'optima', 'product', 'list'];
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.JSON);
      expect(output.isJson()).toBe(true);
      expect(output.isPretty()).toBe(false);
    });

    it('should use JSON format with --json flag', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.JSON);
      expect(output.isJson()).toBe(true);
    });

    it('should use Pretty format with --pretty flag', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--pretty'];
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.PRETTY);
      expect(output.isPretty()).toBe(true);
    });

    it('should prioritize --pretty flag over default', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--pretty'];
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.PRETTY);
    });

    it('should use env var OPTIMA_CLI_FORMAT=pretty', () => {
      process.argv = ['node', 'optima', 'product', 'list'];
      process.env.OPTIMA_CLI_FORMAT = 'pretty';
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.PRETTY);
    });

    it('should use env var OPTIMA_CLI_FORMAT=json', () => {
      process.argv = ['node', 'optima', 'product', 'list'];
      process.env.OPTIMA_CLI_FORMAT = 'json';
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.JSON);
    });

    it('should prioritize CLI flag over env var', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--pretty'];
      process.env.OPTIMA_CLI_FORMAT = 'json';
      const output = new OutputManager();

      expect(output.getFormat()).toBe(OutputFormat.PRETTY);
    });
  });

  describe('Success Output', () => {
    it('should output JSON format correctly', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      const data = { products: [{ id: '123', name: 'Test' }], total: 1 };
      output.success(data);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedOutput = consoleLogSpy.mock.calls[0][0];
      expect(loggedOutput).toContain('"success": true');
      expect(loggedOutput).toContain('"data"');
      expect(loggedOutput).toContain('"products"');

      const parsed = JSON.parse(loggedOutput as string);
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual(data);
    });

    it('should include message in JSON output', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      output.success({ id: '123' }, 'Product created');

      const loggedOutput = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(loggedOutput as string);
      expect(parsed.message).toBe('Product created');
    });

    it('should not output anything in Pretty mode', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--pretty'];
      const output = new OutputManager();

      output.success({ id: '123' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Output', () => {
    it('should output JSON error format', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      try {
        output.error(new Error('Test error'), 'TEST_ERROR');
      } catch (e) {
        // Expected to throw
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedOutput = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(loggedOutput as string);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBeDefined();
      expect(parsed.error.code).toBe('TEST_ERROR');
      expect(parsed.error.message).toBe('Test error');
    });

    it('should include stack trace in debug mode', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      process.env.DEBUG = 'true';
      const output = new OutputManager();

      try {
        output.error(new Error('Test error'), 'TEST_ERROR');
      } catch (e) {
        // Expected to throw
      }

      const loggedOutput = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(loggedOutput as string);

      expect(parsed.error.stack).toBeDefined();
    });

    it('should handle string errors', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      try {
        output.error('Simple error message', 'SIMPLE_ERROR');
      } catch (e) {
        // Expected to throw
      }

      const loggedOutput = consoleLogSpy.mock.calls[0][0];
      const parsed = JSON.parse(loggedOutput as string);

      expect(parsed.error.message).toBe('Simple error message');
      expect(parsed.error.code).toBe('SIMPLE_ERROR');
    });

    it('should exit with code 1', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      expect(() => {
        output.error(new Error('Test error'));
      }).toThrow('process.exit(1)');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('Spinner', () => {
    it('should return MockSpinner in JSON mode', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      const spinner = output.spinner('Loading...');

      expect(spinner.succeed).toBeDefined();
      expect(spinner.fail).toBeDefined();
      expect(spinner.stop).toBeDefined();

      // Should not throw
      spinner.succeed('Done');
      spinner.fail('Failed');
      spinner.stop();
    });

    it('should return real ora spinner in Pretty mode', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--pretty'];
      const output = new OutputManager();

      const spinner = output.spinner('Loading...');

      expect(spinner).toBeDefined();
      expect(spinner.succeed).toBeDefined();
      // Stop the spinner to avoid output
      spinner.stop();
    });
  });

  describe('Lazy Initialization', () => {
    it('should initialize format on first access', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      // Format should not be set yet
      expect((output as any)._format).toBeUndefined();

      // First access should initialize
      const format = output.getFormat();
      expect(format).toBe(OutputFormat.JSON);
      expect((output as any)._format).toBe(OutputFormat.JSON);
    });

    it('should only initialize once', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      const format1 = output.getFormat();
      const format2 = output.getFormat();

      expect(format1).toBe(format2);
      expect(format1).toBe(OutputFormat.JSON);
    });
  });

  describe('Backward Compatibility', () => {
    it('should support deprecated init method', () => {
      process.argv = ['node', 'optima', 'product', 'list', '--json'];
      const output = new OutputManager();

      // Should not throw
      expect(() => {
        output.init({ json: true, pretty: false });
      }).not.toThrow();
    });
  });
});
