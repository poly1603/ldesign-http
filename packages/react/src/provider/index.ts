/**
 * React HTTP Provider
 */

import React, { createContext, useContext, type ReactNode } from 'react'
import type { HttpClient, HttpClientConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

/**
 * HTTP 客户端上下文
 */
const HttpClientContext = createContext<HttpClient | null>(null)

/**
 * Provider 属性
 */
export interface HttpProviderProps {
  /** 子组件 */
  children: ReactNode
  /** 客户端配置 */
  config?: HttpClientConfig
  /** 自定义客户端实例 */
  client?: HttpClient
}

/**
 * HTTP Provider 组件
 * 
 * @example
 * ```tsx
 * import { HttpProvider } from '@ldesign/http-react'
 * 
 * function App() {
 *   return (
 *     <HttpProvider config={{ baseURL: 'https://api.example.com' }}>
 *       <UserList />
 *     </HttpProvider>
 *   )
 * }
 * ```
 */
export function HttpProvider({ children, config, client }: HttpProviderProps) {
  const httpClient = React.useMemo(() => {
    if (client) {
      return client
    }
    return createHttpClient(config || {}, new FetchAdapter())
  }, [config, client])

  return React.createElement(
    HttpClientContext.Provider,
    { value: httpClient },
    children,
  )
}

/**
 * 使用 HTTP 客户端
 * 
 * @returns HTTP 客户端实例
 * 
 * @example
 * ```tsx
 * import { useHttpClient } from '@ldesign/http-react'
 * 
 * function UserList() {
 *   const client = useHttpClient()
 *   // 使用 client...
 * }
 * ```
 */
export function useHttpClient(): HttpClient {
  const client = useContext(HttpClientContext)
  if (!client) {
    throw new Error('useHttpClient must be used within HttpProvider')
  }
  return client
}
