# @ldesign/http-nextjs

Next.js HTTP请求库

## 安装

```bash
pnpm add @ldesign/http-nextjs
```

## 使用

```typescript
import { createHttpClient } from '@ldesign/http-nextjs'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
})

const response = await http.get('/users')
console.log(response.data)
```

## License

MIT
