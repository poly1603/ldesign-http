import type { HttpClientConfig } from '../types';
import type { HttpPluginOptions } from '../types/vue';
interface Plugin {
    name: string;
    version: string;
    dependencies?: string[];
    install: (engine: any) => Promise<void>;
    uninstall?: (engine: any) => Promise<void>;
    [key: string]: any;
}
/**
 * HTTP Engine 插件选项
 */
export interface HttpEnginePluginOptions extends HttpPluginOptions {
    /** 插件名称 */
    name?: string;
    /** 插件版本 */
    version?: string;
    /** HTTP 客户端配置 */
    clientConfig?: HttpClientConfig;
    /** 是否启用全局注入 */
    globalInjection?: boolean;
    /** 全局属性名称 */
    globalPropertyName?: string;
}
/**
 * 创建 HTTP Engine 插件
 *
 * 将 HTTP Vue 插件包装为标准的 Engine 插件，提供统一的插件管理体验
 *
 * @param options HTTP 配置选项
 * @returns Engine 插件实例
 *
 * @example
 * ```typescript
 * import { createHttpEnginePlugin } from '@ldesign/http'
 *
 * const httpPlugin = createHttpEnginePlugin({
 *   clientConfig: {
 *     baseURL: 'https://api.example.com',
 *     timeout: 10000
 *   },
 *   globalInjection: true,
 *   globalPropertyName: '$http'
 * })
 *
 * await engine.use(httpPlugin)
 * ```
 */
export declare function createHttpEnginePlugin(options?: HttpEnginePluginOptions): Plugin;
/**
 * HTTP 插件工厂函数（向后兼容）
 *
 * @param options HTTP 配置选项
 * @returns HTTP Engine 插件实例
 *
 * @example
 * ```typescript
 * import { httpPlugin } from '@ldesign/http'
 *
 * await engine.use(httpPlugin({
 *   clientConfig: {
 *     baseURL: 'https://api.example.com'
 *   }
 * }))
 * ```
 */
export declare function httpPlugin(options: HttpEnginePluginOptions): Plugin;
/**
 * 默认 HTTP Engine 插件实例
 *
 * 使用默认配置创建的 HTTP 插件，可以直接使用
 *
 * @example
 * ```typescript
 * import { defaultHttpEnginePlugin } from '@ldesign/http'
 *
 * await engine.use(defaultHttpEnginePlugin)
 * ```
 */
export declare const defaultHttpEnginePlugin: Plugin;
export {};
