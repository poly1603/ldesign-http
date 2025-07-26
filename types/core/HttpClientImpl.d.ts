import { BaseHttpClient } from './HttpClient.js';
import { HttpClientConfig, HttpAdapter } from '../types/index.js';

/**
 * HTTP客户端具体实现
 * 支持多种适配器的HTTP客户端
 */

/**
 * HTTP客户端实现类
 */
declare class HttpClient extends BaseHttpClient {
    constructor(config?: HttpClientConfig);
    /**
     * 创建适配器实例
     */
    protected createAdapter(): HttpAdapter;
    /**
     * 切换适配器
     */
    switchAdapter(adapterType: 'fetch' | 'axios' | 'alova' | HttpAdapter): void;
    /**
     * 获取当前适配器信息
     */
    getAdapterInfo(): {
        name: string;
        isCustom: boolean;
    };
    /**
     * 检查适配器是否支持
     */
    static isAdapterSupported(adapterType: 'fetch' | 'axios' | 'alova'): boolean;
    /**
     * 获取所有支持的适配器
     */
    static getSupportedAdapters(): Array<'fetch' | 'axios' | 'alova'>;
    /**
     * 创建新的HTTP客户端实例
     */
    static create(config?: HttpClientConfig): HttpClient;
    /**
     * 创建带有指定适配器的HTTP客户端实例
     */
    static createWithAdapter(adapterType: 'fetch' | 'axios' | 'alova', config?: HttpClientConfig): HttpClient;
    /**
     * 创建带有自定义适配器的HTTP客户端实例
     */
    static createWithCustomAdapter(adapter: HttpAdapter, config?: HttpClientConfig): HttpClient;
}
/**
 * 创建默认的HTTP客户端实例
 */
declare function createHttpClient(config?: HttpClientConfig): HttpClient;
/**
 * 创建Fetch HTTP客户端实例
 */
declare function createFetchHttpClient(config?: HttpClientConfig): HttpClient;
/**
 * 创建Axios HTTP客户端实例
 */
declare function createAxiosHttpClient(config?: HttpClientConfig): HttpClient;
/**
 * 创建Alova HTTP客户端实例
 */
declare function createAlovaHttpClient(config?: HttpClientConfig): HttpClient;

export { HttpClient, createAlovaHttpClient, createAxiosHttpClient, createFetchHttpClient, createHttpClient };
