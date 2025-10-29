# @ldesign/http-adapters

> HTTP 适配器库 - 提供多种 HTTP 客户端适配器

## 特性

- ✅ **Fetch 适配器** - 基于原生 Fetch API
- ✅ **Axios 适配器** - 集成 Axios 库
- ✅ **Alova 适配器** - 集成 Alova 库
- ✅ **统一接口** - 所有适配器使用统一的接口
- ✅ **自动检测** - 自动检测环境支持情况

## 安装

```bash
pnpm add @ldesign/http-adapters
```

## 使用

### Fetch 适配器

```typescript
import { FetchAdapter } from '@ldesign/http-adapters/fetch'
import { createHttpClient } from '@ldesign/http-core'

const adapter = new FetchAdapter()
const client = createHttpClient({ baseURL: 'https://api.example.com' }, adapter)

const response = await client.get('/users')
```

### Axios 适配器

```typescript
import { AxiosAdapter } from '@ldesign/http-adapters/axios'
import { createHttpClient } from '@ldesign/http-core'

const adapter = new AxiosAdapter()
const client = createHttpClient({ baseURL: 'https://api.example.com' }, adapter)

const response = await client.get('/users')
```

### Alova 适配器

```typescript
import { AlovaAdapter } from '@ldesign/http-adapters/alova'
import { createHttpClient } from '@ldesign/http-core'

const adapter = new AlovaAdapter()
const client = createHttpClient({ baseURL: 'https://api.example.com' }, adapter)

const response = await client.get('/users')
```

## License

MIT © ldesign


