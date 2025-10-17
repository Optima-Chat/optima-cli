# OAuth 2.0 Device Flow 技术方案

## 1. 概述

本文档描述 Optima CLI 使用 OAuth 2.0 Device Authorization Grant（RFC 8628）实现用户认证的完整技术方案。

### 1.1 背景

Optima CLI 是一个命令行工具，需要用户授权才能访问 Optima Commerce API。由于 CLI 运行在终端环境中，无法像 Web 应用那样直接重定向浏览器获取授权码。Device Flow 是专为此类场景设计的标准 OAuth 2.0 授权流程。

### 1.2 目标

- ✅ 用户在浏览器中完成所有认证操作（邮箱验证码/Google/GitHub）
- ✅ CLI 无需启动本地 HTTP 服务器
- ✅ 安全可靠，符合 OAuth 2.0 标准
- ✅ 用户体验流畅

### 1.3 参考标准

- [RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)

---

## 2. Device Flow 原理

### 2.1 标准流程

```
+----------+                                +----------------+
|          |>---(A)-- Client Identifier --->|                |
|          |                                |                |
|          |<---(B)-- Device Code,      ----<|                |
|          |          User Code,            |                |
|  Device  |          & Verification URI    |                |
|  Client  |                                |                |
|          |  [polling]                     |                |
|          |>---(E)-- Device Code       --->|                |
|          |          & Client Identifier   |                |
|          |                                |  Authorization |
|          |<---(F)-- Access Token      ----<|     Server     |
+----------+   (& Optional Refresh Token)   |                |
      v                                     |                |
      :                                     |                |
     (C) User Code & Verification URI       |                |
      :                                     |                |
      v                                     |                |
+----------+                                |                |
| End User |                                |                |
|    at    |<---(D)-- End user reviews  --->|                |
|  Browser |          authorization request |                |
+----------+                                +----------------+
```

### 2.2 Optima 实现架构

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Optima CLI    │         │   user-auth API  │         │  agentic-chat    │
│  (CLI Client)   │         │  (Auth Server)   │         │   (Web UI)       │
└─────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │ (A) POST /device/authorize │                            │
        │────────────────────────────>│                            │
        │                            │                            │
        │ (B) device_code,           │                            │
        │     user_code,             │                            │
        │     verification_uri       │                            │
        │<────────────────────────────│                            │
        │                            │                            │
        │ (C) Display:               │                            │
        │     Visit: ai.optima.chat/device                        │
        │     Code: ABCD-1234        │                            │
        │                            │                            │
        │                            │      (D) User visits       │
        │                            │      /device page          │
        │                            │<───────────────────────────│
        │                            │                            │
        │                            │      Inputs user_code      │
        │                            │      ABCD-1234             │
        │                            │                            │
        │                            │      GET /device/verify    │
        │                            │      ?code=ABCD-1234       │
        │                            │<───────────────────────────│
        │                            │                            │
        │                            │      Valid ✓               │
        │                            │────────────────────────────>│
        │                            │                            │
        │                            │      User login/authorize  │
        │                            │      (email/Google/GitHub) │
        │                            │                            │
        │                            │      POST /device/approve  │
        │                            │      { user_code, token }  │
        │                            │<───────────────────────────│
        │                            │                            │
        │                            │      Success ✓             │
        │                            │────────────────────────────>│
        │                            │                            │
        │                            │      Show: Authorization   │
        │                            │            complete!       │
        │                            │                            │
        │ (E) Poll:                  │                            │
        │     POST /device/token     │                            │
        │     { device_code }        │                            │
        │────────────────────────────>│                            │
        │                            │                            │
        │ (F) access_token,          │                            │
        │     refresh_token          │                            │
        │<────────────────────────────│                            │
        │                            │                            │
        │ ✓ Login success!           │                            │
        │                            │                            │
```

---

## 3. API 设计

### 3.1 user-auth API 端点

#### 3.1.1 请求 Device Code

**端点**: `POST /api/v1/oauth/device/authorize`

**请求**:
```json
{
  "client_id": "optima-cli",
  "scope": "merchant"
}
```

**响应**:
```json
{
  "device_code": "4e3d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
  "user_code": "ABCD-1234",
  "verification_uri": "https://ai.optima.chat/device",
  "verification_uri_complete": "https://ai.optima.chat/device?code=ABCD-1234",
  "expires_in": 600,
  "interval": 5
}
```

**字段说明**:
- `device_code`: 设备码（CLI 用于轮询）
- `user_code`: 用户码（用户在浏览器输入）
- `verification_uri`: 验证页面地址
- `verification_uri_complete`: 带预填代码的完整 URL（可选）
- `expires_in`: 有效期（秒），推荐 600（10 分钟）
- `interval`: 轮询间隔（秒），推荐 5

#### 3.1.2 验证 User Code

**端点**: `GET /api/v1/oauth/device/verify?code={user_code}`

**响应**:
```json
{
  "valid": true,
  "client_name": "Optima CLI",
  "scope": "merchant",
  "expires_in": 450
}
```

**错误响应**:
```json
{
  "error": "invalid_code",
  "error_description": "The user code is invalid or expired"
}
```

#### 3.1.3 授权 Device Code

**端点**: `POST /api/v1/oauth/device/approve`

**请求头**:
```
Authorization: Bearer <user_access_token>
```

**请求**:
```json
{
  "user_code": "ABCD-1234"
}
```

**响应**:
```json
{
  "success": true
}
```

**说明**: 此接口由 agentic-chat 调用，需要用户的 access_token。

#### 3.1.4 轮询获取 Token

**端点**: `POST /api/v1/oauth/device/token`

**请求**:
```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
  "device_code": "4e3d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
  "client_id": "optima-cli"
}
```

**响应（待授权）**:
```json
{
  "error": "authorization_pending",
  "error_description": "User has not yet completed authorization"
}
```

**响应（慢一点）**:
```json
{
  "error": "slow_down",
  "error_description": "Polling too frequently"
}
```

**响应（成功）**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "merchant"
}
```

**响应（过期）**:
```json
{
  "error": "expired_token",
  "error_description": "The device code has expired"
}
```

### 3.2 agentic-chat Web 页面

#### 3.2.1 Device 授权页面

**路由**: `/device`

**功能**:
1. 输入 user_code（或从 URL 参数 `?code=ABCD-1234` 获取）
2. 调用 `GET /api/v1/oauth/device/verify?code={user_code}` 验证代码
3. 如果用户未登录，重定向到登录页：`/login?redirect=/device&code={user_code}`
4. 如果用户已登录，显示授权确认页面
5. 用户点击"授权"后，调用 `POST /api/v1/oauth/device/approve`
6. 显示"✓ 授权成功！可以关闭此页面并返回终端"

**UI 流程**:

```
┌─────────────────────────────────────┐
│  Device Authorization               │
│                                     │
│  Enter the code displayed on your  │
│  device:                            │
│                                     │
│  [A][B][C][D]-[1][2][3][4]         │
│                                     │
│        [Continue]                   │
└─────────────────────────────────────┘
                ↓
         (验证代码)
                ↓
    ┌──────────────────────┐
    │   未登录？           │
    └──────────────────────┘
            ↓ Yes
    ┌──────────────────────┐
    │   登录页面           │
    │  (邮箱/Google/GitHub)│
    └──────────────────────┘
            ↓
    ┌──────────────────────┐
    │  已登录              │
    └──────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Authorize Optima CLI               │
│                                     │
│  Optima CLI is requesting access    │
│  to your account:                   │
│                                     │
│  Account: xuhao@optima.chat         │
│  Scope: Merchant Access             │
│                                     │
│  [Deny]  [Authorize]                │
└─────────────────────────────────────┘
                ↓ (点击 Authorize)
┌─────────────────────────────────────┐
│  ✓ Authorization Complete           │
│                                     │
│  You can now close this page and    │
│  return to your terminal.           │
└─────────────────────────────────────┘
```

---

## 4. 实现细节

### 4.1 user-auth 后端实现

#### 4.1.1 数据模型

```typescript
interface DeviceCode {
  id: string;
  device_code: string;      // 设备码（长随机字符串）
  user_code: string;        // 用户码（短码，如 ABCD-1234）
  client_id: string;        // 客户端 ID
  scope: string;            // 权限范围
  status: 'pending' | 'approved' | 'denied' | 'expired';
  user_id?: string;         // 授权的用户 ID
  created_at: Date;
  expires_at: Date;
  last_polled_at?: Date;    // 最后轮询时间（用于 slow_down）
}
```

#### 4.1.2 生成 User Code

```typescript
// 生成易读的用户码（8 字符，去除易混淆字符）
function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除 I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'; // 添加分隔符
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // 例如: ABCD-1234
}
```

#### 4.1.3 轮询速率限制

```typescript
// 检查轮询频率
function checkPollingRate(deviceCode: DeviceCode, interval: number): boolean {
  if (!deviceCode.last_polled_at) return true;

  const elapsed = Date.now() - deviceCode.last_polled_at.getTime();
  return elapsed >= interval * 1000;
}
```

#### 4.1.4 过期清理

```typescript
// 定期清理过期的 device code（建议用 cron job）
async function cleanupExpiredDeviceCodes() {
  await prisma.deviceCode.deleteMany({
    where: {
      expires_at: { lt: new Date() }
    }
  });
}
```

### 4.2 agentic-chat 前端实现

#### 4.2.1 Device 页面组件

```typescript
// app/device/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function DevicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [userCode, setUserCode] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [clientInfo, setClientInfo] = useState(null);

  // 自动验证预填的代码
  useEffect(() => {
    if (userCode && userCode.length === 9) {
      verifyCode();
    }
  }, []);

  const verifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/device/verify?code=${userCode}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || 'Invalid code');
        return;
      }

      setClientInfo(data);
      setVerified(true);

      // 检查是否登录
      const session = await getSession(); // 获取当前用户 session
      if (!session) {
        // 未登录，重定向到登录页
        router.push(`/login?redirect=/device&code=${userCode}`);
      }
    } catch (err) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: userCode }),
      });

      if (res.ok) {
        // 显示成功消息
        router.push('/device/success');
      } else {
        const data = await res.json();
        setError(data.error_description || 'Authorization failed');
      }
    } catch (err) {
      setError('Failed to authorize');
    } finally {
      setLoading(false);
    }
  };

  // UI 渲染逻辑...
}
```

#### 4.2.2 后端 API Route

```typescript
// app/api/auth/device/verify/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing code parameter' },
      { status: 400 }
    );
  }

  // 调用 user-auth API
  const response = await fetch(
    `${process.env.USER_AUTH_API_URL}/api/v1/oauth/device/verify?code=${code}`
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

```typescript
// app/api/auth/device/approve/route.ts
export async function POST(request: NextRequest) {
  // 获取当前用户的 access_token
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'Not logged in' },
      { status: 401 }
    );
  }

  const { user_code } = await request.json();

  // 调用 user-auth API
  const response = await fetch(
    `${process.env.USER_AUTH_API_URL}/api/v1/oauth/device/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ user_code }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

### 4.3 optima-cli 实现

#### 4.3.1 Device Flow 登录命令

```typescript
// src/commands/auth/login.ts
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import open from 'open';
import { authApi } from '../../api/rest/auth.js';
import { saveTokens, saveUser } from '../../utils/config.js';

export const loginCommand = new Command('login')
  .description('使用 Device Flow 登录（在浏览器中完成）')
  .action(async () => {
    try {
      const spinner = ora('正在请求授权...').start();

      // 步骤 1: 请求 device code
      const deviceAuth = await authApi.requestDeviceCode();
      spinner.stop();

      // 步骤 2: 显示给用户
      console.log(chalk.cyan('\n✨ 请在浏览器中完成登录授权\n'));
      console.log(chalk.white('请访问: ') + chalk.green(deviceAuth.verification_uri));
      console.log(chalk.white('输入代码: ') + chalk.bold.yellow(deviceAuth.user_code));
      console.log(chalk.gray(`\n提示: 代码 ${deviceAuth.expires_in / 60} 分钟内有效\n`));

      // 尝试自动打开浏览器
      try {
        await open(deviceAuth.verification_uri_complete || deviceAuth.verification_uri);
        console.log(chalk.gray('已在浏览器中打开授权页面...\n'));
      } catch (err) {
        // 静默失败，用户可以手动打开
      }

      // 步骤 3: 轮询等待授权
      const pollSpinner = ora('等待授权中...').start();

      const result = await authApi.pollDeviceToken(
        deviceAuth.device_code,
        deviceAuth.interval,
        deviceAuth.expires_in
      );

      pollSpinner.stop();

      if (result.error) {
        console.log(chalk.red(`\n❌ 授权失败: ${result.error_description}\n`));
        return;
      }

      // 步骤 4: 保存 token
      saveTokens(result.access_token, result.refresh_token, result.expires_in);

      // 获取用户信息
      const user = await authApi.getCurrentUser(result.access_token);
      saveUser(user);

      console.log(chalk.green('\n✓ 登录成功！\n'));
      console.log(chalk.white('👤 用户信息:'));
      console.log(chalk.gray(`   邮箱: ${user.email}`));
      console.log(chalk.gray(`   姓名: ${user.name}`));
      console.log(chalk.gray(`   角色: ${user.role}\n`));
    } catch (error: any) {
      console.log(chalk.red(`\n❌ 登录失败: ${error.message}\n`));
    }
  });
```

#### 4.3.2 Auth API Client

```typescript
// src/api/rest/auth.ts
interface DeviceAuthResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

class AuthApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://auth.optima.chat', // user-auth API
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 请求 Device Code
   */
  async requestDeviceCode(): Promise<DeviceAuthResponse> {
    const response = await this.client.post<DeviceAuthResponse>(
      '/api/v1/oauth/device/authorize',
      {
        client_id: 'optima-cli',
        scope: 'merchant',
      }
    );
    return response.data;
  }

  /**
   * 轮询获取 Token
   */
  async pollDeviceToken(
    deviceCode: string,
    interval: number,
    expiresIn: number
  ): Promise<TokenResponse> {
    const startTime = Date.now();
    const timeout = expiresIn * 1000;

    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.client.post<TokenResponse>(
          '/api/v1/oauth/device/token',
          {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: 'optima-cli',
          }
        );

        // 成功获取 token
        if (response.data.access_token) {
          return response.data;
        }

        // 继续等待
        if (response.data.error === 'authorization_pending') {
          await this.sleep(interval * 1000);
          continue;
        }

        // slow_down: 增加等待时间
        if (response.data.error === 'slow_down') {
          await this.sleep((interval + 5) * 1000);
          continue;
        }

        // 其他错误
        return response.data;
      } catch (error: any) {
        if (error.response?.data) {
          return error.response.data;
        }
        throw error;
      }
    }

    return {
      error: 'expired_token',
      error_description: 'Authorization timed out',
    } as TokenResponse;
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(accessToken: string): Promise<any> {
    const response = await this.client.get('/api/v1/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const authApi = new AuthApiClient();
```

---

## 5. 安全考虑

### 5.1 User Code 设计

- ✅ 使用易读字符（去除易混淆的 I/O/0/1）
- ✅ 添加分隔符提高可读性（ABCD-1234）
- ✅ 足够长度防止暴力破解（8 字符 = 32^8 ≈ 1.1 万亿种组合）
- ✅ 短期有效（推荐 10 分钟）

### 5.2 Device Code 设计

- ✅ 使用加密安全的随机生成器（crypto.randomBytes）
- ✅ 足够长度（32+ 字符）
- ✅ 一次性使用（授权后立即失效）

### 5.3 轮询速率限制

- ✅ 强制最小轮询间隔（5 秒）
- ✅ slow_down 错误机制
- ✅ 防止 DDoS 攻击

### 5.4 作用域控制

- ✅ 明确指定权限范围（scope）
- ✅ 用户可见授权范围
- ✅ 最小权限原则

### 5.5 HTTPS

- ✅ 所有 API 通信必须使用 HTTPS
- ✅ 验证 SSL 证书

---

## 6. 用户体验优化

### 6.1 自动打开浏览器

CLI 可以尝试自动打开浏览器（使用 `open` npm 包），减少用户操作步骤：

```typescript
import open from 'open';

// 打开预填代码的 URL
await open('https://ai.optima.chat/device?code=ABCD-1234');
```

### 6.2 预填 User Code

使用 `verification_uri_complete` 字段提供预填代码的 URL：

```
https://ai.optima.chat/device?code=ABCD-1234
```

用户无需手动输入代码，直接点击"授权"即可。

### 6.3 实时反馈

- CLI 显示轮询状态（加载动画）
- Web 页面显示清晰的状态（验证中/授权中/完成）
- 授权完成后，CLI 立即响应（无需等待完整轮询周期）

### 6.4 错误处理

- 代码过期：提示重新运行 `optima auth login`
- 用户拒绝：显示友好的拒绝消息
- 网络错误：提示检查网络连接

---

## 7. 测试场景

### 7.1 正常流程

1. 用户运行 `optima auth login`
2. CLI 显示代码和 URL
3. 用户在浏览器输入代码
4. 用户登录（首次）或直接授权（已登录）
5. CLI 获取 token 并保存
6. 显示登录成功

### 7.2 代码过期

1. 用户运行 `optima auth login`
2. 等待超过 10 分钟
3. CLI 显示"授权超时"错误
4. 提示重新运行命令

### 7.3 用户拒绝授权

1. 用户运行 `optima auth login`
2. 在浏览器中点击"拒绝"
3. CLI 显示"用户拒绝授权"
4. 正常退出

### 7.4 无效代码

1. 用户在浏览器输入错误代码
2. 显示"代码无效或已过期"
3. 提示重新输入

### 7.5 网络中断

1. 用户运行 `optima auth login`
2. 网络中断
3. CLI 显示网络错误
4. 提示检查网络连接后重试

### 7.6 重复授权

1. 用户已登录
2. 再次运行 `optima auth login`
3. 流程正常，覆盖旧 token

---

## 8. 实施计划

### Phase 1: user-auth 后端实现（预计 3-5 天）

- [ ] 数据库 schema 设计
- [ ] POST /api/v1/oauth/device/authorize
- [ ] GET /api/v1/oauth/device/verify
- [ ] POST /api/v1/oauth/device/approve
- [ ] POST /api/v1/oauth/device/token
- [ ] 过期清理 cron job
- [ ] 单元测试

### Phase 2: agentic-chat Web 实现（预计 2-3 天）

- [ ] /device 页面 UI
- [ ] /device/success 成功页面
- [ ] API route 封装
- [ ] 登录重定向逻辑
- [ ] 授权确认流程

### Phase 3: optima-cli 实现（预计 1-2 天）

- [ ] Device Flow 登录命令
- [ ] Auth API client
- [ ] 轮询逻辑
- [ ] 自动打开浏览器
- [ ] 错误处理

### Phase 4: 集成测试（预计 1-2 天）

- [ ] 端到端测试
- [ ] 多场景测试
- [ ] 性能测试

**总计: 7-12 天**

---

## 9. 参考资料

- [RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_login)
- [Google OAuth 2.0 for TV and Limited-Input Devices](https://developers.google.com/identity/protocols/oauth2/limited-input-device)
- [AWS CLI SSO](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

---

**最后更新**: 2025-10-18
**版本**: 1.0
**作者**: Optima CLI Team
