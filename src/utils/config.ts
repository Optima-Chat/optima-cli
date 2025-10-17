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
 * 获取访问令牌
 */
export function getAccessToken(): string | null {
  const tokens = config.get('tokens');
  if (!tokens) return null;

  // 检查是否过期
  if (Date.now() >= tokens.expires_at) {
    return null;
  }

  return tokens.access_token;
}

/**
 * 获取刷新令牌
 */
export function getRefreshToken(): string | null {
  const tokens = config.get('tokens');
  return tokens?.refresh_token ?? null;
}

/**
 * 检查是否已认证
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return token !== null;
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
