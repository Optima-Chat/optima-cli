import Conf from 'conf';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ConfigSchema {
  tokens: TokenData | null;
  user: UserData | null;
}

// 创建配置实例
const config = new Conf<ConfigSchema>({
  projectName: 'optima-cli',
  encryptionKey: 'optima-cli-secret-key-2025',
  defaults: {
    tokens: null,
    user: null,
  },
});

/**
 * 保存认证令牌
 */
export function saveTokens(
  access_token: string,
  refresh_token: string,
  expires_in: number
): void {
  const expires_at = Date.now() + expires_in * 1000;
  config.set('tokens', {
    access_token,
    refresh_token,
    expires_in,
    expires_at,
  });
}

/**
 * 获取访问令牌（不刷新）
 * 优先级：OPTIMA_TOKEN 环境变量 > 配置文件
 */
export function getAccessToken(): string | null {
  // 1. 优先从环境变量读取
  if (process.env.OPTIMA_TOKEN) {
    return process.env.OPTIMA_TOKEN;
  }

  // 2. 从配置文件读取
  const tokens = config.get('tokens');
  if (!tokens) return null;
  return tokens.access_token;
}

/**
 * 获取 token 过期时间
 */
export function getTokenExpiresAt(): number | null {
  const tokens = config.get('tokens');
  return tokens?.expires_at ?? null;
}

/**
 * 检查 token 是否过期
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

/**
 * 获取刷新令牌
 */
export function getRefreshToken(): string | null {
  const tokens = config.get('tokens');
  return tokens?.refresh_token ?? null;
}

/**
 * 检查是否已认证（不检查过期）
 */
export function isAuthenticated(): boolean {
  // 环境变量或配置文件中有 token
  const token = getAccessToken();
  return token !== null;
}

/**
 * 确保有效的访问令牌（自动刷新）
 * @returns 有效的访问令牌，如果无法获取则返回 null
 */
export async function ensureValidToken(): Promise<string | null> {
  // 1. 如果使用环境变量 token，直接返回（不刷新）
  if (process.env.OPTIMA_TOKEN) {
    return process.env.OPTIMA_TOKEN;
  }

  // 2. 使用配置文件 token（支持自动刷新）
  const tokens = config.get('tokens');
  if (!tokens) return null;

  // 如果未过期，直接返回
  if (!isTokenExpired()) {
    return tokens.access_token;
  }

  // Token 已过期，尝试刷新
  try {
    // 动态导入避免循环依赖
    const { authApi } = await import('../api/rest/auth.js');
    const result = await authApi.refreshToken(tokens.refresh_token);

    if (result.access_token && result.refresh_token && result.expires_in) {
      // 保存新的 token
      saveTokens(result.access_token, result.refresh_token, result.expires_in);
      return result.access_token;
    }

    // 刷新失败，清除配置
    clearConfig();
    return null;
  } catch (error) {
    // 刷新失败（可能 refresh token 也过期了），清除配置
    clearConfig();
    return null;
  }
}

/**
 * 保存用户信息
 */
export function saveUser(user: UserData): void {
  config.set('user', user);
}

/**
 * 获取当前用户信息
 */
export function getUser(): UserData | null {
  return config.get('user');
}

/**
 * 清除所有配置（登出）
 */
export function clearConfig(): void {
  config.clear();
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return config.path;
}
