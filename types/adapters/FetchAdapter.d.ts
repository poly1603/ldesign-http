import { HttpAdapter, RequestConfig, HttpResponse } from '../types/index.js';

/**
 * 原生Fetch适配器
 * 基于浏览器原生fetch API实现HTTP请求
 */

declare class FetchAdapter implements HttpAdapter {
    private abortControllers;
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
     * 构建完整URL
     */
    private buildURL;
    /**
     * 构建fetch选项
     */
    private buildFetchOptions;
    /**
     * 构建请求头
     */
    private buildHeaders;
    /**
     * 转换请求数据
     */
    private transformRequestData;
    /**
     * 转换响应
     */
    private transformResponse;
    /**
     * 解析响应数据
     */
    private parseResponseData;
    /**
     * 转换响应头
     */
    private transformResponseHeaders;
    /**
     * 转换错误
     */
    private transformError;
    /**
     * 创建响应错误
     */
    private createResponseError;
    /**
     * 构建查询字符串
     */
    private buildQueryString;
    /**
     * 检查是否为绝对URL
     */
    private isAbsoluteURL;
    /**
     * 组合URL
     */
    private combineURLs;
    /**
     * 检查请求方法是否应该有请求体
     */
    private shouldHaveBody;
    /**
     * 生成请求ID
     */
    private generateRequestId;
}
/**
 * 创建Fetch适配器实例
 */
declare function createFetchAdapter(): FetchAdapter;
/**
 * 检查是否支持Fetch API
 */
declare function isFetchSupported(): boolean;

export { FetchAdapter, createFetchAdapter, isFetchSupported };
