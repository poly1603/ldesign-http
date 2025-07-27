# 真实API示例

本页面展示如何使用 @ldesign/http 与真实的公开API进行交互。所有示例都使用真实可用的API服务。

## JSONPlaceholder API

[JSONPlaceholder](https://jsonplaceholder.typicode.com/) 是一个免费的在线REST API，非常适合测试和原型开发。

### 基础CRUD操作

```typescript
import { createHttpClient } from '@ldesign/http'

const api = createHttpClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000
})

// 获取所有用户
async function getAllUsers() {
  try {
    const response = await api.get('/users')
    console.log('用户列表:', response.data)
    return response.data
  }
 catch (error) {
    console.error('获取用户失败:', error.message)
  }
}

// 获取单个用户
async function getUser(id: number) {
  try {
    const response = await api.get(`/users/${id}`)
    console.log('用户信息:', response.data)
    return response.data
  }
 catch (error) {
    console.error('获取用户失败:', error.message)
  }
}

// 创建用户
async function createUser(userData: any) {
  try {
    const response = await api.post('/users', userData)
    console.log('创建成功:', response.data)
    return response.data
  }
 catch (error) {
    console.error('创建用户失败:', error.message)
  }
}

// 更新用户
async function updateUser(id: number, userData: any) {
  try {
    const response = await api.put(`/users/${id}`, userData)
    console.log('更新成功:', response.data)
    return response.data
  }
 catch (error) {
    console.error('更新用户失败:', error.message)
  }
}

// 删除用户
async function deleteUser(id: number) {
  try {
    await api.delete(`/users/${id}`)
    console.log('删除成功')
  }
 catch (error) {
    console.error('删除用户失败:', error.message)
  }
}
```

### Vue3组合式函数示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useGet } from '@ldesign/http'

// 类型定义
interface User {
  id: number
  name: string
  email: string
  phone: string
  website: string
  company: {
    name: string
    catchPhrase: string
  }
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
  }
}

interface Post {
  id: number
  userId: number
  title: string
  body: string
}

// 状态
const selectedUserId = ref<number | null>(null)

// 获取用户列表
const {
  data: users,
  loading: usersLoading,
  error: usersError,
  refresh: refreshUsers
} = useGet<User[]>('https://jsonplaceholder.typicode.com/users')

// 获取用户详情
const {
  data: userDetail,
  loading: userLoading,
  error: userError
} = useGet<User>(() =>
  selectedUserId.value
    ? `https://jsonplaceholder.typicode.com/users/${selectedUserId.value}`
    : null
)

// 获取用户文章
const {
  data: userPosts,
  loading: postsLoading,
  error: postsError
} = useGet<Post[]>(() =>
  selectedUserId.value
    ? `https://jsonplaceholder.typicode.com/posts?userId=${selectedUserId.value}`
    : null
)

// 选择用户
function selectUser(userId: number) {
  selectedUserId.value = userId
}
</script>

<template>
  <div class="api-demo">
    <h1>JSONPlaceholder API 演示</h1>

    <!-- 用户列表 -->
    <section>
      <h2>用户列表</h2>
      <div v-if="usersLoading">
        🔄 加载中...
      </div>
      <div v-else-if="usersError" class="error">
        ❌ {{ usersError.message }}
        <button @click="refreshUsers">
          重试
        </button>
      </div>
      <div v-else>
        <div class="user-grid">
          <div v-for="user in users" :key="user.id" class="user-card">
            <h3>{{ user.name }}</h3>
            <p>📧 {{ user.email }}</p>
            <p>🏢 {{ user.company.name }}</p>
            <p>🌐 {{ user.website }}</p>
            <button @click="selectUser(user.id)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 用户详情 -->
    <section v-if="selectedUserId">
      <h2>用户详情</h2>
      <div v-if="userLoading">
        🔄 加载用户详情...
      </div>
      <div v-else-if="userError" class="error">
        ❌ {{ userError.message }}
      </div>
      <div v-else-if="userDetail" class="user-detail">
        <h3>{{ userDetail.name }}</h3>
        <div class="detail-grid">
          <div>
            <h4>联系信息</h4>
            <p>📧 {{ userDetail.email }}</p>
            <p>📱 {{ userDetail.phone }}</p>
            <p>🌐 {{ userDetail.website }}</p>
          </div>
          <div>
            <h4>地址</h4>
            <p>🏠 {{ userDetail.address.street }}, {{ userDetail.address.suite }}</p>
            <p>🏙️ {{ userDetail.address.city }}</p>
            <p>📮 {{ userDetail.address.zipcode }}</p>
          </div>
          <div>
            <h4>公司</h4>
            <p>🏢 {{ userDetail.company.name }}</p>
            <p>💼 {{ userDetail.company.catchPhrase }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 用户文章 -->
    <section v-if="selectedUserId">
      <h2>用户文章</h2>
      <div v-if="postsLoading">
        🔄 加载文章...
      </div>
      <div v-else-if="postsError" class="error">
        ❌ {{ postsError.message }}
      </div>
      <div v-else>
        <div class="posts-list">
          <article v-for="post in userPosts" :key="post.id" class="post-card">
            <h4>{{ post.title }}</h4>
            <p>{{ post.body }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.api-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.user-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  background: #f7fafc;
}

.user-card h3 {
  margin: 0 0 10px 0;
  color: #2d3748;
}

.user-card p {
  margin: 5px 0;
  color: #4a5568;
}

.user-card button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.user-detail {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.detail-grid h4 {
  margin: 0 0 10px 0;
  color: #2d3748;
  border-bottom: 2px solid #4299e1;
  padding-bottom: 5px;
}

.posts-list {
  display: grid;
  gap: 15px;
  margin: 20px 0;
}

.post-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  background: #f7fafc;
}

.post-card h4 {
  margin: 0 0 10px 0;
  color: #2d3748;
}

.error {
  color: #e53e3e;
  padding: 10px;
  background: #fed7d7;
  border: 1px solid #feb2b2;
  border-radius: 4px;
  margin: 10px 0;
}

.error button {
  margin-left: 10px;
  padding: 5px 10px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

## GitHub API

GitHub提供了丰富的REST API，可以获取用户、仓库等信息。

```typescript
import { createHttpClient } from '@ldesign/http'

const github = createHttpClient({
  baseURL: 'https://api.github.com',
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ldesign-http-demo'
  }
})

// 获取用户信息
async function getGitHubUser(username: string) {
  try {
    const response = await github.get(`/users/${username}`)
    return response.data
  }
 catch (error) {
    console.error('获取GitHub用户失败:', error.message)
  }
}

// 获取用户仓库
async function getUserRepos(username: string) {
  try {
    const response = await github.get(`/users/${username}/repos`, {
      params: {
        sort: 'updated',
        per_page: 10
      }
    })
    return response.data
  }
 catch (error) {
    console.error('获取仓库失败:', error.message)
  }
}

// 搜索仓库
async function searchRepos(query: string) {
  try {
    const response = await github.get('/search/repositories', {
      params: {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: 10
      }
    })
    return response.data.items
  }
 catch (error) {
    console.error('搜索仓库失败:', error.message)
  }
}

// 使用示例
async function githubDemo() {
  // 获取用户信息
  const user = await getGitHubUser('octocat')
  console.log('GitHub用户:', user?.login, user?.name)

  // 获取用户仓库
  const repos = await getUserRepos('octocat')
  console.log('仓库数量:', repos?.length)

  // 搜索Vue相关仓库
  const vueRepos = await searchRepos('vue language:javascript')
  console.log('Vue仓库:', vueRepos?.map(repo => repo.name))
}
```

## 天气API (OpenWeatherMap)

使用 [OpenWeatherMap API](https://openweathermap.org/api) 获取天气信息。

```typescript
import { createHttpClient } from '@ldesign/http'

const weather = createHttpClient({
  baseURL: 'https://api.openweathermap.org/data/2.5'
})

// 获取当前天气
async function getCurrentWeather(city: string, apiKey: string) {
  try {
    const response = await weather.get('/weather', {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric',
        lang: 'zh_cn'
      }
    })
    return response.data
  }
 catch (error) {
    console.error('获取天气失败:', error.message)
  }
}

// 获取5天天气预报
async function getWeatherForecast(city: string, apiKey: string) {
  try {
    const response = await weather.get('/forecast', {
      params: {
        q: city,
        appid: apiKey,
        units: 'metric',
        lang: 'zh_cn'
      }
    })
    return response.data
  }
 catch (error) {
    console.error('获取天气预报失败:', error.message)
  }
}

// Vue3天气组件示例
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from '@ldesign/http'

const cityName = ref('Beijing')
const apiKey = 'your-openweather-api-key' // 需要注册获取

const {
  data: weatherData,
  loading,
  error,
  execute: fetchWeather
} = useRequest(null, {
  immediate: false
})

function searchWeather() {
  if (!cityName.value.trim())
return

  fetchWeather({
    url: 'https://api.openweathermap.org/data/2.5/weather',
    params: {
      q: cityName.value,
      appid: apiKey,
      units: 'metric',
      lang: 'zh_cn'
    }
  })
}
</script>

<template>
  <div class="weather-app">
    <h1>🌤️ 天气查询</h1>

    <div class="search-box">
      <input
        v-model="cityName"
        placeholder="输入城市名称"
        @keyup.enter="searchWeather"
      >
      <button :disabled="loading" @click="searchWeather">
        {{ loading ? '查询中...' : '查询天气' }}
      </button>
    </div>

    <div v-if="error" class="error">
      ❌ {{ error.message }}
    </div>

    <div v-if="weatherData" class="weather-info">
      <h2>{{ weatherData.name }}, {{ weatherData.sys.country }}</h2>
      <div class="current-weather">
        <div class="temperature">
          {{ Math.round(weatherData.main.temp) }}°C
        </div>
        <div class="description">
          {{ weatherData.weather[0].description }}
        </div>
        <div class="details">
          <p>🌡️ 体感温度: {{ Math.round(weatherData.main.feels_like) }}°C</p>
          <p>💧 湿度: {{ weatherData.main.humidity }}%</p>
          <p>💨 风速: {{ weatherData.wind.speed }} m/s</p>
          <p>👁️ 能见度: {{ weatherData.visibility / 1000 }} km</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-box button {
  padding: 10px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.weather-info {
  background: linear-gradient(135deg, #74b9ff, #0984e3);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
}

.current-weather {
  text-align: center;
}

.temperature {
  font-size: 3em;
  font-weight: bold;
  margin: 10px 0;
}

.description {
  font-size: 1.2em;
  margin: 10px 0;
  text-transform: capitalize;
}

.details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.details p {
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 6px;
}
</style>
```

## 新闻API (NewsAPI)

使用 [NewsAPI](https://newsapi.org/) 获取最新新闻。

```typescript
import { createHttpClient } from '@ldesign/http'

const news = createHttpClient({
  baseURL: 'https://newsapi.org/v2'
})

// 获取头条新闻
async function getTopHeadlines(apiKey: string, country = 'cn') {
  try {
    const response = await news.get('/top-headlines', {
      params: {
        country,
        apiKey
      }
    })
    return response.data.articles
  }
 catch (error) {
    console.error('获取新闻失败:', error.message)
  }
}

// 搜索新闻
async function searchNews(query: string, apiKey: string) {
  try {
    const response = await news.get('/everything', {
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'zh',
        apiKey
      }
    })
    return response.data.articles
  }
 catch (error) {
    console.error('搜索新闻失败:', error.message)
  }
}
```

## 随机用户API (Random User)

使用 [Random User Generator](https://randomuser.me/) 生成随机用户数据。

```typescript
import { createHttpClient } from '@ldesign/http'

const randomUser = createHttpClient({
  baseURL: 'https://randomuser.me/api'
})

// 生成随机用户
async function generateRandomUsers(count = 10) {
  try {
    const response = await randomUser.get('/', {
      params: {
        results: count,
        nat: 'us,gb,ca',
        inc: 'name,email,phone,picture,location'
      }
    })
    return response.data.results
  }
 catch (error) {
    console.error('生成随机用户失败:', error.message)
  }
}

// Vue3随机用户组件
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRequest } from '@ldesign/http'

const userCount = ref(10)

const {
  data: users,
  loading,
  error,
  execute: fetchUsers
} = useRequest(null, {
  immediate: false,
  onSuccess: (data) => {
    console.log('生成了', data.results.length, '个用户')
  }
})

function generateUsers() {
  fetchUsers({
    url: 'https://randomuser.me/api',
    params: {
      results: userCount.value,
      nat: 'us,gb,ca',
      inc: 'name,email,phone,picture,location'
    }
  })
}

// 初始加载
generateUsers()
</script>

<template>
  <div class="random-users">
    <h1>👥 随机用户生成器</h1>

    <div class="controls">
      <label>
        用户数量:
        <input v-model.number="userCount" type="number" min="1" max="50">
      </label>
      <button :disabled="loading" @click="generateUsers">
        {{ loading ? '生成中...' : '生成用户' }}
      </button>
    </div>

    <div v-if="error" class="error">
      ❌ {{ error.message }}
    </div>

    <div v-if="users" class="users-grid">
      <div v-for="user in users" :key="user.email" class="user-card">
        <img :src="user.picture.medium" :alt="user.name.first">
        <h3>{{ user.name.first }} {{ user.name.last }}</h3>
        <p>📧 {{ user.email }}</p>
        <p>📱 {{ user.phone }}</p>
        <p>📍 {{ user.location.city }}, {{ user.location.country }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.random-users {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.controls input {
  width: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.controls button {
  padding: 10px 20px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.user-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: #f7fafc;
}

.user-card img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.user-card h3 {
  margin: 10px 0;
  color: #2d3748;
}

.user-card p {
  margin: 5px 0;
  color: #4a5568;
  font-size: 0.9em;
}
</style>
```

## 总结

这些真实API示例展示了 @ldesign/http 在实际项目中的应用：

1. **JSONPlaceholder** - 适合学习和原型开发
2. **GitHub API** - 获取开源项目信息
3. **OpenWeatherMap** - 天气应用开发
4. **NewsAPI** - 新闻聚合应用
5. **Random User** - 测试数据生成

所有示例都可以直接运行，帮助你快速上手 @ldesign/http 的各种功能。
```
