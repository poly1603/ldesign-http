# @ldesign/http-solid

Solid HTTP请求库

## 安装

```bash
pnpm add @ldesign/http-solid
```

## 使用

```typescript
import { createHttpClient } from '@ldesign/http-solid'

const http = createHttpClient({
  baseURL: 'https://api.example.com',
})

const response = await http.get('/users')
console.log(response.data)
```

## License

MIT
