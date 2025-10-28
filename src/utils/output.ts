import chalk from 'chalk';
import ora, { Ora } from 'ora';

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
  succeed(_message?: string) { return this; }
  fail(_message?: string) { return this; }
  stop() { return this; }
  start() { return this; }
  warn(_message?: string) { return this; }
  info(_message?: string) { return this; }
}

/**
 * 输出管理器
 */
export class OutputManager {
  private _format?: OutputFormat;

  constructor() {
    // 延迟初始化，在第一次访问时确定格式
  }

  /**
   * 获取输出格式（延迟初始化）
   */
  private ensureFormat(): void {
    if (this._format !== undefined) {
      return;
    }

    // 优先级：CLI 参数 > 环境变量 > 默认值
    const args = process.argv;

    if (args.includes('--json')) {
      this._format = OutputFormat.JSON;
    } else if (args.includes('--pretty')) {
      this._format = OutputFormat.PRETTY;
    } else {
      const envFormat = process.env.OPTIMA_CLI_FORMAT?.toLowerCase();
      this._format = envFormat === 'pretty'
        ? OutputFormat.PRETTY
        : OutputFormat.JSON;
    }
  }

  /**
   * 初始化输出管理器（向后兼容，现在不需要了）
   * @deprecated 不再需要显式调用
   */
  init(_programOpts: any) {
    // 保留此方法以向后兼容，但不再需要
  }

  /**
   * 获取当前输出格式
   */
  getFormat(): OutputFormat {
    this.ensureFormat();
    return this._format!;
  }

  /**
   * 输出成功响应
   */
  success(data: any, message?: string): void {
    this.ensureFormat();
    if (this._format === OutputFormat.JSON) {
      const response: CliResponse = {
        success: true,
        data,
        ...(message && { message })
      };
      console.log(JSON.stringify(response, null, 2));
    } else {
      // Pretty 模式：由调用方负责格式化输出
      // 此方法在 Pretty 模式下不输出任何内容
      // 调用方应该使用原有的格式化逻辑
    }
  }

  /**
   * 输出错误响应
   */
  error(error: Error | string, code?: string): never {
    this.ensureFormat();
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    if (this._format === OutputFormat.JSON) {
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
    } else {
      // Pretty 模式：使用原有错误处理
      const { handleError } = require('./error.js');
      handleError(errorObj);
    }

    // 确保函数永远不返回
    process.exit(1);
  }

  /**
   * 创建 spinner（JSON 模式下返回 mock）
   */
  spinner(text: string): Ora | MockSpinner {
    this.ensureFormat();
    if (this._format === OutputFormat.JSON) {
      return new MockSpinner() as any;
    }
    return ora(text).start();
  }

  /**
   * 判断是否为 JSON 模式
   */
  isJson(): boolean {
    this.ensureFormat();
    return this._format === OutputFormat.JSON;
  }

  /**
   * 判断是否为 Pretty 模式
   */
  isPretty(): boolean {
    this.ensureFormat();
    return this._format === OutputFormat.PRETTY;
  }

  /**
   * 输出简单消息（仅 Pretty 模式）
   */
  log(message: string, color?: 'green' | 'yellow' | 'red' | 'cyan' | 'gray'): void {
    if (this.isPretty()) {
      const coloredMessage = color ? (chalk as any)[color](message) : message;
      console.log(coloredMessage);
    }
  }
}

/**
 * 全局输出管理器实例
 */
export const output = new OutputManager();
