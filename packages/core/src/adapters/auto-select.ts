/**
 * 自动适配器选择
 * 
 * 根据环境和可用性自动选择最佳HTTP适配器
 */

import { createAdapter, isAdapterAvailable } from './factory'

// 使用BaseAdapter作为类型
type HttpAdapter = {
  name: string
  request: <T = unknown>(config: any) => Promise<any>
  isSupported: () => boolean
}

/**
 * 自动选择最佳适配器
 * 
 * 优先级: Fetch > Axios > Alova
 * 
 * @returns Promise<HttpAdapter> - 最佳可用的适配器
 * @throws {Error} 如果没有可用的适配器
 * 
 * @example
 * ```typescript
 * const adapter = await createBestAdapter()
 * const client = new HttpClientImpl(config, adapter)
 * ```
 */
export async function createBestAdapter(): Promise<HttpAdapter> {
  // 1. 优先使用 Fetch (最轻量,现代浏览器和Node.js 18+都支持)
  if (await isAdapterAvailable('fetch')) {
    console.log('[HTTP] Using Fetch adapter (recommended)')
    return createAdapter('fetch')
  }

  // 2. 尝试使用 Axios (功能最全,生态最好)
  if (await isAdapterAvailable('axios')) {
    console.log('[HTTP] Using Axios adapter')
    return createAdapter('axios')
  }

  // 3. 尝试使用 Alova
  if (await isAdapterAvailable('alova')) {
    console.log('[HTTP] Using Alova adapter')
    return createAdapter('alova')
  }

  // 没有可用的适配器
  throw new Error(
    'No suitable HTTP adapter found. ' +
    'Please install one of the following: ' +
    'fetch API (built-in for modern browsers/Node.js 18+), ' +
    'axios (npm install axios), ' +
    'alova (npm install alova)'
  )
}

/**
 * 根据环境选择最佳适配器
 * 
 * - Node.js环境: 优先Axios
 * - 浏览器环境: 优先Fetch
 * - 其他环境: 回退到通用选择
 * 
 * @returns Promise<HttpAdapter> - 适合当前环境的适配器
 * 
 * @example
 * ```typescript
 * const adapter = await createAdapterForEnvironment()
 * ```
 */
export async function createAdapterForEnvironment(): Promise<HttpAdapter> {
  // 检测Node.js环境
  const isNode = typeof process !== 'undefined' 
    && process.versions != null 
    && process.versions.node != null

  // 检测浏览器环境
  const isBrowser = typeof window !== 'undefined' 
    && typeof document !== 'undefined'

  // Node.js环境: 优先使用Axios(对Node.js支持更好)
  if (isNode) {
    if (await isAdapterAvailable('axios')) {
      console.log('[HTTP] Using Axios adapter (Node.js environment)')
      return createAdapter('axios')
    }
    // Node.js 18+ 支持 fetch
    if (await isAdapterAvailable('fetch')) {
      console.log('[HTTP] Using Fetch adapter (Node.js 18+ environment)')
      return createAdapter('fetch')
    }
  }

  // 浏览器环境: 优先使用Fetch(现代浏览器原生支持)
  if (isBrowser) {
    if (await isAdapterAvailable('fetch')) {
      console.log('[HTTP] Using Fetch adapter (Browser environment)')
      return createAdapter('fetch')
    }
    if (await isAdapterAvailable('axios')) {
      console.log('[HTTP] Using Axios adapter (Browser environment)')
      return createAdapter('axios')
    }
  }

  // 回退到通用选择
  console.log('[HTTP] Using generic adapter selection')
  return createBestAdapter()
}

/**
 * 检查适配器可用性并返回详情
 * 
 * @returns Promise<AdapterAvailability> - 所有适配器的可用性状态
 * 
 * @example
 * ```typescript
 * const availability = await checkAdapterAvailability()
 * console.log('Available adapters:', availability.available)
 * ```
 */
export async function checkAdapterAvailability(): Promise<{
  fetch: boolean
  axios: boolean
  alova: boolean
  available: string[]
  recommended: string
}> {
  const fetch = await isAdapterAvailable('fetch')
  const axios = await isAdapterAvailable('axios')
  const alova = await isAdapterAvailable('alova')

  const available: string[] = []
  if (fetch) available.push('fetch')
  if (axios) available.push('axios')
  if (alova) available.push('alova')

  // 确定推荐的适配器
  let recommended = 'none'
  if (fetch) recommended = 'fetch'
  else if (axios) recommended = 'axios'
  else if (alova) recommended = 'alova'

  return {
    fetch,
    axios,
    alova,
    available,
    recommended
  }
}

/**
 * 适配器选择策略
 */
export enum AdapterSelectionStrategy {
  /** 自动选择最佳适配器 */
  AUTO = 'auto',
  /** 根据环境选择 */
  ENVIRONMENT = 'environment',
  /** 优先轻量级 */
  LIGHTWEIGHT = 'lightweight',
  /** 优先功能完整 */
  FULL_FEATURED = 'full-featured'
}

/**
 * 根据策略选择适配器
 * 
 * @param strategy - 选择策略
 * @returns Promise<HttpAdapter> - 选择的适配器
 * 
 * @example
 * ```typescript
 * const adapter = await selectAdapterByStrategy(
 *   AdapterSelectionStrategy.LIGHTWEIGHT
 * )
 * ```
 */
export async function selectAdapterByStrategy(
  strategy: AdapterSelectionStrategy = AdapterSelectionStrategy.AUTO
): Promise<HttpAdapter> {
  switch (strategy) {
    case AdapterSelectionStrategy.AUTO:
      return createBestAdapter()

    case AdapterSelectionStrategy.ENVIRONMENT:
      return createAdapterForEnvironment()

    case AdapterSelectionStrategy.LIGHTWEIGHT:
      // 优先最轻量的: Fetch > Alova > Axios
      if (await isAdapterAvailable('fetch')) {
        return createAdapter('fetch')
      }
      if (await isAdapterAvailable('alova')) {
        return createAdapter('alova')
      }
      if (await isAdapterAvailable('axios')) {
        return createAdapter('axios')
      }
      throw new Error('No adapter available')

    case AdapterSelectionStrategy.FULL_FEATURED:
      // 优先功能最全的: Axios > Fetch > Alova
      if (await isAdapterAvailable('axios')) {
        return createAdapter('axios')
      }
      if (await isAdapterAvailable('fetch')) {
        return createAdapter('fetch')
      }
      if (await isAdapterAvailable('alova')) {
        return createAdapter('alova')
      }
      throw new Error('No adapter available')

    default:
      return createBestAdapter()
  }
}