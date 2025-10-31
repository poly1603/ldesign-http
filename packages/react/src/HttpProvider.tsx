import type { HttpClient, HttpClientConfig } from '@ldesign/http-core'
import { createHttpClient } from '@ldesign/http-core'
import React, { createContext, useContext, useMemo } from 'react'

const HttpContext = createContext<HttpClient | null>(null)

export interface HttpProviderProps {
  children: React.ReactNode
  config?: HttpClientConfig
  client?: HttpClient
}

/**
 * HTTP Provider组件
 */
export function HttpProvider({ children, config, client }: HttpProviderProps) {
  const httpClient = useMemo(() => {
    return client || createHttpClient(config)
  }, [client, config])

  return (
    <HttpContext.Provider value={httpClient}>
      {children}
    </HttpContext.Provider>
  )
}

/**
 * 获取HTTP客户端
 */
export function useHttpClient(): HttpClient | null {
  return useContext(HttpContext)
}
