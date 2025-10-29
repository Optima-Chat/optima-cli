/**
 * 交互式环境检测工具
 *
 * 自动检测是否应该使用交互式提示（inquirer）
 * 在非交互环境（AI、CI/CD）中返回 false
 */

import { ValidationError } from './error.js';

/**
 * 检测当前是否为交互式环境
 *
 * @returns true 如果在交互式终端环境，false 如果在非交互环境
 *
 * 检测逻辑：
 * 0. OPTIMA_INTERACTIVE=1 - 显式启用（最高优先级）
 * 1. process.stdin.isTTY - 标准输入是否为终端
 * 2. CI 环境变量 - 是否在 CI/CD 环境
 * 3. 显式禁用标志 - 用户手动禁用交互模式
 */
export function isInteractiveEnvironment(): boolean {
    // 检测 0：显式启用标志（最高优先级）
    // 允许用户在 CI 环境中强制启用交互模式（用于调试）
    if (process.env.OPTIMA_INTERACTIVE === '1') {
        return true;
    }

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
 * @returns 去除空格的参数值
 * @throws ValidationError 如果值为空
 *
 * @example
 * // 非交互模式下验证必需参数
 * const title = requireParam(options.title, 'title', '商品名称');
 * // 如果 options.title 为空，抛出：缺少必需参数: --title (商品名称)
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
 * @returns 解析后的数值
 * @throws ValidationError 如果值无效
 *
 * @example
 * // 验证价格参数（必须 > 0.01）
 * const price = requireNumberParam(options.price, 'price', '商品价格', 0.01);
 *
 * @example
 * // 验证库存参数（必须 >= 0）
 * const stock = requireNumberParam(options.stock, 'stock', '库存数量', 0);
 *
 * @example
 * // 验证重量参数（必须 0.1-1000 kg）
 * const weight = requireNumberParam(options.weight, 'weight', '重量', 0.1, 1000);
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
