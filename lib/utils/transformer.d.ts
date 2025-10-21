/**
 * 自动数据转换器
 *
 * 自动转换响应数据中的特殊类型（日期、大数字、枚举等）
 */
/**
 * 转换器配置
 */
export interface TransformerConfig {
    /** 是否转换日期字符串为Date对象 */
    transformDates?: boolean;
    /** 是否转换大数字字符串为BigInt */
    transformBigInt?: boolean;
    /** 是否转换null为undefined */
    nullToUndefined?: boolean;
    /** 是否转换空字符串为null */
    emptyStringToNull?: boolean;
    /** 日期字段的正则匹配 */
    datePattern?: RegExp;
    /** 自定义转换函数 */
    customTransformers?: Array<(key: string, value: any) => any>;
}
/**
 * 数据转换器
 *
 * @example
 * ```typescript
 * const transformer = new DataTransformer({
 *  transformDates: true,
 *  transformBigInt: true,
 * })
 *
 * const data = {
 *  createdAt: '2024-01-01T00:00:00Z',
 *  count: '9007199254740991',
 * }
 *
 * const transformed = transformer.transform(data)
 * // {
 * //  createdAt: Date 对象,
 * //  count: BigInt
 * // }
 * ```
 */
export declare class DataTransformer {
    private config;
    private static readonly ISO_DATE_REGEX;
    private static readonly DATE_FIELD_NAMES;
    constructor(config?: TransformerConfig);
    /**
     * 转换数据
     */
    transform<T = any>(data: any): T;
    /**
     * 转换单个值
     */
    private transformValue;
    /**
     * 转换字符串
     */
    private transformString;
    /**
     * 转换对象
     */
    private transformObject;
    /**
     * 判断是否为日期字段
     */
    private isDateField;
    /**
     * 判断是否为大数字字符串
     */
    private isBigIntString;
    /**
     * 反向转换（用于请求数据）
     */
    serialize<T = any>(data: any): T;
    /**
     * 序列化值
     */
    private serializeValue;
}
/**
 * 创建数据转换器
 */
export declare function createDataTransformer(config?: TransformerConfig): DataTransformer;
/**
 * 全局数据转换器
 */
export declare const globalDataTransformer: DataTransformer;
/**
 * 数据转换拦截器
 *
 * 自动转换响应数据和请求数据
 */
export declare function createDataTransformInterceptor(config?: TransformerConfig): {
    request: {
        onFulfilled: (requestConfig: any) => any;
    };
    response: {
        onFulfilled: (response: any) => any;
    };
};
/**
 * 便捷转换函数
 */
/**
 * 将日期字符串转换为Date对象
 */
export declare function transformDates<T = any>(data: any): T;
/**
 * 将大数字字符串转换为BigInt
 */
export declare function transformBigInts<T = any>(data: any): T;
/**
 * 将null转换为undefined
 */
export declare function nullToUndefined<T = any>(data: any): T;
