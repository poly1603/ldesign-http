# 认证示例

本页面展示了使用 @ldesign/http 处理各种认证方式的示例。

## 🔐 Bearer Token 认证

### 基础 Token 认证

```typescript
import { createHttpClient } from '@ldesign/http'

const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 方式1: 在请求中添加认证头
const getProtectedData = async (token: string) => {
  const response = await client.get('/protected', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.data
}

// 方式2: 设置默认认证头
const setAuthToken = (token: string) => {
  client.setDefaults({
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}

// 使用示例
const token = 'your-jwt-token-here'
setAuthToken(token)

// 现在所有请求都会自动包含认证头
const userData = await client.get('/user/profile')
const posts = await client.get('/user/posts')
```

### 自动 Token 管理

```typescript
class AuthManager {
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })
  
  private token: string | null = null
  private refreshToken: string | null = null
  
  constructor() {
    this.setupInterceptors()
    this.loadTokenFromStorage()
  }
  
  private setupInterceptors() {
    // 请求拦截器：自动添加认证头
    this.client.addRequestInterceptor({
      onFulfilled: (config) => {
        if (this.token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${this.token}`
          }
        }
        return config
      }
    })
    
    // 响应拦截器：处理认证错误
    this.client.addResponseInterceptor({
      onRejected: async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            // 尝试刷新token
            await this.refreshAccessToken()
            
            // 重新发送原始请求
            const originalRequest = error.config
            originalRequest.headers['Authorization'] = `Bearer ${this.token}`
            return this.client.request(originalRequest)
          } catch (refreshError) {
            // 刷新失败，清除认证信息
            this.logout()
            throw refreshError
          }
        }
        
        return Promise.reject(error)
      }
    })
  }
  
  async login(username: string, password: string) {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password
      })
      
      const { accessToken, refreshToken, user } = response.data
      
      this.token = accessToken
      this.refreshToken = refreshToken
      
      // 保存到本地存储
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      
      return { user, accessToken }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }
  
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await this.client.post('/auth/refresh', {
      refreshToken: this.refreshToken
    })
    
    const { accessToken } = response.data
    this.token = accessToken
    localStorage.setItem('accessToken', accessToken)
    
    return accessToken
  }
  
  logout() {
    this.token = null
    this.refreshToken = null
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    
    // 跳转到登录页
    window.location.href = '/login'
  }
  
  private loadTokenFromStorage() {
    this.token = localStorage.getItem('accessToken')
    this.refreshToken = localStorage.getItem('refreshToken')
  }
  
  isAuthenticated(): boolean {
    return !!this.token
  }
  
  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}

// 使用示例
const authManager = new AuthManager()

// 登录
try {
  const { user } = await authManager.login('john@example.com', 'password123')
  console.log('登录成功:', user)
} catch (error) {
  console.error('登录失败:', error.message)
}

// 检查认证状态
if (authManager.isAuthenticated()) {
  console.log('用户已登录:', authManager.getUser())
} else {
  console.log('用户未登录')
}
```

## 🔑 API Key 认证

### Header 方式

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})

// 或者动态设置
const setApiKey = (apiKey: string) => {
  client.setDefaults({
    headers: {
      'X-API-Key': apiKey
    }
  })
}
```

### 查询参数方式

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

const apiCall = async (endpoint: string, params: any = {}) => {
  return client.get(endpoint, {
    params: {
      ...params,
      api_key: 'your-api-key-here'
    }
  })
}

// 使用示例
const weatherData = await apiCall('/weather', {
  city: 'Beijing',
  units: 'metric'
})
```

## 🍪 Cookie 认证

### 基础 Cookie 认证

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  withCredentials: true // 自动发送cookies
})

// 登录获取session cookie
const login = async (username: string, password: string) => {
  const response = await client.post('/auth/login', {
    username,
    password
  })
  
  // 服务器会设置session cookie
  return response.data
}

// 后续请求会自动包含cookie
const getProfile = async () => {
  const response = await client.get('/user/profile')
  return response.data
}
```

### 手动 Cookie 管理

```typescript
class CookieAuth {
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })
  
  private sessionCookie: string | null = null
  
  constructor() {
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    this.client.addRequestInterceptor({
      onFulfilled: (config) => {
        if (this.sessionCookie) {
          config.headers = {
            ...config.headers,
            'Cookie': this.sessionCookie
          }
        }
        return config
      }
    })
    
    this.client.addResponseInterceptor({
      onFulfilled: (response) => {
        // 提取Set-Cookie头
        const setCookie = response.headers['set-cookie']
        if (setCookie) {
          this.sessionCookie = setCookie
        }
        return response
      }
    })
  }
  
  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', {
      username,
      password
    })
    
    return response.data
  }
  
  logout() {
    this.sessionCookie = null
    this.client.post('/auth/logout')
  }
}
```

## 🔐 OAuth 2.0 认证

### 授权码流程

```typescript
class OAuth2Client {
  private client = createHttpClient({
    baseURL: 'https://api.example.com'
  })
  
  private clientId = 'your-client-id'
  private clientSecret = 'your-client-secret'
  private redirectUri = 'http://localhost:3000/callback'
  
  // 步骤1: 获取授权URL
  getAuthorizationUrl(scopes: string[] = ['read', 'write']): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      state: this.generateState()
    })
    
    return `https://auth.example.com/oauth/authorize?${params.toString()}`
  }
  
  // 步骤2: 交换授权码获取访问令牌
  async exchangeCodeForToken(code: string, state: string): Promise<any> {
    // 验证state参数
    if (!this.validateState(state)) {
      throw new Error('Invalid state parameter')
    }
    
    const response = await this.client.post('/oauth/token', {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      redirect_uri: this.redirectUri
    })
    
    const { access_token, refresh_token, expires_in } = response.data
    
    // 保存令牌
    this.saveTokens(access_token, refresh_token, expires_in)
    
    return response.data
  }
  
  // 步骤3: 使用访问令牌调用API
  async callApi(endpoint: string, options: any = {}) {
    const accessToken = this.getAccessToken()
    
    if (!accessToken) {
      throw new Error('No access token available')
    }
    
    return this.client.request({
      ...options,
      url: endpoint,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    })
  }
  
  // 刷新访问令牌
  async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await this.client.post('/oauth/token', {
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    })
    
    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data
    
    this.saveTokens(access_token, newRefreshToken, expires_in)
    
    return access_token
  }
  
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15)
    sessionStorage.setItem('oauth_state', state)
    return state
  }
  
  private validateState(state: string): boolean {
    const savedState = sessionStorage.getItem('oauth_state')
    sessionStorage.removeItem('oauth_state')
    return savedState === state
  }
  
  private saveTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    const expiresAt = Date.now() + (expiresIn * 1000)
    
    localStorage.setItem('oauth_access_token', accessToken)
    localStorage.setItem('oauth_refresh_token', refreshToken)
    localStorage.setItem('oauth_expires_at', expiresAt.toString())
  }
  
  private getAccessToken(): string | null {
    const token = localStorage.getItem('oauth_access_token')
    const expiresAt = localStorage.getItem('oauth_expires_at')
    
    if (!token || !expiresAt) return null
    
    // 检查是否过期
    if (Date.now() >= parseInt(expiresAt)) {
      return null
    }
    
    return token
  }
  
  private getRefreshToken(): string | null {
    return localStorage.getItem('oauth_refresh_token')
  }
}

// 使用示例
const oauth = new OAuth2Client()

// 1. 重定向到授权页面
const authUrl = oauth.getAuthorizationUrl(['read', 'write', 'admin'])
window.location.href = authUrl

// 2. 在回调页面处理授权码
const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get('code')
const state = urlParams.get('state')

if (code && state) {
  try {
    await oauth.exchangeCodeForToken(code, state)
    console.log('OAuth认证成功')
  } catch (error) {
    console.error('OAuth认证失败:', error)
  }
}

// 3. 调用受保护的API
try {
  const userData = await oauth.callApi('/user/profile')
  console.log('用户数据:', userData.data)
} catch (error) {
  console.error('API调用失败:', error)
}
```

## 🔒 基础认证 (Basic Auth)

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com'
})

// 方式1: 手动编码
const basicAuth = (username: string, password: string) => {
  const credentials = btoa(`${username}:${password}`)
  return `Basic ${credentials}`
}

const response = await client.get('/protected', {
  headers: {
    'Authorization': basicAuth('john', 'password123')
  }
})

// 方式2: 使用内置支持
const response2 = await client.get('/protected', {
  auth: {
    username: 'john',
    password: 'password123'
  }
})
```

## 🎨 Vue 认证组件

### 登录组件

```vue
<template>
  <div class="auth-container">
    <form @submit.prevent="handleLogin" class="login-form">
      <h2>用户登录</h2>
      
      <div class="form-group">
        <label>邮箱:</label>
        <input 
          v-model="form.email" 
          type="email" 
          required 
          class="form-input"
        />
      </div>
      
      <div class="form-group">
        <label>密码:</label>
        <input 
          v-model="form.password" 
          type="password" 
          required 
          class="form-input"
        />
      </div>
      
      <button type="submit" :disabled="loading" class="login-btn">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await login(form.email, form.password)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f7fafc;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 16px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-btn:disabled {
  background: #a0aec0;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background: #fed7d7;
  color: #742a2a;
  border-radius: 4px;
  text-align: center;
}
</style>
```

### 认证组合式函数

```typescript
// composables/useAuth.ts
import { ref, computed } from 'vue'
import { useHttp } from '@ldesign/http'

const user = ref(null)
const token = ref(localStorage.getItem('token'))

export function useAuth() {
  const http = useHttp()
  
  const isAuthenticated = computed(() => !!token.value)
  
  const login = async (email: string, password: string) => {
    const response = await http.post('/auth/login', {
      email,
      password
    })
    
    const { user: userData, token: authToken } = response.data
    
    user.value = userData
    token.value = authToken
    
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // 设置默认认证头
    http.setDefaults({
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    return userData
  }
  
  const logout = () => {
    user.value = null
    token.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除认证头
    http.setDefaults({
      headers: {
        'Authorization': undefined
      }
    })
  }
  
  const getCurrentUser = async () => {
    if (!token.value) return null
    
    try {
      const response = await http.get('/auth/me')
      user.value = response.data
      return response.data
    } catch (error) {
      // token可能已过期
      logout()
      throw error
    }
  }
  
  // 初始化时恢复用户状态
  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      user.value = JSON.parse(savedUser)
      
      // 设置认证头
      http.setDefaults({
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
    }
  }
  
  return {
    user: computed(() => user.value),
    token: computed(() => token.value),
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
    initAuth
  }
}
```

## 📚 最佳实践

### 1. 安全存储

```typescript
// ✅ 使用安全的存储方式
class SecureTokenStorage {
  private static readonly ACCESS_TOKEN_KEY = 'access_token'
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token'
  
  static setTokens(accessToken: string, refreshToken: string) {
    // 访问令牌存储在内存中（更安全）
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    
    // 刷新令牌可以存储在localStorage中
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
  }
  
  static getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY)
  }
  
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }
  
  static clearTokens() {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
  }
}
```

### 2. 错误处理

```typescript
// ✅ 完善的认证错误处理
const handleAuthError = (error: any) => {
  switch (error.status) {
    case 401:
      // 未授权 - 清除token并跳转登录
      authManager.logout()
      break
    case 403:
      // 权限不足
      showMessage('权限不足，无法访问该资源', 'error')
      break
    case 429:
      // 请求过于频繁
      showMessage('请求过于频繁，请稍后重试', 'warning')
      break
    default:
      showMessage('认证失败，请重新登录', 'error')
  }
}
```

### 3. 令牌刷新

```typescript
// ✅ 智能令牌刷新
class TokenManager {
  private refreshPromise: Promise<string> | null = null
  
  async getValidToken(): Promise<string> {
    const token = this.getAccessToken()
    
    if (!token || this.isTokenExpired(token)) {
      // 如果已经有刷新请求在进行中，等待它完成
      if (this.refreshPromise) {
        return this.refreshPromise
      }
      
      // 开始新的刷新请求
      this.refreshPromise = this.refreshAccessToken()
      
      try {
        const newToken = await this.refreshPromise
        return newToken
      } finally {
        this.refreshPromise = null
      }
    }
    
    return token
  }
  
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }
}
```

## 📚 下一步

了解认证示例后，你可以继续学习：

- [错误处理](/guide/error-handling) - 认证错误处理
- [拦截器](/guide/interceptors) - 认证拦截器
- [Vue集成](/vue/) - Vue认证组件
- [安全最佳实践](/guide/security) - 安全相关最佳实践
