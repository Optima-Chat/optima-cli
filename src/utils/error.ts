import chalk from 'chalk';

/**
 * API 调用错误
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 输入验证错误
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 未认证错误
 */
export class AuthenticationError extends Error {
  constructor(message: string = '未登录，请先执行 optima auth login') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * 统一错误处理器
 */
export function handleError(error: unknown): never {
  if (error instanceof AuthenticationError) {
    // 认证错误 - 红色显示，提示登录
    console.error(chalk.red(`\n❌ 认证错误: ${error.message}`));
    console.error(chalk.gray('\n提示: 运行 ') + chalk.cyan('optima auth login') + chalk.gray(' 登录\n'));
    process.exit(1);
  }

  if (error instanceof ValidationError) {
    // 验证错误 - 黄色警告显示
    console.error(chalk.yellow(`\n⚠️  验证错误: ${error.message}`));
    if (error.field) {
      console.error(chalk.gray(`   字段: ${error.field}`));
    }
    console.error();
    process.exit(1);
  }

  if (error instanceof ApiError) {
    // API 错误 - 红色显示，附带状态码和错误码
    console.error(chalk.red(`\n❌ API 错误 [${error.statusCode}]: ${error.message}`));
    if (error.code) {
      console.error(chalk.gray(`   错误码: ${error.code}`));
    }
    if (error.details) {
      // 总是显示 details（如果有的话），因为它包含有用的诊断信息
      console.error(chalk.gray('   详情:'), JSON.stringify(error.details, null, 2));
    }
    console.error();
    process.exit(1);
  }

  if (error instanceof Error) {
    // 普通错误 - 红色显示
    console.error(chalk.red(`\n❌ 错误: ${error.message}`));

    // DEBUG 模式下显示堆栈
    if (process.env.DEBUG === 'true') {
      console.error(chalk.gray('\n堆栈跟踪:'));
      console.error(chalk.gray(error.stack));
    }
    console.error();
    process.exit(1);
  }

  // 未知错误
  console.error(chalk.red('\n❌ 未知错误:'), error);
  console.error();
  process.exit(1);
}

/**
 * 从 Axios 错误创建 ApiError
 */
export function createApiError(error: any): ApiError {
  const statusCode = error.response?.status || 500;
  const data = error.response?.data;

  // 提取错误信息
  const message = data?.message || data?.error_description || data?.error || error.message || '请求失败';
  const code = data?.code || data?.error;
  const details = data?.details || data;

  return new ApiError(message, statusCode, code, details);
}

/**
 * 包装异步函数，自动处理错误
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
    }
  }) as T;
}
