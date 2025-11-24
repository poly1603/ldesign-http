/**
 * @ldesign/http
 * 
 * HTTP 请求库 - Monorepo 主入口
 * 
 * 这个包是一个 monorepo 包装器，重新导出 core 和 vue 子包的功能
 * 
 * @module @ldesign/http
 * @version 0.1.0
 * @author ldesign
 * @license MIT
 */

// ==================== 核心功能 (重新导出 Core) ====================

/**
 * 重新导出所有 Core 功能
 * 包括：HTTP 客户端、适配器、拦截器、缓存、重试等
 */
export * from '@ldesign/http-core'

// ==================== Vue 集成 (重新导出 Vue) ====================

/**
 * 重新导出所有 Vue 功能
 * 包括：组合式 API、插件、指令等
 */
export * from '@ldesign/http-vue'

// ==================== 默认导出 ====================

/**
 * 默认导出 createHttpClient 工厂函数
 */
export { createHttpClient as default } from '@ldesign/http-core'

