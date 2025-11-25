import type { HttpClientConfig } from './types';
import { HttpClientImpl } from './client';
export { AdapterFactory, AlovaAdapter, AxiosAdapter, BaseAdapter, createAdapter, FetchAdapter, isAdapterAvailable, } from './adapters';
export { HttpClientImpl as HttpClient } from './client';
export { createHttpEnginePlugin, defaultHttpEnginePlugin, httpPlugin, } from './engine';
export type { HttpEnginePluginOptions } from './engine';
export { contentTypeInterceptor, createAuthInterceptor, createBaseURLInterceptor, createDataTransformInterceptor, createResponseTimeInterceptor, createRetryInterceptor, errorLoggerInterceptor, InterceptorManagerImpl as InterceptorManager, requestIdInterceptor, requestLoggerInterceptor, responseLoggerInterceptor, statusCodeInterceptor, timestampInterceptor, } from './interceptors';
export type * from './types';
export { assertType, createEnum, createTypedError, deepClone, isArray, isFunction, isNonNull, isNumber, isObject, isString, safeGet, safeGetNested, safeJsonParse, typedEntries, typedFilter, typedKeys, typedMerge, typedValues, wrapPromise, } from './types/utils';
export type { AllowsRequestBody, AllStatusCode, ArrayToUnion, BuildUrlWithParams, ClientErrorStatusCode, DeepMerge, DistributiveOmit, ExtractPathParams, FunctionKeys, FunctionsOnly, IsPromise, NonFunctionKeys, PropertiesOnly, ReadonlyTuple, RequestBodyType, ServerErrorStatusCode, StatusCodeMessages, StrictEnum, SuccessStatusCode, UnionToIntersection, UnwrapPromise, } from './types/utils';
export { buildQueryString, buildURL, combineURLs, createHttpError, delay, generateId, isAbsoluteURL, isArrayBuffer, isBlob, isFormData, isURLSearchParams, mergeConfig, } from './utils';
export { ExtendedCacheManager, CacheManager, createExtendedCacheManager, createCacheManager, createLocalStorage, createMemoryStorage, LocalStorageCacheStorage, MemoryCacheStorage, } from './utils/cache';
export type { ExtendedCacheConfig, CacheItemMetadata, CacheStats, ExtendedCacheItem, } from './utils/cache';

// 兼容性导出
/** @deprecated Use ExtendedCacheManager instead */
export { ExtendedCacheManager as AdvancedCacheManager, createExtendedCacheManager as createAdvancedCacheManager } from './utils/cache';
/** @deprecated Use ExtendedCacheConfig instead */
export type { ExtendedCacheConfig as AdvancedCacheConfig, ExtendedCacheItem as EnhancedCacheItem } from './utils/cache';
export { CancelManager, CancelTokenSource, createCancelTokenSource, createTimeoutCancelToken, globalCancelManager, isCancelError, } from './utils/cancel';
export { ConcurrencyManager, createConcurrencyManager, createDeduplicationKeyGenerator, createDeduplicationManager, createRateLimitManager, DeduplicationKeyGenerator, DeduplicationManager, RateLimitManager, } from './utils/concurrency';
export type { DeduplicationKeyConfig, } from './utils/concurrency';
export { createDownloadChunks, createRangeHeader, DownloadProgressCalculator, formatDownloadSpeed, formatTimeRemaining, getFilenameFromResponse, getFilenameFromURL, getMimeTypeFromFilename, isPreviewableFile, mergeDownloadChunks, parseContentRange, saveFileToLocal, supportsRangeRequests, } from './utils/download';
export { builtinRecoveryStrategies, ErrorAnalyzer, ErrorHandler, ErrorType, RetryManager, TimeoutManager, } from './utils/error';
export type { ErrorRecoveryStrategy, ErrorStats, } from './utils/error';
export { createFileChunks, createFilePreviewURL, createUploadFormData, FileValidationError, formatFileSize, generateFileHash, getFileExtension, isAudioFile, isDocumentFile, isImageFile, isVideoFile, ProgressCalculator, revokeFilePreviewURL, validateFile, } from './utils/upload';
export * from './vue';
/**
 * 创建 HTTP 客户端实例
 */
export declare function createHttpClient(config?: HttpClientConfig): HttpClientImpl;
/**
 * 创建默认的 HTTP 客户端实例
 */
export declare const http: HttpClientImpl;
export default createHttpClient;
