# 认证和授权示例

这个示例展示了如何使用 @ldesign/http 实现完整的认证和授权流程。

## 功能特性

- ✅ 用户登录和注册
- ✅ JWT 令牌管理
- ✅ 自动令牌刷新
- ✅ 认证拦截器
- ✅ 权限控制
- ✅ 路由守卫
- ✅ 退出登录

## 安装依赖

```bash
pnpm install
```

## 运行示例

```bash
pnpm dev
```

## 实现原理

### 1. 创建带认证的 HTTP 客户端

```typescript
import { createHttpClient, authInterceptor } from '@ldesign/http'

const client = await createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
})

// 添加认证拦截器
client.addRequestInterceptor(authInterceptor({
  tokenKey: 'accessToken',
  headerName: 'Authorization',
  tokenPrefix: 'Bearer',
  
  // 获取令牌
  getToken: () => {
    return localStorage.getItem('accessToken')
  },
  
  // 排除不需要认证的路径
  exclude: ['/auth/login', '/auth/register']
}))
```

### 2. 自动刷新令牌

```typescript
client.addResponseInterceptor(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 令牌过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 刷新令牌
        const refreshToken = localStorage.getItem('refreshToken')
        const response = await client.post('/auth/refresh', {
          refreshToken
        })

        const { accessToken } = response.data

        // 更新令牌
        localStorage.setItem('accessToken', accessToken)

        // 重试原请求
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
        return client.request(originalRequest)
      } catch (refreshError) {
        // 刷新失败，跳转登录
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
```

### 3. 登录

```typescript
async function login(username: string, password: string) {
  try {
    const response = await client.post('/auth/login', {
      username,
      password
    })

    const { accessToken, refreshToken, user } = response.data

    // 存储令牌
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)

    // 存储用户信息
    localStorage.setItem('user', JSON.stringify(user))

    return { success: true, user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### 4. 注册

```typescript
async function register(userData: {
  username: string
  password: string
  email: string
}) {
  try {
    const response = await client.post('/auth/register', userData)

    const { accessToken, refreshToken, user } = response.data

    // 存储令牌
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))

    return { success: true, user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### 5. 退出登录

```typescript
async function logout() {
  try {
    // 调用退出接口
    await client.post('/auth/logout')

    // 清除本地存储
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    // 跳转到登录页
    window.location.href = '/login'
  } catch (error) {
    console.error('退出失败:', error)
  }
}
```

### 6. 权限检查

```typescript
// 权限拦截器
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // 无权限
      alert('权限不足')
      // 或跳转到无权限页面
      // window.location.href = '/forbidden'
    }
    return Promise.reject(error)
  }
)
```

### 7. 路由守卫

```typescript
// Vue Router 示例
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('accessToken')

  if (to.meta.requiresAuth && !token) {
    // 需要认证但未登录
    next('/login')
  } else if (to.meta.guest && token) {
    // 已登录用户访问登录/注册页
    next('/')
  } else {
    next()
  }
})
```

## 安全最佳实践

### 1. 令牌存储

```typescript
// ❌ 不推荐：存储在 localStorage（易受 XSS 攻击）
localStorage.setItem('accessToken', token)

// ✅ 推荐：使用 httpOnly cookie（后端设置）
// 或使用 sessionStorage（关闭浏览器后清除）
sessionStorage.setItem('accessToken', token)
```

### 2. CSRF 防护

```typescript
// 添加 CSRF 令牌
client.addRequestInterceptor((config) => {
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})
```

### 3. 请求签名

```typescript
import { createSignatureInterceptor } from '@ldesign/http'

// 添加请求签名
client.addRequestInterceptor(createSignatureInterceptor({
  secret: 'your-secret-key',
  algorithm: 'HMAC-SHA256'
}))
```

### 4. 令牌刷新策略

```typescript
// 主动刷新策略：令牌快过期时主动刷新
let refreshTimer: NodeJS.Timeout | null = null

function scheduleTokenRefresh(expiresIn: number) {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  // 提前 5 分钟刷新
  const refreshTime = (expiresIn - 5 * 60) * 1000

  refreshTimer = setTimeout(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      const response = await client.post('/auth/refresh', {
        refreshToken
      })

      const { accessToken, expiresIn } = response.data
      localStorage.setItem('accessToken', accessToken)

      // 继续调度下次刷新
      scheduleTokenRefresh(expiresIn)
    } catch (error) {
      console.error('令牌刷新失败:', error)
      logout()
    }
  }, refreshTime)
}
```

## 相关链接

- [JWT 官方文档](https://jwt.io/)
- [OAuth 2.0 规范](https://oauth.net/2/)
- [@ldesign/http 文档](/README.md)

