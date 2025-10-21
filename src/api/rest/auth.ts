import { createAuthenticatedClient } from './base.js';
import { AxiosInstance } from 'axios';

// 支持环境变量配置 Auth API 地址
const AUTH_API_BASE_URL = process.env.OPTIMA_AUTH_URL || 'https://auth.optima.chat';
const OAUTH_CLIENT_ID = 'optima-cli-cwkbnadr';

interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

class AuthApiClient {
  private client: AxiosInstance;

  constructor() {
    // 使用带自动 token 刷新的客户端
    this.client = createAuthenticatedClient(AUTH_API_BASE_URL);
  }

  /**
   * 请求 Device Code
   */
  async requestDeviceCode(): Promise<DeviceAuthResponse> {
    const response = await this.client.post<DeviceAuthResponse>(
      '/api/v1/oauth/device/authorize',
      {
        client_id: OAUTH_CLIENT_ID,
        scope: 'read user merchant',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }

  /**
   * 轮询获取 Token
   * 重要: 必须使用 application/x-www-form-urlencoded 格式（符合 RFC 8628）
   */
  async pollDeviceToken(
    deviceCode: string,
    interval: number,
    expiresIn: number
  ): Promise<TokenResponse> {
    const startTime = Date.now();
    const timeout = expiresIn * 1000;
    let currentInterval = interval;

    while (Date.now() - startTime < timeout) {
      try {
        // 使用 URLSearchParams 构造 form-urlencoded 数据
        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
        params.append('device_code', deviceCode);
        params.append('client_id', OAUTH_CLIENT_ID);

        const response = await this.client.post<TokenResponse>(
          '/api/v1/oauth/device/token',
          params,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        const data = response.data;

        // 成功获取 token
        if (data.access_token) {
          return data;
        }

        // 继续等待
        if (data.error === 'authorization_pending') {
          await this.sleep(currentInterval * 1000);
          continue;
        }

        // slow_down: 增加轮询间隔
        if (data.error === 'slow_down') {
          currentInterval += 5;
          await this.sleep(currentInterval * 1000);
          continue;
        }

        // 其他错误（用户拒绝、过期等）
        return data;
      } catch (error: any) {
        // 处理 HTTP 错误
        if (error.response?.data) {
          const data = error.response.data;

          // authorization_pending 不是真正的错误
          if (data.error === 'authorization_pending') {
            await this.sleep(currentInterval * 1000);
            continue;
          }

          // slow_down
          if (data.error === 'slow_down') {
            currentInterval += 5;
            await this.sleep(currentInterval * 1000);
            continue;
          }

          // 其他错误
          return data;
        }

        // 网络错误
        throw error;
      }
    }

    // 超时
    return {
      error: 'expired_token',
      error_description: 'Authorization timed out',
    };
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(accessToken: string): Promise<UserResponse> {
    const response = await this.client.get<UserResponse>('/api/v1/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  /**
   * 刷新 Token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);
    params.append('client_id', OAUTH_CLIENT_ID);

    const response = await this.client.post<TokenResponse>(
      '/api/v1/oauth/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data;
  }

  /**
   * 登出（撤销 token）
   */
  async logout(token: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('client_id', OAUTH_CLIENT_ID);

    await this.client.post(
      '/api/v1/oauth/revoke',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const authApi = new AuthApiClient();
