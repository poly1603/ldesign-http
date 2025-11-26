/**
 * HTTP 客户端工厂（旧版本 - 已废弃）
 *
 * ⚠️ 此文件已废弃，请使用 `client/factory.ts` 中的新版本
 *
 * @deprecated 请使用 `import { createHttpClient } from '@ldesign/http-core'` 或 `import { createHttpClient } from '@ldesign/http-core/client'`
 */

// 重新导出新版本的函数，确保所有导入都使用新版本
export {
  createHttpClient,
  createHttpClientSync,
  preloadAdapters,
} from '../client/factory'


