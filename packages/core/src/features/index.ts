/**
 * @ldesign/http-features
 *
 * HTTP 高级特性库 - 缓存、重试、熔断、限流等
 */

// 请求去重
export * from './deduplication'

// 批量优化
export * from './batch'

// 进度追踪
export * from './ProgressTracker'

// 缓存功能
export * from './cache'

// 熔断器
export * from './circuit-breaker'

// GraphQL 支持
export * from './graphql'

// Mock 功能
export * from './mock'

// 请求录制器
export * from './recorder'

// 请求重放
export * from './request-replay'

// 响应验证器
export * from './response-validator'

// 重试功能
export * from './retry'

// Server-Sent Events
export * from './sse'

// WebSocket
export * from './websocket'
