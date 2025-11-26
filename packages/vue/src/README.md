# @ldesign/http-vue 源码目录结构

## 📁 目录说明

### 核心模块
- **index.ts** - 主入口文件，统一导出所有公共 API
- **index-lib.ts** - 库模式入口文件
- **constants/** - 常量定义（版本号等）
- **lib/** - 公共库文件（symbols、utilities 等）
- **types/** - TypeScript 类型定义

### 功能模块
- **composables/** - Vue 3 组合式 API（Composables）
- **components/** - Vue 3 组件
- **directives/** - Vue 3 指令
- **plugin/** - Vue 插件系统

## 📝 规范说明

### 文件组织原则
1. **单一入口**：src 目录下只保留 `index.ts` 作为主入口
2. **功能分组**：相关功能放在对应的子目录中
3. **类型集中**：所有类型定义统一放在 `types/` 目录
4. **常量独立**：常量定义（如版本号）放在 `constants/` 目录
5. **库文件独立**：公共库文件（如 symbols）放在 `lib/` 目录

### 目录详解

#### composables/
所有 Vue 3 Composables（组合式 API），包括：
- `useHttp.ts` - 依赖注入版本的 HTTP Hook
- `useHttpStandalone.ts` - 独立的 HTTP Hook
- `useRequest.ts` - 通用请求 Hook
- `useQuery.ts` - 查询 Hook
- `useMutation.ts` - 变更 Hook
- `usePagination.ts` - 分页 Hook
- `useInfiniteScroll.ts` - 无限滚动 Hook
- 等等...

#### components/
所有 Vue 3 组件，包括：
- `HttpProvider/` - 全局配置提供者
- `HttpLoader/` - 数据加载器
- `HttpError/` - 错误展示组件
- `HttpRetry/` - 重试控制器
- `HttpProgress/` - 进度条组件

#### plugin/
Vue 插件系统：
- `plugin.ts` - 插件实现
- `index.ts` - 插件导出

#### lib/
公共库文件：
- `symbols.ts` - Vue 依赖注入的 Symbol 键

#### constants/
常量定义：
- `version.ts` - 版本号

#### types/
类型定义：
- `index.ts` - 主类型定义
- `vue.ts` - Vue 专用类型
- `http.ts` - HTTP 相关类型

### 导入规范

```typescript
// ✅ 推荐：从主入口导入
import { useHttp, useQuery, HttpProvider } from '@ldesign/http-vue'

// ✅ 推荐：从子模块导入
import { useHttp } from '@ldesign/http-vue/composables'
import { HttpProvider } from '@ldesign/http-vue/components'

// ❌ 避免：直接导入内部文件
import { version } from '@ldesign/http-vue/src/constants/version'
import { HTTP_CLIENT_KEY } from '@ldesign/http-vue/src/symbols'
```

正确的导入方式：
```typescript
// ✅ 正确：使用公共 API
import { version, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
```

## 🔄 迁移指南

### 从旧结构迁移

如果你之前使用了以下导入：
```typescript
// 旧的导入方式
import { version } from '@ldesign/http-vue/version'
import { useHttp } from '@ldesign/http-vue/useHttp'
import { HTTP_CLIENT_KEY } from '@ldesign/http-vue/symbols'
```

请更新为：
```typescript
// 新的导入方式
import { version, useHttp, HTTP_CLIENT_KEY } from '@ldesign/http-vue'
```

### 文件移动说明

| 旧位置 | 新位置 | 说明 |
|--------|--------|------|
| `src/version.ts` | `src/constants/version.ts` | 版本号常量 |
| `src/symbols.ts` | `src/lib/symbols.ts` | 依赖注入符号 |
| `src/useHttp.ts` | `src/composables/useHttp.ts` | HTTP Composable |
| `src/plugin.ts` | `src/plugin/plugin.ts` | Vue 插件 |

## 📚 使用示例

### 基础使用
```typescript
import { createApp } from 'vue'
import { createHttpPlugin } from '@ldesign/http-vue'
import App from './App.vue'

const app = createApp(App)

app.use(createHttpPlugin({
  baseURL: 'https://api.example.com',
  timeout: 10000
}))

app.mount('#app')
```

### 在组件中使用
```vue
<script setup lang="ts">
import { useHttp } from '@ldesign/http-vue'

const { data, loading, error, execute } = useHttp('/api/users')

// 执行请求
execute()
</script>
```

## 📚 相关文档

- [API 文档](../README.md)
- [Composables 文档](./composables/README.md)
- [组件文档](./components/README.md)
- [类型定义](./types/README.md)