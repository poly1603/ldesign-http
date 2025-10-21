import type { HttpClientConfig, RequestConfig } from '../types';
import { HttpClientImpl } from '../client';
/**
 * HTTP客户端组合式函数
 */
export declare function useHttp(config?: HttpClientConfig): {
    loading: import("vue").ComputedRef<boolean>;
    error: import("vue").Ref<Error | null, Error | null>;
    data: import("vue").Ref<unknown, unknown>;
    hasError: import("vue").ComputedRef<boolean>;
    get: <T = unknown>(url: string, config?: RequestConfig) => Promise<T | null>;
    post: <T = unknown, D = unknown>(url: string, postData?: D, config?: RequestConfig) => Promise<T | null>;
    put: <T = unknown, D = unknown>(url: string, putData?: D, config?: RequestConfig) => Promise<T | null>;
    delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<T | null>;
    clearError: () => void;
    reset: () => void;
    client: HttpClientImpl;
};
