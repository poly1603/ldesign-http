export { AdapterFactory, CacheConfig, CacheStorage, CancelToken, DownloadProgress, EventEmitter, EventListener, EventType, ExtendedRequestConfig, HttpAdapter, HttpClientConfig, HttpClientInstance, HttpError, HttpMethod, HttpPlugin, HttpResponse, Middleware, ProgressCallback, RequestConfig, RequestInterceptor, ResponseInterceptor, RetryConfig, UploadProgress } from './types/index.js';
export { BaseHttpClient } from './core/HttpClient.js';
export { HttpClient, createAlovaHttpClient, createAxiosHttpClient, createFetchHttpClient, createHttpClient } from './core/HttpClientImpl.js';
export { FetchAdapter, createFetchAdapter, isFetchSupported } from './adapters/FetchAdapter.js';
export { AxiosAdapter, createAxiosAdapter, isAxiosSupported } from './adapters/AxiosAdapter.js';
export { AlovaAdapter, createAlovaAdapter, isAlovaSupported } from './adapters/AlovaAdapter.js';
export { CacheManager, LocalStorageCacheStorage, MemoryCacheStorage, SessionStorageCacheStorage, createCachePlugin, createLocalStorageCache, createMemoryCache, createSessionStorageCache } from './plugins/cache.js';
export { ExtendedRetryConfig, RetryManager, RetryStrategy, createCustomRetryConfig, createExponentialRetryConfig, createFixedRetryConfig, createLinearRetryConfig, createRetryPlugin } from './plugins/retry.js';
export { AuthInterceptorConfig, LogInterceptorConfig, createAuthInterceptor, createBaseURLInterceptor, createContentTypeInterceptor, createErrorHandlerInterceptor, createInterceptorsPlugin, createLogInterceptor, createRequestIdInterceptor, createResponseTransformInterceptor, createTimeoutInterceptor, createTokenRefreshInterceptor } from './plugins/interceptors.js';
export { HTTP_CLIENT_KEY, RequestState, UseRequestOptions, UseRequestResult, HttpPlugin as VueHttpPlugin, createHttpPlugin, useDelete, useGet, useHttp, usePost, usePut, useRequest } from './vue/index.js';

/**
 * @ldesign/http - 功能强大的HTTP请求库
 * 支持多种适配器：原生fetch、axios、alova
 * 支持Vue3集成，可扩展到其他框架
 */

/**
 * 默认HTTP客户端实例的便捷方法
 */
declare const http: {
    get: any;
    post: any;
    put: any;
    delete: any;
    patch: any;
    head: any;
    options: any;
    request: any;
    addRequestInterceptor: any;
    addResponseInterceptor: any;
    removeInterceptor: any;
    getDefaults: any;
    setDefaults: any;
    createCancelToken: any;
    on: any;
    off: any;
    emit: any;
    once: any;
    getInstance: () => any;
};
/**
 * 创建新的HTTP客户端实例
 */
declare function create(config?: HttpClientConfig): any;
/**
 * 快速创建带有常用配置的HTTP客户端
 */
declare function createQuickClient(options: {
    baseURL?: string;
    timeout?: number;
    adapter?: 'fetch' | 'axios' | 'alova';
    enableCache?: boolean;
    enableRetry?: boolean;
    enableLog?: boolean;
    authToken?: string | (() => string | Promise<string>);
}): any;

export { create, createQuickClient, http as default, http };
