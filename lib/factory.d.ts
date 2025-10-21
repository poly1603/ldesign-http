import type { HttpClientConfig } from './types';
import { HttpClientImpl } from './client';
/**
 * 创建 HTTP 客户端实例
 * 这个函数被单独提取出来，避免循环依赖问题
 */
export declare function createHttpClient(config?: HttpClientConfig): HttpClientImpl;
