import { AlovaOptions, Alova } from 'alova';
import { HttpAdapter, RequestConfig, HttpResponse } from '../types/index.js';

/**
 * Alova适配器
 * 基于Alova库实现HTTP请求
 */

declare class AlovaAdapter implements HttpAdapter {
    private alovaInstance;
    private cancelTokens;
    constructor(alovaConfig?: AlovaOptions<any, any, any, any, any>);
    /**
     * 发送请求
     */
    request<T = any>(config: RequestConfig): Promise<HttpResponse<T>>;
    /**
     * 取消请求
     */
    cancel(requestId?: string): void;
    /**
     * 获取适配器名称
     */
    getName(): string;
    /**
     * 获取Alova实例
     */
    getAlovaInstance(): Alova<any, any, any, any, any>;
    /**
     * 创建方法实例
     */
    private createMethodInstance;
    /**
     * 构建完整URL
     */
    private buildURL;
    /**
     * 提取Alova特定配置
     */
    private extractAlovaConfig;
    /**
     * 转换响应
     */
    private transformResponse;
    /**
     * 转换响应头
     */
    private transformResponseHeaders;
    /**
     * 转换错误
     */
    private transformError;
    /**
     * 检查是否为绝对URL
     */
    private isAbsoluteURL;
    /**
     * 组合URL
     */
    private combineURLs;
    /**
     * 生成请求ID
     */
    private generateRequestId;
}
/**
 * 创建Alova适配器实例
 */
declare function createAlovaAdapter(config?: AlovaOptions<any, any, any, any, any>): AlovaAdapter;
/**
 * 检查是否支持Alova
 */
declare function isAlovaSupported(): boolean;

export { AlovaAdapter, createAlovaAdapter, isAlovaSupported };
