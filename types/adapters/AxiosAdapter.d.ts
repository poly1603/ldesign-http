import { AxiosRequestConfig, AxiosInstance } from 'axios';
import { HttpAdapter, RequestConfig, HttpResponse } from '../types/index.js';

/**
 * Axios适配器
 * 基于Axios库实现HTTP请求
 */

declare class AxiosAdapter implements HttpAdapter {
    private axiosInstance;
    private cancelTokenSources;
    constructor(axiosConfig?: AxiosRequestConfig);
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
     * 获取Axios实例
     */
    getAxiosInstance(): AxiosInstance;
    /**
     * 转换请求配置
     */
    private transformRequestConfig;
    /**
     * 转换响应类型
     */
    private transformResponseType;
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
     * 生成请求ID
     */
    private generateRequestId;
}
/**
 * 创建Axios适配器实例
 */
declare function createAxiosAdapter(config?: AxiosRequestConfig): AxiosAdapter;
/**
 * 检查是否支持Axios
 */
declare function isAxiosSupported(): boolean;

export { AxiosAdapter, createAxiosAdapter, isAxiosSupported };
