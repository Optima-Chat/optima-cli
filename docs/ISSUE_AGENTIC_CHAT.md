# [agentic-chat] 实现 Device Flow 授权页面支持 CLI 登录

## 问题描述

Optima CLI 需要实现用户认证功能。用户在 CLI 运行 `optima auth login` 后，会获得一个授权码（如 `ABCD-1234`），需要在浏览器中访问 agentic-chat 的授权页面完成登录和授权。

## 需求背景

- **CLI 工具**：optima-cli 使用 OAuth 2.0 Device Flow 进行认证
- **用户体验**：用户在熟悉的浏览器环境完成登录（邮箱验证码/Google/GitHub）
- **授权服务器**：user-auth 提供后端 API
- **Web UI**：agentic-chat 提供用户授权界面

## 技术方案

详细技术方案请查看：[DEVICE_FLOW_DESIGN.md](https://github.com/Optima-Chat/optima-cli/blob/main/docs/DEVICE_FLOW_DESIGN.md)

---

## 需要实现的功能

### 1. Device 授权页面 `/device`

**功能**：
1. 让用户输入从 CLI 获得的授权码（如 `ABCD-1234`）
2. 验证授权码是否有效
3. 检查用户是否已登录
4. 未登录则引导到登录页面
5. 已登录则显示授权确认页面
6. 完成授权后显示成功消息

**URL 路由**：
- `/device` - 主授权页面
- `/device?code=ABCD-1234` - 预填授权码（CLI 会打开此 URL）

---

### 2. 页面 UI 流程

#### 第一步：输入授权码

```
┌─────────────────────────────────────┐
│  Device Authorization               │
│                                     │
│  To authorize Optima CLI, enter    │
│  the code displayed on your device:│
│                                     │
│  ┌───┬───┬───┬───┐─┌───┬───┬───┬───┐│
│  │ A │ B │ C │ D │ │ 1 │ 2 │ 3 │ 4 ││
│  └───┴───┴───┴───┘ └───┴───┴───┴───┘│
│                                     │
│           [Continue]                │
│                                     │
│  Code not working? Try again        │
└─────────────────────────────────────┘
```

**实现要点**：
- 输入框支持自动分组（ABCD-1234 格式）
- 自动转为大写
- 验证格式（8 字符 + 分隔符）
- 如果 URL 包含 `?code=` 参数，自动填充

---

#### 第二步：验证码并检查登录状态

```typescript
// 伪代码
const { code } = useSearchParams();

// 验证 code
const verifyResult = await fetch(`/api/auth/device/verify?code=${code}`);

if (verifyResult.valid) {
  // 检查是否登录
  const session = await getSession();

  if (!session) {
    // 未登录，重定向到登录页
    router.push(`/login?redirect=/device&code=${code}`);
  } else {
    // 已登录，显示授权确认页面
    showAuthorizationPage();
  }
} else {
  // 代码无效
  showError('Invalid or expired code');
}
```

---

#### 第三步：登录页面重定向

如果用户未登录，重定向到 `/login`，并带上参数：

```
/login?redirect=/device&code=ABCD-1234
```

用户完成登录后，自动回到：

```
/device?code=ABCD-1234
```

**支持的登录方式**：
- ✅ 邮箱验证码登录
- ✅ Google 登录
- ✅ GitHub 登录

---

#### 第四步：授权确认页面（已登录）

```
┌─────────────────────────────────────┐
│  Authorize Optima CLI               │
│                                     │
│  Optima CLI is requesting access    │
│  to your account                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  👤 xuhao@optima.chat       │   │
│  │  🔐 Merchant Access         │   │
│  └─────────────────────────────┘   │
│                                     │
│  This will allow Optima CLI to:     │
│  • Manage your products             │
│  • View and manage orders           │
│  • Access merchant data             │
│                                     │
│  [Deny]           [Authorize]       │
└─────────────────────────────────────┘
```

**实现要点**：
- 显示当前登录用户信息
- 显示请求的权限范围
- 两个按钮：拒绝 / 授权

---

#### 第五步：授权成功页面

```
┌─────────────────────────────────────┐
│  ✓ Authorization Complete           │
│                                     │
│  You have successfully authorized   │
│  Optima CLI                         │
│                                     │
│  You can now close this window and  │
│  return to your terminal.           │
│                                     │
│  [Close Window]                     │
└─────────────────────────────────────┘
```

---

### 3. 需要调用的 user-auth API

#### 3.1 验证授权码

```typescript
// GET /api/v1/oauth/device/verify?code=ABCD-1234

const response = await fetch(
  `${process.env.USER_AUTH_API_URL}/api/v1/oauth/device/verify?code=${code}`
);

const result = await response.json();
// { valid: true, client_name: "Optima CLI", scope: "merchant", expires_in: 450 }
```

#### 3.2 完成授权

```typescript
// POST /api/v1/oauth/device/approve

const session = await getServerSession();

const response = await fetch(
  `${process.env.USER_AUTH_API_URL}/api/v1/oauth/device/approve`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ user_code: code }),
  }
);

// { success: true }
```

---

## 实现文件结构

### 页面路由

```
app/
├── device/
│   ├── page.tsx              # 主授权页面
│   ├── success/
│   │   └── page.tsx          # 授权成功页面
│   └── components/
│       ├── CodeInput.tsx     # 授权码输入组件
│       └── AuthorizeCard.tsx # 授权确认卡片
```

### API Routes

```
app/
├── api/
│   └── auth/
│       └── device/
│           ├── verify/
│           │   └── route.ts  # GET - 验证授权码
│           └── approve/
│               └── route.ts  # POST - 完成授权
```

---

## 代码实现示例

### 1. Device 页面组件

```typescript
// app/device/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CodeInput from './components/CodeInput';
import AuthorizeCard from './components/AuthorizeCard';

export default function DevicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [step, setStep] = useState<'input' | 'verify' | 'authorize' | 'success'>('input');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<any>(null);

  // 自动验证预填的代码
  useEffect(() => {
    if (code && code.length === 9) {
      handleVerifyCode();
    }
  }, []);

  const handleVerifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/device/verify?code=${code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || 'Invalid code');
        setStep('input');
        return;
      }

      setClientInfo(data);
      setStep('verify');

      // 检查登录状态
      if (status === 'unauthenticated') {
        // 未登录，重定向到登录页
        router.push(`/login?redirect=${encodeURIComponent(`/device?code=${code}`)}`);
      } else if (status === 'authenticated') {
        // 已登录，显示授权页面
        setStep('authorize');
      }
    } catch (err) {
      setError('Failed to verify code');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: code }),
      });

      if (res.ok) {
        setStep('success');
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

  const handleDeny = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {step === 'input' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-6">
              Device Authorization
            </h1>
            <p className="text-gray-600 text-center mb-6">
              To authorize Optima CLI, enter the code displayed on your device
            </p>
            <CodeInput
              value={code}
              onChange={setCode}
              onSubmit={handleVerifyCode}
              disabled={loading}
            />
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 'authorize' && (
          <AuthorizeCard
            clientName={clientInfo?.client_name}
            scope={clientInfo?.scope}
            user={session?.user}
            onAuthorize={handleAuthorize}
            onDeny={handleDeny}
            loading={loading}
            error={error}
          />
        )}

        {step === 'success' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-4">Authorization Complete</h1>
            <p className="text-gray-600 mb-6">
              You have successfully authorized Optima CLI. You can now close this
              window and return to your terminal.
            </p>
            <button
              onClick={() => window.close()}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 2. API Route - 验证码

```typescript
// app/api/auth/device/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing code parameter' },
      { status: 400 }
    );
  }

  try {
    // 调用 user-auth API
    const response = await fetch(
      `${process.env.USER_AUTH_API_URL}/api/v1/oauth/device/verify?code=${code}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
```

### 3. API Route - 授权

```typescript
// app/api/auth/device/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  // 获取当前用户 session
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'Not logged in' },
      { status: 401 }
    );
  }

  try {
    const { user_code } = await request.json();

    if (!user_code) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing user_code' },
        { status: 400 }
      );
    }

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
  } catch (error) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to approve authorization' },
      { status: 500 }
    );
  }
}
```

### 4. 授权码输入组件

```typescript
// app/device/components/CodeInput.tsx
'use client';

import { useState, useRef, KeyboardEvent } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function CodeInput({ value, onChange, onSubmit, disabled }: CodeInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatCode = (input: string) => {
    // 只保留字母和数字
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 限制 8 个字符
    const limited = cleaned.slice(0, 8);

    // 添加分隔符
    if (limited.length > 4) {
      return limited.slice(0, 4) + '-' + limited.slice(4);
    }
    return limited;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    onChange(formatted);

    // 自动提交
    if (formatted.length === 9) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.length === 9) {
      onSubmit();
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        placeholder="ABCD-1234"
        className={`w-full text-center text-3xl font-mono tracking-widest py-4 px-6 border-2 rounded-lg outline-none transition-colors ${
          focused ? 'border-blue-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        maxLength={9}
      />
      <p className="mt-2 text-sm text-gray-500 text-center">
        Enter the 8-character code from your terminal
      </p>
    </div>
  );
}
```

---

## 环境变量

在 `.env` 或 `.env.local` 中添加：

```bash
# user-auth API 地址
USER_AUTH_API_URL=https://auth.optima.chat
```

---

## 测试场景

### 1. 正常流程（未登录用户）

1. 访问 `/device?code=ABCD-1234`
2. 页面验证代码有效
3. 检测到未登录，重定向到 `/login?redirect=/device&code=ABCD-1234`
4. 用户完成登录（邮箱/Google/GitHub）
5. 自动回到 `/device?code=ABCD-1234`
6. 显示授权确认页面
7. 点击"Authorize"
8. 显示"✓ Authorization Complete"

### 2. 正常流程（已登录用户）

1. 访问 `/device?code=ABCD-1234`
2. 页面验证代码有效
3. 检测到已登录，直接显示授权确认页面
4. 点击"Authorize"
5. 显示"✓ Authorization Complete"

### 3. 手动输入代码

1. 访问 `/device`（无参数）
2. 用户输入 `ABCD-1234`
3. 自动验证并进入授权流程

### 4. 无效代码

1. 访问 `/device?code=INVALID`
2. 显示错误："Invalid or expired code"
3. 允许重新输入

### 5. 用户拒绝授权

1. 访问 `/device?code=ABCD-1234`
2. 显示授权确认页面
3. 点击"Deny"
4. 返回首页

---

## 实施计划

- [ ] **Day 1**: 创建页面路由和基础布局
- [ ] **Day 1**: 实现授权码输入组件
- [ ] **Day 2**: 实现 API routes（verify + approve）
- [ ] **Day 2**: 集成登录重定向逻辑
- [ ] **Day 3**: 实现授权确认和成功页面
- [ ] **Day 3**: UI/UX 优化和测试

**预计工期**: 2-3 天

---

## 验收标准

1. ✅ `/device` 页面可正常访问
2. ✅ 授权码验证功能正常
3. ✅ 未登录用户正确重定向到登录页
4. ✅ 已登录用户可以完成授权
5. ✅ 授权成功后 CLI 可以获取 token
6. ✅ 错误处理友好
7. ✅ UI/UX 符合设计规范
8. ✅ 移动端适配

---

## 依赖关系

**依赖于**：
- user-auth 完成 Device Flow API 实现
- user-auth 提供以下端点：
  - `GET /api/v1/oauth/device/verify`
  - `POST /api/v1/oauth/device/approve`

**被依赖于**：
- optima-cli 需要此页面完成用户授权

---

## 参考资料

- 📄 [完整技术方案](https://github.com/Optima-Chat/optima-cli/blob/main/docs/DEVICE_FLOW_DESIGN.md)
- 📖 [RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- 🎨 [GitHub Device Flow UI 参考](https://github.com/login/device)

---

## UI/UX 参考

可参考以下产品的 Device Flow 授权页面：
- GitHub: https://github.com/login/device
- Google: https://www.google.com/device
- Microsoft: https://microsoft.com/devicelogin

---

**优先级**: 🔴 High
**标签**: `enhancement`, `authentication`, `frontend`, `ui/ux`
