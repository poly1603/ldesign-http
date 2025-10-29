/**
 * Solid HTTP Provider
 */

import { createContext, useContext, type JSX } from 'solid-js'
import type { HttpClient, HttpClientConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import { FetchAdapter } from '@ldesign/http-core/adapters'

/**
 * HTTP 客户端上下文
 */
const HttpClientContext = createContext<HttpClient>()

/**
 * Provider 属性
 */
export interface HttpProviderProps {
  /** 子组件 */
  children: JSX.Element
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
 * import { HttpProvider } from '@ldesign/http-solid'
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
export function HttpProvider(props: HttpProviderProps) {
  const httpClient = props.client || createHttpClient(
    props.config || {},
    new FetchAdapter(),
  )

  return (
    <HttpClientContext.Provider value= { httpClient } >
    { props.children }
    </HttpClientContext.Provider>
  )
}

/**
 * 使用 HTTP 客户端
 * 
 * @returns HTTP 客户端实例
 */
export function useHttpClient(): HttpClient {
  const client = useContext(HttpClientContext)
  if (!client) {
    throw new Error('useHttpClient must be used within HttpProvider')
  }
  return client
}
