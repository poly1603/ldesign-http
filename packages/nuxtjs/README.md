# @ldesign/http-nuxtjs

Nuxt HTTP请求库

## 安装

```bash
pnpm add @ldesign/http-nuxtjs
```

## 使用

```typescript
import { createHttpClient } from '@ldesign/http-nuxtjs'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
})

const response = await http.get('/users')
console.log(response.data)
```

## License

MIT
