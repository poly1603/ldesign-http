/**
 * Alova 适配器
 */

import type { HttpAdapter, RequestConfig, ResponseData } from '@ldesign/http-core'

/**
 * Alova 适配器实现
 * 
 * 基于 Alova 库的 HTTP 适配器
 * 
 * @example
 * ```typescript
 * const adapter = new AlovaAdapter()
 * const client = createHttpClient(config, adapter)
 * ```
 */
export class AlovaAdapter implements HttpAdapter {
  name = 'alova'
  private alova: any

  constructor() {
    // 延迟加载 alova
    this.loadAlova()
  }

  /**
   * 加载 Alova 库
   */
  private async loadAlova() {
    try {
      const alovaModule = await import('alova')
      this.alova = alovaModule
    }
    catch (error) {
      console.warn('Alova not found, please install it: pnpm add alova')
    }
  }

  /**
   * 检查是否支持 Alova
   */
  isSupported(): boolean {
    return this.alova !== undefined
  }

  /**
   * 发送 HTTP 请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    if (!this.alova) {
      await this.loadAlova()
    }

    if (!this.alova) {
      throw new Error('Alova is not available')
    }

    // TODO: 实现 Alova 适配器逻辑
    // 这里需要根据 Alova 的 API 进行适配
    throw new Error('Alova adapter not implemented yet')
  }
}


