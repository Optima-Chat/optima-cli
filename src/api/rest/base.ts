import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ensureValidToken } from '../../utils/config.js';

/**
 * 创建带认证的 API 客户端
 * 自动在请求前刷新 token（如果需要）
 */
export function createAuthenticatedClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'User-Agent': 'Optima-CLI/0.1.0',
    },
  });

  // 请求拦截器：自动添加 token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 跳过不需要认证的请求
      const skipAuth = [
        '/api/v1/oauth/device/authorize',
        '/api/v1/oauth/device/token',
        '/api/v1/oauth/token',
      ];

      const url = config.url || '';
      if (skipAuth.some(path => url.includes(path))) {
        return config;
      }

      // 获取有效 token（自动刷新）
      const token = await ensureValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
}
