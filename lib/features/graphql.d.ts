import type { HttpClient, RequestConfig } from '../types';
/**
 * GraphQL 查询变量类型
 */
export type GraphQLVariables = Record<string, any>;
/**
 * GraphQL 请求配置
 */
export interface GraphQLRequestConfig extends Omit<RequestConfig, 'method' | 'data'> {
    /** GraphQL 端点 URL（如果不同于 baseURL） */
    endpoint?: string;
    /** 自定义请求头 */
    headers?: Record<string, string>;
    /** 启用批量查询 */
    batching?: boolean;
    /** 批量查询延迟（毫秒） */
    batchDelay?: number;
}
/**
 * GraphQL 响应类型
 */
export interface GraphQLResponse<T = any> {
    data?: T;
    errors?: GraphQLError[];
    extensions?: Record<string, any>;
}
/**
 * GraphQL 错误类��
 */
export interface GraphQLError {
    message: string;
    locations?: Array<{
        line: number;
        column: number;
    }>;
    path?: Array<string | number>;
    extensions?: Record<string, any>;
}
/**
 * GraphQL 客户端配置
 */
export interface GraphQLClientConfig {
    /** 默认端点 URL */
    endpoint: string;
    /** 默认请求头 */
    headers?: Record<string, string>;
    /** 启用批量查询 */
    batching?: boolean;
    /** 批量查询延迟（毫秒） */
    batchDelay?: number;
    /** 是否在控制台打印查询 */
    debug?: boolean;
}
/**
 * GraphQL 客户端
 *
 * 提供 GraphQL 查询、变更和订阅功能，支持批量查询优化
 *
 * @example
 * ```typescript
 * const graphqlClient = new GraphQLClient(httpClient, {
 *   endpoint: '/graphql',
 *   batching: true,
 *   batchDelay: 10
 * })
 *
 * // 执行查询
 * const { data, errors } = await graphqlClient.query<User[]>(`
 *   query GetUsers {
 *     users {
 *       id
 *       name
 *       email
 *     }
 *   }
 * `)
 *
 * // 执行变更
 * const result = await graphqlClient.mutate<User>(`
 *   mutation CreateUser($input: CreateUserInput!) {
 *     createUser(input: $input) {
 *       id
 *       name
 *     }
 *   }
 * `, {
 *   input: { name: 'John', email: 'john@example.com' }
 * })
 * ```
 */
export declare class GraphQLClient {
    private httpClient;
    private config;
    private batchQueue;
    private batchTimer;
    constructor(httpClient: HttpClient, config: GraphQLClientConfig);
    /**
     * 执行 GraphQL 查询
     */
    query<T = any>(query: string, variables?: GraphQLVariables, config?: GraphQLRequestConfig): Promise<GraphQLResponse<T>>;
    /**
     * 执行 GraphQL 变更
     */
    mutate<T = any>(mutation: string, variables?: GraphQLVariables, config?: GraphQLRequestConfig): Promise<GraphQLResponse<T>>;
    /**
     * 执行 GraphQL 请求
     */
    private request;
    /**
     * 执行单个 GraphQL 请求
     */
    private singleRequest;
    /**
     * 批量请求
     */
    private batchRequest;
    /**
     * 执行批量请求
     */
    private executeBatch;
    /**
     * 清除批量队列
     */
    clearBatch(): void;
    /**
     * 获取批量队列大小
     */
    getBatchQueueSize(): number;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<GraphQLClientConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): GraphQLClientConfig;
}
/**
 * GraphQL 客户端错误
 */
export declare class GraphQLClientError extends Error {
    graphQLErrors: GraphQLError[];
    data?: any;
    constructor(errors: GraphQLError[], data?: any);
    /**
     * 判断是否有指定类型的错误
     */
    hasErrorCode(code: string): boolean;
    /**
     * 获取第一个错误
     */
    getFirstError(): GraphQLError | undefined;
}
/**
 * 创建 GraphQL 客户端
 */
export declare function createGraphQLClient(httpClient: HttpClient, config: GraphQLClientConfig): GraphQLClient;
/**
 * 类型守卫：检查是否为 GraphQL 错误
 */
export declare function isGraphQLError(error: any): error is GraphQLClientError;
