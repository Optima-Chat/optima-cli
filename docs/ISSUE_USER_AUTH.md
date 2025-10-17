# [user-auth] 实现 OAuth 2.0 Device Flow 支持 CLI 登录

## 问题描述

Optima CLI 需要实现用户认证功能，让用户能够在命令行工具中登录。由于 CLI 运行在终端环境，传统的浏览器重定向授权流程不适用。需要实现标准的 OAuth 2.0 Device Authorization Grant（RFC 8628）来支持 CLI 登录。

## 需求背景

- **问题**：CLI 工具无法像 Web 应用那样接收浏览器重定向
- **解决方案**：Device Flow - 用户在浏览器完成登录，CLI 轮询获取 token
- **参考标准**：[RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- **参考实现**：GitHub CLI、AWS CLI、Google Cloud SDK

## 技术方案

详细技术方案请查看：[DEVICE_FLOW_DESIGN.md](https://github.com/Optima-Chat/optima-cli/blob/main/docs/DEVICE_FLOW_DESIGN.md)

## 需要实现的 API 端点

### 1. POST /api/v1/oauth/device/authorize

**功能**：CLI 请求 device code

**请求**：
```json
{
  "client_id": "optima-cli",
  "scope": "merchant"
}
```

**响应**：
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

**实现要点**：
- `device_code`: 32+ 字符随机字符串（使用 crypto.randomBytes）
- `user_code`: 8 字符易读代码（去除 I/O/0/1，添加分隔符）
- `expires_in`: 推荐 600 秒（10 分钟）
- `interval`: 推荐 5 秒（轮询间隔）
- 保存到数据库，状态为 `pending`

---

### 2. GET /api/v1/oauth/device/verify

**功能**：验证 user code 是否有效（供 agentic-chat 调用）

**请求**：
```
GET /api/v1/oauth/device/verify?code=ABCD-1234
```

**响应（有效）**：
```json
{
  "valid": true,
  "client_name": "Optima CLI",
  "scope": "merchant",
  "expires_in": 450
}
```

**响应（无效）**：
```json
{
  "error": "invalid_code",
  "error_description": "The user code is invalid or expired"
}
```

**实现要点**：
- 检查 user_code 是否存在且未过期
- 返回剩余有效时间
- 不修改状态

---

### 3. POST /api/v1/oauth/device/approve

**功能**：用户授权（供 agentic-chat 调用）

**请求头**：
```
Authorization: Bearer <user_access_token>
```

**请求**：
```json
{
  "user_code": "ABCD-1234"
}
```

**响应**：
```json
{
  "success": true
}
```

**实现要点**：
- 验证用户的 access_token（从 Authorization header）
- 查找对应的 device_code 记录
- 更新状态为 `approved`
- 记录 user_id
- 如果用户拒绝，状态设为 `denied`

---

### 4. POST /api/v1/oauth/device/token

**功能**：CLI 轮询获取 token

**请求**：
```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
  "device_code": "4e3d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
  "client_id": "optima-cli"
}
```

**响应（待授权）**：
```json
{
  "error": "authorization_pending",
  "error_description": "User has not yet completed authorization"
}
```

**响应（轮询过快）**：
```json
{
  "error": "slow_down",
  "error_description": "Polling too frequently"
}
```

**响应（成功）**：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "merchant"
}
```

**响应（过期）**：
```json
{
  "error": "expired_token",
  "error_description": "The device code has expired"
}
```

**响应（用户拒绝）**：
```json
{
  "error": "access_denied",
  "error_description": "User denied authorization"
}
```

**实现要点**：
- 查找 device_code 记录
- 检查是否过期
- 检查轮询频率（last_polled_at），如果 < interval 秒则返回 `slow_down`
- 更新 last_polled_at
- 根据状态返回：
  - `pending` → `authorization_pending`
  - `approved` → 生成 access_token 和 refresh_token，删除记录
  - `denied` → `access_denied`
  - `expired` → `expired_token`

---

## 数据库 Schema

### device_codes 表

```sql
CREATE TABLE device_codes (
  id VARCHAR(36) PRIMARY KEY,
  device_code VARCHAR(64) UNIQUE NOT NULL,
  user_code VARCHAR(9) UNIQUE NOT NULL,
  client_id VARCHAR(50) NOT NULL,
  scope VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'denied', 'expired') NOT NULL DEFAULT 'pending',
  user_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  last_polled_at TIMESTAMP,

  INDEX idx_device_code (device_code),
  INDEX idx_user_code (user_code),
  INDEX idx_expires_at (expires_at)
);
```

**或者使用 Prisma**：

```prisma
model DeviceCode {
  id            String    @id @default(uuid())
  deviceCode    String    @unique @map("device_code") @db.VarChar(64)
  userCode      String    @unique @map("user_code") @db.VarChar(9)
  clientId      String    @map("client_id") @db.VarChar(50)
  scope         String    @db.VarChar(255)
  status        DeviceCodeStatus @default(PENDING)
  userId        String?   @map("user_id") @db.VarChar(36)
  createdAt     DateTime  @default(now()) @map("created_at")
  expiresAt     DateTime  @map("expires_at")
  lastPolledAt  DateTime? @map("last_polled_at")

  @@index([deviceCode])
  @@index([userCode])
  @@index([expiresAt])
  @@map("device_codes")
}

enum DeviceCodeStatus {
  PENDING
  APPROVED
  DENIED
  EXPIRED
}
```

---

## 实现细节

### 1. 生成 User Code

```typescript
/**
 * 生成易读的用户码（去除易混淆字符）
 * 格式: ABCD-1234
 */
function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除 I, O, 0, 1
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

### 2. 生成 Device Code

```typescript
import crypto from 'crypto';

/**
 * 生成安全的 device code
 */
function generateDeviceCode(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

### 3. 轮询速率检查

```typescript
/**
 * 检查轮询频率
 */
function shouldSlowDown(lastPolledAt: Date | null, interval: number): boolean {
  if (!lastPolledAt) return false;

  const elapsed = (Date.now() - lastPolledAt.getTime()) / 1000;
  return elapsed < interval;
}
```

### 4. 过期清理（Cron Job）

```typescript
/**
 * 定期清理过期的 device code
 * 建议每小时运行一次
 */
async function cleanupExpiredDeviceCodes() {
  const deleted = await prisma.deviceCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  console.log(`Cleaned up ${deleted.count} expired device codes`);
}
```

---

## 安全考虑

1. **User Code 安全**
   - 使用加密安全的随机生成器
   - 去除易混淆字符提高可用性
   - 8 字符长度（32^8 ≈ 1.1 万亿种组合）
   - 短期有效（10 分钟）

2. **Device Code 安全**
   - 使用 crypto.randomBytes 生成
   - 64 字符（256 位）
   - 一次性使用

3. **速率限制**
   - 强制最小轮询间隔（5 秒）
   - slow_down 机制防止滥用
   - 记录 last_polled_at

4. **Token 安全**
   - 授权成功后立即删除 device_code 记录
   - Token 使用标准 JWT 或类似机制
   - 支持 refresh_token

---

## 测试用例

### 1. 正常流程

```typescript
// 1. 请求 device code
POST /api/v1/oauth/device/authorize
=> { device_code, user_code, verification_uri, ... }

// 2. 验证 user code
GET /api/v1/oauth/device/verify?code=ABCD-1234
=> { valid: true, ... }

// 3. 用户授权
POST /api/v1/oauth/device/approve
Headers: { Authorization: Bearer <user_token> }
Body: { user_code: "ABCD-1234" }
=> { success: true }

// 4. 轮询获取 token
POST /api/v1/oauth/device/token
Body: { grant_type: "...", device_code: "..." }
=> { access_token, refresh_token, ... }
```

### 2. 无效 User Code

```typescript
GET /api/v1/oauth/device/verify?code=INVALID
=> { error: "invalid_code", error_description: "..." }
```

### 3. 轮询过快

```typescript
// 第一次轮询
POST /api/v1/oauth/device/token
=> { error: "authorization_pending" }

// 立即第二次轮询（< 5 秒）
POST /api/v1/oauth/device/token
=> { error: "slow_down" }
```

### 4. 代码过期

```typescript
// 等待 > 600 秒
POST /api/v1/oauth/device/token
=> { error: "expired_token" }
```

### 5. 用户拒绝

```typescript
// 用户点击"拒绝"
POST /api/v1/oauth/device/approve
Body: { user_code: "ABCD-1234", action: "deny" }

// CLI 轮询
POST /api/v1/oauth/device/token
=> { error: "access_denied" }
```

---

## 实施计划

- [ ] **Day 1-2**: 数据库 schema + 基础 CRUD
- [ ] **Day 2-3**: 实现 4 个 API 端点
- [ ] **Day 3-4**: 轮询逻辑 + 速率限制
- [ ] **Day 4**: Token 生成集成
- [ ] **Day 5**: 单元测试 + 集成测试
- [ ] **Day 5**: Cron job 清理逻辑

**预计工期**: 3-5 天

---

## 验收标准

1. ✅ 所有 4 个 API 端点正常工作
2. ✅ User code 易读且唯一
3. ✅ 轮询速率限制生效
4. ✅ 过期清理正常运行
5. ✅ 单元测试覆盖率 > 80%
6. ✅ 集成测试通过
7. ✅ 与 agentic-chat 联调成功

---

## 参考资料

- 📄 [完整技术方案](https://github.com/Optima-Chat/optima-cli/blob/main/docs/DEVICE_FLOW_DESIGN.md)
- 📖 [RFC 8628: OAuth 2.0 Device Authorization Grant](https://datatracker.ietf.org/doc/html/rfc8628)
- 🔗 [GitHub CLI 实现参考](https://cli.github.com/manual/gh_auth_login)

---

## 联系方式

- **项目**: [optima-cli](https://github.com/Optima-Chat/optima-cli)
- **问题讨论**: GitHub Issues
- **技术方案**: docs/DEVICE_FLOW_DESIGN.md

---

**优先级**: 🔴 High
**标签**: `enhancement`, `authentication`, `backend`, `oauth`
