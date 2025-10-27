import type { HttpClientConfig } from './types'
import { createAdapter, createAdapterSync, preloadAdapters } from './adapters'
import { HttpClientImpl } from './client'

/**
 * 创建 HTTP 客户端实例（异步版本 - 推荐）
 *
 * 这是创建 HTTP 客户端的推荐方法，使用动态导入优化包体积。
 * 首次创建时会自动加载所需的适配器，后续调用会使用缓存的适配器。
 *
 * 优点：
 * - 🎯 **按需加载**：只加载实际使用的适配器，减少初始包体积
 * - ⚡ **自动选择**：如不指定适配器，会自动选择最适合当前环境的适配器
 * - 💾 **智能缓存**：已加载的适配器会被缓存，避免重复加载
 * - 🔧 **灵活配置**：支持丰富的配置选项，满足各种场景需求
 *
 * 适配器选择优先级（当未指定时）：
 * 1. Fetch（浏览器环境首选）
 * 2. Axios（Node.js 环境首选）
 * 3. Alova（作为备选）
 *
 * @param config - HTTP 客户端配置对象
 * @param config.baseURL - API 基础 URL
 * @param config.timeout - 请求超时时间（毫秒），默认 10000ms
 * @param config.headers - 默认请求头
 * @param config.adapter - 适配器名称或实例，可选值：'fetch' | 'axios' | 'alova' | 自定义适配器
 * @param config.cache - 缓存配置，包括是否启用、TTL等
 * @param config.retry - 重试配置，包括重试次数、延迟等
 * @param config.concurrency - 并发控制配置
 * @param config.monitor - 性能监控配置
 *
 * @returns Promise<HttpClientImpl> - HTTP 客户端实例的 Promise
 *
 * @throws {Error} 当无法找到可用的适配器时抛出错误
 *
 * @example 基础用法
 * ```typescript
 * // 最简单的方式：使用默认配置
 * const client = await createHttpClient()
 *
 * // 配置基础 URL
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com'
 * })
 *
 * // 完整配置
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 15000,
 *   headers: {
 *     'Authorization': 'Bearer token',
 *     'X-Custom-Header': 'value'
 *   }
 * })
 * ```
 *
 * @example 指定适配器
 * ```typescript
 * // 使用 Fetch 适配器
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   adapter: 'fetch'
 * })
 *
 * // 使用 Axios 适配器
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   adapter: 'axios'
 * })
 * ```
 *
 * @example 启用缓存和重试
 * ```typescript
 * const client = await createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   cache: {
 *     enabled: true,
 *     ttl: 5 * 60 * 1000 // 5分钟缓存
 *   },
 *   retry: {
 *     retries: 3,
 *     retryDelay: 1000
 *   }
 * })
 * ```
 *
 * @example 在 Vue 应用中使用
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue'
 * import { createHttpClient } from '@ldesign/http'
 *
 * const app = createApp(App)
 *
 * // 创建全局客户端实例
 * const httpClient = await createHttpClient({
 *   baseURL: import.meta.env.VITE_API_URL
 * })
 *
 * // 注入到 Vue 实例
 * app.provide('httpClient', httpClient)
 * app.mount('#app')
 * ```
 *
 * @see {@link createHttpClientSync} 同步创建方法（需要预加载）
 * @see {@link preloadAdapters} 预加载适配器以提升性能
 */
export async function createHttpClient(
  config: HttpClientConfig = {},
): Promise<HttpClientImpl> {
  // 动态加载适配器（如果未指定，会自动选择最合适的）
  const adapter = await createAdapter(config.adapter)

  // 创建并返回客户端实例
  return new HttpClientImpl(config, adapter)
}

/**
 * 创建 HTTP 客户端实例（同步版本）
 *
 * 同步版本的客户端创建方法，要求适配器已经被预加载。
 * 适用于对首屏加载时间要求严格的场景，可以在应用启动时预加载适配器。
 *
 * 使用场景：
 * - ✅ 应用启动时已预加载适配器
 * - ✅ 需要同步创建多个客户端实例
 * - ✅ 在非异步环境中创建客户端
 * - ❌ 首次创建客户端（推荐使用异步版本）
 *
 * 注意事项：
 * 1. 必须先调用 {@link preloadAdapters} 预加载适配器
 * 2. 如果适配器未预加载，会抛出错误
 * 3. 适用于已知需要使用的适配器类型的场景
 *
 * @param config - HTTP 客户端配置对象，参数同 {@link createHttpClient}
 *
 * @returns HttpClientImpl - HTTP 客户端实例（同步返回）
 *
 * @throws {Error} 当适配器未预加载时抛出错误
 *
 * @example 基础用法
 * ```typescript
 * // 第一步：在应用启动时预加载适配器
 * await preloadAdapters(['fetch'])
 *
 * // 第二步：后续可以同步创建客户端
 * const client = createHttpClientSync({
 *   baseURL: 'https://api.example.com'
 * })
 *
 * // 可以立即使用，无需 await
 * const response = await client.get('/users')
 * ```
 *
 * @example 在应用入口预加载
 * ```typescript
 * // main.ts
 * import { preloadAdapters, createHttpClientSync } from '@ldesign/http'
 *
 * // 应用启动时预加载
 * async function initApp() {
 *   // 预加载常用的适配器
 *   await preloadAdapters(['fetch', 'axios'])
 *
 *   // 初始化应用的其他部分...
 * }
 *
 * initApp().then(() => {
 *   // 后续可以同步创建客户端
 *   const client = createHttpClientSync({
 *     baseURL: 'https://api.example.com'
 *   })
 * })
 * ```
 *
 * @example 创建多个客户端实例
 * ```typescript
 * // 预加载一次
 * await preloadAdapters(['fetch'])
 *
 * // 同步创建多个客户端
 * const apiClient = createHttpClientSync({
 *   baseURL: 'https://api.example.com'
 * })
 *
 * const authClient = createHttpClientSync({
 *   baseURL: 'https://auth.example.com'
 * })
 *
 * const analyticsClient = createHttpClientSync({
 *   baseURL: 'https://analytics.example.com'
 * })
 * ```
 *
 * @example 错误处理
 * ```typescript
 * try {
 *   // 尝试同步创建（可能失败如果未预加载）
 *   const client = createHttpClientSync({
 *     baseURL: 'https://api.example.com'
 *   })
 * } catch (error) {
 *   console.error('适配器未预加载，请先调用 preloadAdapters()')
 *
 *   // 降级到异步方式
 *   const client = await createHttpClient({
 *     baseURL: 'https://api.example.com'
 *   })
 * }
 * ```
 *
 * @see {@link createHttpClient} 异步创建方法（推荐）
 * @see {@link preloadAdapters} 预加载适配器
 */
export function createHttpClientSync(
  config: HttpClientConfig = {},
): HttpClientImpl {
  // 同步获取适配器（必须已预加载，否则会抛出错误）
  const adapter = createAdapterSync(config.adapter)

  // 创建并返回客户端实例
  return new HttpClientImpl(config, adapter)
}

/**
 * 预加载 HTTP 适配器
 *
 * 在应用启动时预加载常用的适配器，可以显著提升后续创建客户端的速度。
 * 预加载的适配器会被缓存，避免重复加载和初始化。
 *
 * 使用场景：
 * - 🚀 **优化首屏性能**：在应用空闲时提前加载
 * - ⚡ **加速客户端创建**：避免动态导入的异步开销
 * - 📦 **减少运行时开销**：提前完成模块加载和初始化
 * - 🎯 **支持同步创建**：为 {@link createHttpClientSync} 做准备
 *
 * 推荐实践：
 * 1. 在应用启动时预加载最常用的适配器
 * 2. 根据环境选择性预加载（浏览器用 fetch，Node.js 用 axios）
 * 3. 使用 requestIdleCallback 在浏览器空闲时加载
 *
 * @param names - 要预加载的适配器名称数组，可选值：'fetch' | 'axios' | 'alova'
 *                如果不提供，默认预加载 ['fetch']
 *
 * @returns Promise<void> - 预加载完成的 Promise
 *
 * @example 基础用法
 * ```typescript
 * // 在应用入口预加载
 * await preloadAdapters(['fetch', 'axios'])
 * ```
 *
 * @example 在 Vue 应用中使用
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue'
 * import { preloadAdapters } from '@ldesign/http'
 * import App from './App.vue'
 *
 * async function initApp() {
 *   // 1. 预加载适配器
 *   await preloadAdapters(['fetch'])
 *
 *   // 2. 创建 Vue 应用
 *   const app = createApp(App)
 *
 *   // 3. 挂载应用
 *   app.mount('#app')
 * }
 *
 * initApp()
 * ```
 *
 * @example 根据环境选择性预加载
 * ```typescript
 * // 根据运行环境选择适配器
 * const adapters = typeof window !== 'undefined'
 *   ? ['fetch']         // 浏览器环境
 *   : ['axios']         // Node.js 环境
 *
 * await preloadAdapters(adapters)
 * ```
 *
 * @example 在浏览器空闲时预加载
 * ```typescript
 * if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
 *   // 在浏览器空闲时预加载，不影响首屏性能
 *   window.requestIdleCallback(() => {
 *     preloadAdapters(['fetch', 'axios'])
 *   })
 * } else {
 *   // 降级方案：延迟预加载
 *   setTimeout(() => {
 *     preloadAdapters(['fetch', 'axios'])
 *   }, 1000)
 * }
 * ```
 *
 * @example 错误处理
 * ```typescript
 * try {
 *   await preloadAdapters(['fetch', 'axios', 'alova'])
 * } catch (error) {
 *   console.warn('部分适配器预加载失败:', error)
 *   // 预加载失败不影响功能，会在实际使用时再加载
 * }
 * ```
 *
 * @see {@link createHttpClientSync} 使用预加载的适配器同步创建客户端
 */
export { preloadAdapters }
