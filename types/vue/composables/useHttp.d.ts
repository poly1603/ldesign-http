import type { HttpClientConfig } from '../../types';
import { HttpClientImpl } from '../../client';
/**
 * HTTP客户端组合式函数
 */
export declare function useHttp(config?: HttpClientConfig): {
    loading: import("vue").ComputedRef<boolean>;
    error: import("vue").Ref<Error | null, Error | null>;
    data: import("vue").Ref<any, any>;
    hasError: import("vue").ComputedRef<boolean>;
    get: <T = any>(url: string, config?: any) => Promise<T | null>;
    post: <T = any>(url: string, data?: any, config?: any) => Promise<T | null>;
    put: <T = any>(url: string, data?: any, config?: any) => Promise<T | null>;
    delete: <T = any>(url: string, config?: any) => Promise<T | null>;
    clearError: () => void;
    reset: () => void;
    client: HttpClientImpl;
};
