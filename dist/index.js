/*!
 * @ldesign/http v1.0.0
 * (c) 2025 LDesign Team
 * @license MIT
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('util'), require('stream'), require('path'), require('http'), require('https'), require('url'), require('fs'), require('crypto'), require('assert'), require('tty'), require('zlib'), require('events'), require('vue')) :
    typeof define === 'function' && define.amd ? define(['exports', 'util', 'stream', 'path', 'http', 'https', 'url', 'fs', 'crypto', 'assert', 'tty', 'zlib', 'events', 'vue'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.LDesignStore = {}, global.require$$1, global.stream, global.require$$1$1, global.require$$3, global.require$$4, global.require$$0$1, global.require$$6, global.require$$8, global.require$$4$1, global.require$$0$2, global.zlib, global.events$1, global.Vue));
})(this, (function (exports, require$$1, stream, require$$1$1, require$$3, require$$4, require$$0$1, require$$6, require$$8, require$$4$1, require$$0$2, zlib, events$1, vue) { 'use strict';

    /**
     * HTTP请求系统核心类型定义
     * 支持多种适配器：原生fetch、axios、alova
     */
    // HTTP方法枚举
    var HttpMethod$1;
    (function (HttpMethod) {
        HttpMethod["GET"] = "GET";
        HttpMethod["POST"] = "POST";
        HttpMethod["PUT"] = "PUT";
        HttpMethod["DELETE"] = "DELETE";
        HttpMethod["PATCH"] = "PATCH";
        HttpMethod["HEAD"] = "HEAD";
        HttpMethod["OPTIONS"] = "OPTIONS";
    })(HttpMethod$1 || (HttpMethod$1 = {}));

    /**
     * HTTP客户端抽象基类
     * 提供统一的接口和通用功能实现
     */
    class BaseHttpClient {
        constructor(config = {}) {
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "adapter", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "requestInterceptors", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "responseInterceptors", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "middlewares", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: []
            });
            Object.defineProperty(this, "eventListeners", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            Object.defineProperty(this, "interceptorId", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 0
            });
            this.config = this.mergeConfig(this.getDefaultConfig(), config);
            this.adapter = this.createAdapter();
            this.initializeEventListeners();
        }
        /**
         * 获取默认配置
         */
        getDefaultConfig() {
            return {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                },
                responseType: 'json',
                withCredentials: false,
                adapter: 'fetch',
                interceptors: {
                    request: [],
                    response: [],
                },
                cache: {
                    enabled: false,
                    ttl: 5 * 60 * 1000, // 5分钟
                },
                retry: {
                    retries: 0,
                    retryDelay: 1000,
                    retryCondition: (error) => {
                        return !error.response || (error.response.status >= 500 && error.response.status < 600);
                    },
                },
            };
        }
        /**
         * 初始化事件监听器
         */
        initializeEventListeners() {
            const eventTypes = ['request', 'response', 'error', 'retry', 'cache-hit', 'cache-miss'];
            eventTypes.forEach((type) => {
                this.eventListeners.set(type, []);
            });
        }
        /**
         * 合并配置
         */
        mergeConfig(defaultConfig, userConfig) {
            return {
                ...defaultConfig,
                ...userConfig,
                headers: {
                    ...defaultConfig.headers,
                    ...userConfig.headers,
                },
                interceptors: {
                    request: [
                        ...(defaultConfig.interceptors?.request || []),
                        ...(userConfig.interceptors?.request || []),
                    ],
                    response: [
                        ...(defaultConfig.interceptors?.response || []),
                        ...(userConfig.interceptors?.response || []),
                    ],
                },
                cache: {
                    ...defaultConfig.cache,
                    ...userConfig.cache,
                },
                retry: {
                    ...defaultConfig.retry,
                    ...userConfig.retry,
                },
            };
        }
        /**
         * GET请求
         */
        async get(url, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.GET,
            });
        }
        /**
         * POST请求
         */
        async post(url, data, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.POST,
                data,
            });
        }
        /**
         * PUT请求
         */
        async put(url, data, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.PUT,
                data,
            });
        }
        /**
         * DELETE请求
         */
        async delete(url, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.DELETE,
            });
        }
        /**
         * PATCH请求
         */
        async patch(url, data, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.PATCH,
                data,
            });
        }
        /**
         * HEAD请求
         */
        async head(url, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.HEAD,
            });
        }
        /**
         * OPTIONS请求
         */
        async options(url, config) {
            return this.request({
                ...config,
                url,
                method: HttpMethod$1.OPTIONS,
            });
        }
        /**
         * 通用请求方法
         */
        async request(config) {
            try {
                // 合并配置
                const mergedConfig = this.mergeRequestConfig(config);
                // 触发请求事件
                this.emit('request', { config: mergedConfig });
                // 执行请求拦截器
                const processedConfig = await this.executeRequestInterceptors(mergedConfig);
                // 检查缓存
                const cachedResponse = await this.checkCache(processedConfig);
                if (cachedResponse) {
                    this.emit('cache-hit', { config: processedConfig, response: cachedResponse });
                    return cachedResponse;
                }
                this.emit('cache-miss', { config: processedConfig });
                // 发送请求（带重试机制）
                const response = await this.requestWithRetry(processedConfig);
                // 执行响应拦截器
                const processedResponse = await this.executeResponseInterceptors(response);
                // 缓存响应
                await this.cacheResponse(processedConfig, processedResponse);
                // 触发响应事件
                this.emit('response', { config: processedConfig, response: processedResponse });
                return processedResponse;
            }
            catch (error) {
                const httpError = this.createHttpError(error, config);
                this.emit('error', { config, error: httpError });
                throw httpError;
            }
        }
        /**
         * 合并请求配置
         */
        mergeRequestConfig(config) {
            return {
                ...this.config,
                ...config,
                headers: {
                    ...this.config.headers,
                    ...config.headers,
                },
            };
        }
        /**
         * 执行请求拦截器
         */
        async executeRequestInterceptors(config) {
            let processedConfig = config;
            for (const interceptor of this.requestInterceptors.values()) {
                if (interceptor.onFulfilled) {
                    try {
                        processedConfig = await interceptor.onFulfilled(processedConfig);
                    }
                    catch (error) {
                        if (interceptor.onRejected) {
                            processedConfig = await interceptor.onRejected(error);
                        }
                        else {
                            throw error;
                        }
                    }
                }
            }
            return processedConfig;
        }
        /**
         * 执行响应拦截器
         */
        async executeResponseInterceptors(response) {
            let processedResponse = response;
            for (const interceptor of this.responseInterceptors.values()) {
                if (interceptor.onFulfilled) {
                    try {
                        processedResponse = await interceptor.onFulfilled(processedResponse);
                    }
                    catch (error) {
                        if (interceptor.onRejected) {
                            throw await interceptor.onRejected(error);
                        }
                        else {
                            throw error;
                        }
                    }
                }
            }
            return processedResponse;
        }
        /**
         * 带重试机制的请求
         */
        async requestWithRetry(config, retryCount = 0) {
            try {
                return await this.adapter.request(config);
            }
            catch (error) {
                const httpError = this.createHttpError(error, config);
                const retryConfig = this.config.retry;
                if (retryCount < retryConfig.retries
                    && retryConfig.retryCondition(httpError)) {
                    this.emit('retry', { config, error: httpError, retryCount: retryCount + 1 });
                    const delay = retryConfig.retryDelayCalculator
                        ? retryConfig.retryDelayCalculator(retryCount + 1, httpError)
                        : retryConfig.retryDelay * 2 ** retryCount;
                    await this.delay(delay);
                    return this.requestWithRetry(config, retryCount + 1);
                }
                throw httpError;
            }
        }
        /**
         * 延迟函数
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        /**
         * 检查缓存
         */
        async checkCache(config) {
            if (!this.config.cache?.enabled || config.method !== HttpMethod$1.GET) {
                return null;
            }
            // 这里应该实现具体的缓存逻辑
            // 暂时返回null，后续在缓存模块中实现
            return null;
        }
        /**
         * 缓存响应
         */
        async cacheResponse(config, response) {
            if (!this.config.cache?.enabled || config.method !== HttpMethod$1.GET) ;
            // 这里应该实现具体的缓存逻辑
            // 后续在缓存模块中实现
        }
        /**
         * 创建HTTP错误对象
         */
        createHttpError(error, config) {
            const httpError = new Error(error.message || 'Request failed');
            httpError.config = config;
            httpError.code = error.code;
            httpError.response = error.response;
            httpError.isNetworkError = !error.response;
            httpError.isTimeoutError = error.code === 'TIMEOUT';
            httpError.isCancelError = error.code === 'CANCELLED';
            return httpError;
        }
        /**
         * 添加请求拦截器
         */
        addRequestInterceptor(interceptor) {
            const id = ++this.interceptorId;
            this.requestInterceptors.set(id, interceptor);
            return id;
        }
        /**
         * 添加响应拦截器
         */
        addResponseInterceptor(interceptor) {
            const id = ++this.interceptorId;
            this.responseInterceptors.set(id, interceptor);
            return id;
        }
        /**
         * 移除拦截器
         */
        removeInterceptor(type, id) {
            if (type === 'request') {
                this.requestInterceptors.delete(id);
            }
            else {
                this.responseInterceptors.delete(id);
            }
        }
        /**
         * 创建取消令牌
         */
        createCancelToken() {
            let cancel;
            let isCancelled = false;
            let reason;
            const promise = new Promise((_, reject) => {
                cancel = (cancelReason) => {
                    if (!isCancelled) {
                        isCancelled = true;
                        reason = cancelReason || 'Request cancelled';
                        reject(new Error(reason));
                    }
                };
            });
            return {
                reason,
                isCancelled,
                cancel: cancel,
                promise,
            };
        }
        /**
         * 获取默认配置
         */
        getDefaults() {
            return { ...this.config };
        }
        /**
         * 设置默认配置
         */
        setDefaults(config) {
            this.config = this.mergeConfig(this.config, config);
        }
        /**
         * 添加事件监听器
         */
        on(event, listener) {
            const listeners = this.eventListeners.get(event) || [];
            listeners.push(listener);
            this.eventListeners.set(event, listeners);
        }
        /**
         * 移除事件监听器
         */
        off(event, listener) {
            const listeners = this.eventListeners.get(event) || [];
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
        /**
         * 触发事件
         */
        emit(event, data) {
            const listeners = this.eventListeners.get(event) || [];
            listeners.forEach((listener) => {
                try {
                    listener(data);
                }
                catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
        /**
         * 添加一次性事件监听器
         */
        once(event, listener) {
            const onceListener = (data) => {
                listener(data);
                this.off(event, onceListener);
            };
            this.on(event, onceListener);
        }
    }

    /**
     * 原生Fetch适配器
     * 基于浏览器原生fetch API实现HTTP请求
     */
    class FetchAdapter {
        constructor() {
            Object.defineProperty(this, "abortControllers", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
        }
        /**
         * 发送请求
         */
        async request(config) {
            try {
                const url = this.buildURL(config);
                const fetchOptions = this.buildFetchOptions(config);
                // 创建AbortController用于取消请求
                const abortController = new AbortController();
                const requestId = this.generateRequestId();
                this.abortControllers.set(requestId, abortController);
                fetchOptions.signal = abortController.signal;
                // 设置超时
                if (config.timeout) {
                    setTimeout(() => {
                        abortController.abort();
                    }, config.timeout);
                }
                const response = await fetch(url, fetchOptions);
                // 清理AbortController
                this.abortControllers.delete(requestId);
                return await this.transformResponse(response, config);
            }
            catch (error) {
                throw this.transformError(error, config);
            }
        }
        /**
         * 取消请求
         */
        cancel(requestId) {
            if (requestId) {
                const controller = this.abortControllers.get(requestId);
                if (controller) {
                    controller.abort();
                    this.abortControllers.delete(requestId);
                }
            }
            else {
                // 取消所有请求
                this.abortControllers.forEach(controller => controller.abort());
                this.abortControllers.clear();
            }
        }
        /**
         * 获取适配器名称
         */
        getName() {
            return 'fetch';
        }
        /**
         * 构建完整URL
         */
        buildURL(config) {
            let url = config.url;
            // 添加baseURL
            if (config.baseURL && !this.isAbsoluteURL(url)) {
                url = this.combineURLs(config.baseURL, url);
            }
            // 添加查询参数
            if (config.params && Object.keys(config.params).length > 0) {
                const separator = url.includes('?') ? '&' : '?';
                const queryString = this.buildQueryString(config.params);
                url = `${url}${separator}${queryString}`;
            }
            return url;
        }
        /**
         * 构建fetch选项
         */
        buildFetchOptions(config) {
            const options = {
                method: config.method || HttpMethod.GET,
                headers: this.buildHeaders(config),
                credentials: config.withCredentials ? 'include' : 'same-origin',
            };
            // 添加请求体
            if (config.data && this.shouldHaveBody(config.method)) {
                options.body = this.transformRequestData(config.data, config.headers);
            }
            return options;
        }
        /**
         * 构建请求头
         */
        buildHeaders(config) {
            const headers = new Headers();
            if (config.headers) {
                Object.entries(config.headers).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        headers.set(key, String(value));
                    }
                });
            }
            return headers;
        }
        /**
         * 转换请求数据
         */
        transformRequestData(data, headers) {
            if (data === null || data === undefined) {
                return '';
            }
            // 如果是FormData、Blob、ArrayBuffer等，直接返回
            if (data instanceof FormData
                || data instanceof Blob
                || data instanceof ArrayBuffer
                || data instanceof URLSearchParams
                || typeof data === 'string') {
                return data;
            }
            // 如果是对象，转换为JSON
            if (typeof data === 'object') {
                // 自动设置Content-Type
                if (headers && !headers['Content-Type'] && !headers['content-type']) {
                    headers['Content-Type'] = 'application/json';
                }
                return JSON.stringify(data);
            }
            return String(data);
        }
        /**
         * 转换响应
         */
        async transformResponse(response, config) {
            const headers = this.transformResponseHeaders(response.headers);
            let data;
            try {
                data = await this.parseResponseData(response, config.responseType);
            }
            catch (error) {
                throw new Error(`Failed to parse response data: ${error}`);
            }
            const httpResponse = {
                data,
                status: response.status,
                statusText: response.statusText,
                headers,
                config,
                raw: response,
            };
            // 检查响应状态
            if (!response.ok) {
                throw this.createResponseError(httpResponse);
            }
            return httpResponse;
        }
        /**
         * 解析响应数据
         */
        async parseResponseData(response, responseType) {
            const clonedResponse = response.clone();
            switch (responseType) {
                case 'text':
                    return (await clonedResponse.text());
                case 'blob':
                    return (await clonedResponse.blob());
                case 'arrayBuffer':
                    return (await clonedResponse.arrayBuffer());
                case 'stream':
                    return (clonedResponse.body);
                case 'json':
                default:
                    try {
                        return await clonedResponse.json();
                    }
                    catch {
                        // 如果JSON解析失败，尝试返回文本
                        return (await response.text());
                    }
            }
        }
        /**
         * 转换响应头
         */
        transformResponseHeaders(headers) {
            const result = {};
            headers.forEach((value, key) => {
                result[key.toLowerCase()] = value;
            });
            return result;
        }
        /**
         * 转换错误
         */
        transformError(error, config) {
            const httpError = new Error(error.message || 'Request failed');
            httpError.config = config;
            if (error.name === 'AbortError') {
                httpError.code = 'CANCELLED';
                httpError.isCancelError = true;
                httpError.message = 'Request was cancelled';
            }
            else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                httpError.code = 'NETWORK_ERROR';
                httpError.isNetworkError = true;
                httpError.message = 'Network error occurred';
            }
            else if (error.name === 'TimeoutError') {
                httpError.code = 'TIMEOUT';
                httpError.isTimeoutError = true;
                httpError.message = 'Request timeout';
            }
            return httpError;
        }
        /**
         * 创建响应错误
         */
        createResponseError(response) {
            const error = new Error(`Request failed with status ${response.status}`);
            error.config = response.config;
            error.response = response;
            error.code = `HTTP_${response.status}`;
            return error;
        }
        /**
         * 构建查询字符串
         */
        buildQueryString(params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        value.forEach(item => searchParams.append(key, String(item)));
                    }
                    else {
                        searchParams.append(key, String(value));
                    }
                }
            });
            return searchParams.toString();
        }
        /**
         * 检查是否为绝对URL
         */
        isAbsoluteURL(url) {
            return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
        }
        /**
         * 组合URL
         */
        combineURLs(baseURL, relativeURL) {
            return relativeURL
                ? `${baseURL.replace(/\/+$/, '')}/${relativeURL.replace(/^\/+/, '')}`
                : baseURL;
        }
        /**
         * 检查请求方法是否应该有请求体
         */
        shouldHaveBody(method) {
            return method !== HttpMethod.GET
                && method !== HttpMethod.HEAD
                && method !== HttpMethod.OPTIONS;
        }
        /**
         * 生成请求ID
         */
        generateRequestId() {
            return `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    /**
     * 创建Fetch适配器实例
     */
    function createFetchAdapter() {
        return new FetchAdapter();
    }
    /**
     * 检查是否支持Fetch API
     */
    function isFetchSupported$1() {
        return typeof fetch !== 'undefined'
            && typeof AbortController !== 'undefined'
            && typeof Headers !== 'undefined';
    }

    function bind$2(fn, thisArg) {
      return function wrap() {
        return fn.apply(thisArg, arguments);
      };
    }

    // utils is a library of generic helper functions non-specific to axios

    const {toString} = Object.prototype;
    const {getPrototypeOf} = Object;
    const {iterator, toStringTag: toStringTag$1} = Symbol;

    const kindOf = (cache => thing => {
        const str = toString.call(thing);
        return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(Object.create(null));

    const kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type
    };

    const typeOfTest = type => thing => typeof thing === type;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     *
     * @returns {boolean} True if value is an Array, otherwise false
     */
    const {isArray: isArray$1} = Array;

    /**
     * Determine if a value is undefined
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    const isUndefined = typeOfTest('undefined');

    /**
     * Determine if a value is a Buffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer$1(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    const isArrayBuffer = kindOfTest('ArrayBuffer');


    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      let result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a String, otherwise false
     */
    const isString$2 = typeOfTest('string');

    /**
     * Determine if a value is a Function
     *
     * @param {*} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    const isFunction$1 = typeOfTest('function');

    /**
     * Determine if a value is a Number
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Number, otherwise false
     */
    const isNumber$1 = typeOfTest('number');

    /**
     * Determine if a value is an Object
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an Object, otherwise false
     */
    const isObject = (thing) => thing !== null && typeof thing === 'object';

    /**
     * Determine if a value is a Boolean
     *
     * @param {*} thing The value to test
     * @returns {boolean} True if value is a Boolean, otherwise false
     */
    const isBoolean = thing => thing === true || thing === false;

    /**
     * Determine if a value is a plain Object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a plain Object, otherwise false
     */
    const isPlainObject$1 = (val) => {
      if (kindOf(val) !== 'object') {
        return false;
      }

      const prototype = getPrototypeOf(val);
      return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(toStringTag$1 in val) && !(iterator in val);
    };

    /**
     * Determine if a value is an empty object (safely handles Buffers)
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is an empty object, otherwise false
     */
    const isEmptyObject = (val) => {
      // Early return for non-objects or Buffers to prevent RangeError
      if (!isObject(val) || isBuffer$1(val)) {
        return false;
      }
      
      try {
        return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
      } catch (e) {
        // Fallback for any other objects that might cause RangeError with Object.keys()
        return false;
      }
    };

    /**
     * Determine if a value is a Date
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Date, otherwise false
     */
    const isDate = kindOfTest('Date');

    /**
     * Determine if a value is a File
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFile = kindOfTest('File');

    /**
     * Determine if a value is a Blob
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    const isBlob = kindOfTest('Blob');

    /**
     * Determine if a value is a FileList
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a File, otherwise false
     */
    const isFileList = kindOfTest('FileList');

    /**
     * Determine if a value is a Stream
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    const isStream = (val) => isObject(val) && isFunction$1(val.pipe);

    /**
     * Determine if a value is a FormData
     *
     * @param {*} thing The value to test
     *
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    const isFormData = (thing) => {
      let kind;
      return thing && (
        (typeof FormData === 'function' && thing instanceof FormData) || (
          isFunction$1(thing.append) && (
            (kind = kindOf(thing)) === 'formdata' ||
            // detect form-data instance
            (kind === 'object' && isFunction$1(thing.toString) && thing.toString() === '[object FormData]')
          )
        )
      )
    };

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    const isURLSearchParams = kindOfTest('URLSearchParams');

    const [isReadableStream, isRequest, isResponse, isHeaders] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(kindOfTest);

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     *
     * @returns {String} The String freed of excess whitespace
     */
    const trim = (str) => str.trim ?
      str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     *
     * @param {Boolean} [allOwnKeys = false]
     * @returns {any}
     */
    function forEach$1(obj, fn, {allOwnKeys = false} = {}) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      let i;
      let l;

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray$1(obj)) {
        // Iterate over array values
        for (i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Buffer check
        if (isBuffer$1(obj)) {
          return;
        }

        // Iterate over object keys
        const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        const len = keys.length;
        let key;

        for (i = 0; i < len; i++) {
          key = keys[i];
          fn.call(null, obj[key], key, obj);
        }
      }
    }

    function findKey(obj, key) {
      if (isBuffer$1(obj)){
        return null;
      }

      key = key.toLowerCase();
      const keys = Object.keys(obj);
      let i = keys.length;
      let _key;
      while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
          return _key;
        }
      }
      return null;
    }

    const _global = (() => {
      /*eslint no-undef:0*/
      if (typeof globalThis !== "undefined") return globalThis;
      return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
    })();

    const isContextDefined = (context) => !isUndefined(context) && context !== _global;

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     *
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      const {caseless} = isContextDefined(this) && this || {};
      const result = {};
      const assignValue = (val, key) => {
        const targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject$1(result[targetKey]) && isPlainObject$1(val)) {
          result[targetKey] = merge(result[targetKey], val);
        } else if (isPlainObject$1(val)) {
          result[targetKey] = merge({}, val);
        } else if (isArray$1(val)) {
          result[targetKey] = val.slice();
        } else {
          result[targetKey] = val;
        }
      };

      for (let i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach$1(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     *
     * @param {Boolean} [allOwnKeys]
     * @returns {Object} The resulting value of object a
     */
    const extend = (a, b, thisArg, {allOwnKeys}= {}) => {
      forEach$1(b, (val, key) => {
        if (thisArg && isFunction$1(val)) {
          a[key] = bind$2(val, thisArg);
        } else {
          a[key] = val;
        }
      }, {allOwnKeys});
      return a;
    };

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     *
     * @returns {string} content value without BOM
     */
    const stripBOM = (content) => {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    };

    /**
     * Inherit the prototype methods from one constructor into another
     * @param {function} constructor
     * @param {function} superConstructor
     * @param {object} [props]
     * @param {object} [descriptors]
     *
     * @returns {void}
     */
    const inherits = (constructor, superConstructor, props, descriptors) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      constructor.prototype.constructor = constructor;
      Object.defineProperty(constructor, 'super', {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };

    /**
     * Resolve object with deep prototype chain to a flat object
     * @param {Object} sourceObj source object
     * @param {Object} [destObj]
     * @param {Function|Boolean} [filter]
     * @param {Function} [propFilter]
     *
     * @returns {Object}
     */
    const toFlatObject = (sourceObj, destObj, filter, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};

      destObj = destObj || {};
      // eslint-disable-next-line no-eq-null,eqeqeq
      if (sourceObj == null) return destObj;

      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);

      return destObj;
    };

    /**
     * Determines whether a string ends with the characters of a specified string
     *
     * @param {String} str
     * @param {String} searchString
     * @param {Number} [position= 0]
     *
     * @returns {boolean}
     */
    const endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === undefined || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };


    /**
     * Returns new array from array like object or null if failed
     *
     * @param {*} [thing]
     *
     * @returns {?Array}
     */
    const toArray = (thing) => {
      if (!thing) return null;
      if (isArray$1(thing)) return thing;
      let i = thing.length;
      if (!isNumber$1(i)) return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };

    /**
     * Checking if the Uint8Array exists and if it does, it returns a function that checks if the
     * thing passed in is an instance of Uint8Array
     *
     * @param {TypedArray}
     *
     * @returns {Array}
     */
    // eslint-disable-next-line func-names
    const isTypedArray = (TypedArray => {
      // eslint-disable-next-line func-names
      return thing => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== 'undefined' && getPrototypeOf(Uint8Array));

    /**
     * For each entry in the object, call the function with the key and value.
     *
     * @param {Object<any, any>} obj - The object to iterate over.
     * @param {Function} fn - The function to call for each entry.
     *
     * @returns {void}
     */
    const forEachEntry = (obj, fn) => {
      const generator = obj && obj[iterator];

      const _iterator = generator.call(obj);

      let result;

      while ((result = _iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };

    /**
     * It takes a regular expression and a string, and returns an array of all the matches
     *
     * @param {string} regExp - The regular expression to match against.
     * @param {string} str - The string to search.
     *
     * @returns {Array<boolean>}
     */
    const matchAll = (regExp, str) => {
      let matches;
      const arr = [];

      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }

      return arr;
    };

    /* Checking if the kindOfTest function returns true when passed an HTMLFormElement. */
    const isHTMLForm = kindOfTest('HTMLFormElement');

    const toCamelCase = str => {
      return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,
        function replacer(m, p1, p2) {
          return p1.toUpperCase() + p2;
        }
      );
    };

    /* Creating a function that will check if an object has a property. */
    const hasOwnProperty = (({hasOwnProperty}) => (obj, prop) => hasOwnProperty.call(obj, prop))(Object.prototype);

    /**
     * Determine if a value is a RegExp object
     *
     * @param {*} val The value to test
     *
     * @returns {boolean} True if value is a RegExp object, otherwise false
     */
    const isRegExp = kindOfTest('RegExp');

    const reduceDescriptors = (obj, reducer) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};

      forEach$1(descriptors, (descriptor, name) => {
        let ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
          reducedDescriptors[name] = ret || descriptor;
        }
      });

      Object.defineProperties(obj, reducedDescriptors);
    };

    /**
     * Makes all methods read-only
     * @param {Object} obj
     */

    const freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        // skip restricted props in strict mode
        if (isFunction$1(obj) && ['arguments', 'caller', 'callee'].indexOf(name) !== -1) {
          return false;
        }

        const value = obj[name];

        if (!isFunction$1(value)) return;

        descriptor.enumerable = false;

        if ('writable' in descriptor) {
          descriptor.writable = false;
          return;
        }

        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error('Can not rewrite read-only method \'' + name + '\'');
          };
        }
      });
    };

    const toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};

      const define = (arr) => {
        arr.forEach(value => {
          obj[value] = true;
        });
      };

      isArray$1(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));

      return obj;
    };

    const noop$2 = () => {};

    const toFiniteNumber = (value, defaultValue) => {
      return value != null && Number.isFinite(value = +value) ? value : defaultValue;
    };

    /**
     * If the thing is a FormData object, return true, otherwise return false.
     *
     * @param {unknown} thing - The thing to check.
     *
     * @returns {boolean}
     */
    function isSpecCompliantForm(thing) {
      return !!(thing && isFunction$1(thing.append) && thing[toStringTag$1] === 'FormData' && thing[iterator]);
    }

    const toJSONObject = (obj) => {
      const stack = new Array(10);

      const visit = (source, i) => {

        if (isObject(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }

          //Buffer check
          if (isBuffer$1(source)) {
            return source;
          }

          if(!('toJSON' in source)) {
            stack[i] = source;
            const target = isArray$1(source) ? [] : {};

            forEach$1(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined(reducedValue) && (target[key] = reducedValue);
            });

            stack[i] = undefined;

            return target;
          }
        }

        return source;
      };

      return visit(obj, 0);
    };

    const isAsyncFn = kindOfTest('AsyncFunction');

    const isThenable = (thing) =>
      thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);

    // original code
    // https://github.com/DigitalBrainJS/AxiosPromise/blob/16deab13710ec09779922131f3fa5954320f83ab/lib/utils.js#L11-L34

    const _setImmediate = ((setImmediateSupported, postMessageSupported) => {
      if (setImmediateSupported) {
        return setImmediate;
      }

      return postMessageSupported ? ((token, callbacks) => {
        _global.addEventListener("message", ({source, data}) => {
          if (source === _global && data === token) {
            callbacks.length && callbacks.shift()();
          }
        }, false);

        return (cb) => {
          callbacks.push(cb);
          _global.postMessage(token, "*");
        }
      })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
    })(
      typeof setImmediate === 'function',
      isFunction$1(_global.postMessage)
    );

    const asap = typeof queueMicrotask !== 'undefined' ?
      queueMicrotask.bind(_global) : ( typeof process !== 'undefined' && process.nextTick || _setImmediate);

    // *********************


    const isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);


    var utils$1 = {
      isArray: isArray$1,
      isArrayBuffer,
      isBuffer: isBuffer$1,
      isFormData,
      isArrayBufferView,
      isString: isString$2,
      isNumber: isNumber$1,
      isBoolean,
      isObject,
      isPlainObject: isPlainObject$1,
      isEmptyObject,
      isReadableStream,
      isRequest,
      isResponse,
      isHeaders,
      isUndefined,
      isDate,
      isFile,
      isBlob,
      isRegExp,
      isFunction: isFunction$1,
      isStream,
      isURLSearchParams,
      isTypedArray,
      isFileList,
      forEach: forEach$1,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty, // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop: noop$2,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable,
      setImmediate: _setImmediate,
      asap,
      isIterable
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [config] The config.
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     *
     * @returns {Error} The created error.
     */
    function AxiosError$1(message, code, config, request, response) {
      Error.call(this);

      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = (new Error()).stack;
      }

      this.message = message;
      this.name = 'AxiosError';
      code && (this.code = code);
      config && (this.config = config);
      request && (this.request = request);
      if (response) {
        this.response = response;
        this.status = response.status ? response.status : null;
      }
    }

    utils$1.inherits(AxiosError$1, Error, {
      toJSON: function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils$1.toJSONObject(this.config),
          code: this.code,
          status: this.status
        };
      }
    });

    const prototype$1 = AxiosError$1.prototype;
    const descriptors = {};

    [
      'ERR_BAD_OPTION_VALUE',
      'ERR_BAD_OPTION',
      'ECONNABORTED',
      'ETIMEDOUT',
      'ERR_NETWORK',
      'ERR_FR_TOO_MANY_REDIRECTS',
      'ERR_DEPRECATED',
      'ERR_BAD_RESPONSE',
      'ERR_BAD_REQUEST',
      'ERR_CANCELED',
      'ERR_NOT_SUPPORT',
      'ERR_INVALID_URL'
    // eslint-disable-next-line func-names
    ].forEach(code => {
      descriptors[code] = {value: code};
    });

    Object.defineProperties(AxiosError$1, descriptors);
    Object.defineProperty(prototype$1, 'isAxiosError', {value: true});

    // eslint-disable-next-line func-names
    AxiosError$1.from = (error, code, config, request, response, customProps) => {
      const axiosError = Object.create(prototype$1);

      utils$1.toFlatObject(error, axiosError, function filter(obj) {
        return obj !== Error.prototype;
      }, prop => {
        return prop !== 'isAxiosError';
      });

      AxiosError$1.call(axiosError, error.message, code, config, request, response);

      axiosError.cause = error;

      axiosError.name = error.name;

      customProps && Object.assign(axiosError, customProps);

      return axiosError;
    };

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var Stream$2 = stream.Stream;
    var util$2 = require$$1;

    var delayed_stream = DelayedStream$1;
    function DelayedStream$1() {
      this.source = null;
      this.dataSize = 0;
      this.maxDataSize = 1024 * 1024;
      this.pauseStream = true;

      this._maxDataSizeExceeded = false;
      this._released = false;
      this._bufferedEvents = [];
    }
    util$2.inherits(DelayedStream$1, Stream$2);

    DelayedStream$1.create = function(source, options) {
      var delayedStream = new this();

      options = options || {};
      for (var option in options) {
        delayedStream[option] = options[option];
      }

      delayedStream.source = source;

      var realEmit = source.emit;
      source.emit = function() {
        delayedStream._handleEmit(arguments);
        return realEmit.apply(source, arguments);
      };

      source.on('error', function() {});
      if (delayedStream.pauseStream) {
        source.pause();
      }

      return delayedStream;
    };

    Object.defineProperty(DelayedStream$1.prototype, 'readable', {
      configurable: true,
      enumerable: true,
      get: function() {
        return this.source.readable;
      }
    });

    DelayedStream$1.prototype.setEncoding = function() {
      return this.source.setEncoding.apply(this.source, arguments);
    };

    DelayedStream$1.prototype.resume = function() {
      if (!this._released) {
        this.release();
      }

      this.source.resume();
    };

    DelayedStream$1.prototype.pause = function() {
      this.source.pause();
    };

    DelayedStream$1.prototype.release = function() {
      this._released = true;

      this._bufferedEvents.forEach(function(args) {
        this.emit.apply(this, args);
      }.bind(this));
      this._bufferedEvents = [];
    };

    DelayedStream$1.prototype.pipe = function() {
      var r = Stream$2.prototype.pipe.apply(this, arguments);
      this.resume();
      return r;
    };

    DelayedStream$1.prototype._handleEmit = function(args) {
      if (this._released) {
        this.emit.apply(this, args);
        return;
      }

      if (args[0] === 'data') {
        this.dataSize += args[1].length;
        this._checkIfMaxDataSizeExceeded();
      }

      this._bufferedEvents.push(args);
    };

    DelayedStream$1.prototype._checkIfMaxDataSizeExceeded = function() {
      if (this._maxDataSizeExceeded) {
        return;
      }

      if (this.dataSize <= this.maxDataSize) {
        return;
      }

      this._maxDataSizeExceeded = true;
      var message =
        'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.';
      this.emit('error', new Error(message));
    };

    var util$1 = require$$1;
    var Stream$1 = stream.Stream;
    var DelayedStream = delayed_stream;

    var combined_stream = CombinedStream$1;
    function CombinedStream$1() {
      this.writable = false;
      this.readable = true;
      this.dataSize = 0;
      this.maxDataSize = 2 * 1024 * 1024;
      this.pauseStreams = true;

      this._released = false;
      this._streams = [];
      this._currentStream = null;
      this._insideLoop = false;
      this._pendingNext = false;
    }
    util$1.inherits(CombinedStream$1, Stream$1);

    CombinedStream$1.create = function(options) {
      var combinedStream = new this();

      options = options || {};
      for (var option in options) {
        combinedStream[option] = options[option];
      }

      return combinedStream;
    };

    CombinedStream$1.isStreamLike = function(stream) {
      return (typeof stream !== 'function')
        && (typeof stream !== 'string')
        && (typeof stream !== 'boolean')
        && (typeof stream !== 'number')
        && (!Buffer.isBuffer(stream));
    };

    CombinedStream$1.prototype.append = function(stream) {
      var isStreamLike = CombinedStream$1.isStreamLike(stream);

      if (isStreamLike) {
        if (!(stream instanceof DelayedStream)) {
          var newStream = DelayedStream.create(stream, {
            maxDataSize: Infinity,
            pauseStream: this.pauseStreams,
          });
          stream.on('data', this._checkDataSize.bind(this));
          stream = newStream;
        }

        this._handleErrors(stream);

        if (this.pauseStreams) {
          stream.pause();
        }
      }

      this._streams.push(stream);
      return this;
    };

    CombinedStream$1.prototype.pipe = function(dest, options) {
      Stream$1.prototype.pipe.call(this, dest, options);
      this.resume();
      return dest;
    };

    CombinedStream$1.prototype._getNext = function() {
      this._currentStream = null;

      if (this._insideLoop) {
        this._pendingNext = true;
        return; // defer call
      }

      this._insideLoop = true;
      try {
        do {
          this._pendingNext = false;
          this._realGetNext();
        } while (this._pendingNext);
      } finally {
        this._insideLoop = false;
      }
    };

    CombinedStream$1.prototype._realGetNext = function() {
      var stream = this._streams.shift();


      if (typeof stream == 'undefined') {
        this.end();
        return;
      }

      if (typeof stream !== 'function') {
        this._pipeNext(stream);
        return;
      }

      var getStream = stream;
      getStream(function(stream) {
        var isStreamLike = CombinedStream$1.isStreamLike(stream);
        if (isStreamLike) {
          stream.on('data', this._checkDataSize.bind(this));
          this._handleErrors(stream);
        }

        this._pipeNext(stream);
      }.bind(this));
    };

    CombinedStream$1.prototype._pipeNext = function(stream) {
      this._currentStream = stream;

      var isStreamLike = CombinedStream$1.isStreamLike(stream);
      if (isStreamLike) {
        stream.on('end', this._getNext.bind(this));
        stream.pipe(this, {end: false});
        return;
      }

      var value = stream;
      this.write(value);
      this._getNext();
    };

    CombinedStream$1.prototype._handleErrors = function(stream) {
      var self = this;
      stream.on('error', function(err) {
        self._emitError(err);
      });
    };

    CombinedStream$1.prototype.write = function(data) {
      this.emit('data', data);
    };

    CombinedStream$1.prototype.pause = function() {
      if (!this.pauseStreams) {
        return;
      }

      if(this.pauseStreams && this._currentStream && typeof(this._currentStream.pause) == 'function') this._currentStream.pause();
      this.emit('pause');
    };

    CombinedStream$1.prototype.resume = function() {
      if (!this._released) {
        this._released = true;
        this.writable = true;
        this._getNext();
      }

      if(this.pauseStreams && this._currentStream && typeof(this._currentStream.resume) == 'function') this._currentStream.resume();
      this.emit('resume');
    };

    CombinedStream$1.prototype.end = function() {
      this._reset();
      this.emit('end');
    };

    CombinedStream$1.prototype.destroy = function() {
      this._reset();
      this.emit('close');
    };

    CombinedStream$1.prototype._reset = function() {
      this.writable = false;
      this._streams = [];
      this._currentStream = null;
    };

    CombinedStream$1.prototype._checkDataSize = function() {
      this._updateDataSize();
      if (this.dataSize <= this.maxDataSize) {
        return;
      }

      var message =
        'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.';
      this._emitError(new Error(message));
    };

    CombinedStream$1.prototype._updateDataSize = function() {
      this.dataSize = 0;

      var self = this;
      this._streams.forEach(function(stream) {
        if (!stream.dataSize) {
          return;
        }

        self.dataSize += stream.dataSize;
      });

      if (this._currentStream && this._currentStream.dataSize) {
        this.dataSize += this._currentStream.dataSize;
      }
    };

    CombinedStream$1.prototype._emitError = function(err) {
      this._reset();
      this.emit('error', err);
    };

    var mimeTypes = {};

    var require$$0 = {
    	"application/1d-interleaved-parityfec": {
    	source: "iana"
    },
    	"application/3gpdash-qoe-report+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/3gpp-ims+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/3gpphal+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/3gpphalforms+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/a2l": {
    	source: "iana"
    },
    	"application/ace+cbor": {
    	source: "iana"
    },
    	"application/activemessage": {
    	source: "iana"
    },
    	"application/activity+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-costmap+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-costmapfilter+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-directory+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-endpointcost+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-endpointcostparams+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-endpointprop+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-endpointpropparams+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-error+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-networkmap+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-networkmapfilter+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-updatestreamcontrol+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/alto-updatestreamparams+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/aml": {
    	source: "iana"
    },
    	"application/andrew-inset": {
    	source: "iana",
    	extensions: [
    		"ez"
    	]
    },
    	"application/applefile": {
    	source: "iana"
    },
    	"application/applixware": {
    	source: "apache",
    	extensions: [
    		"aw"
    	]
    },
    	"application/at+jwt": {
    	source: "iana"
    },
    	"application/atf": {
    	source: "iana"
    },
    	"application/atfx": {
    	source: "iana"
    },
    	"application/atom+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"atom"
    	]
    },
    	"application/atomcat+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"atomcat"
    	]
    },
    	"application/atomdeleted+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"atomdeleted"
    	]
    },
    	"application/atomicmail": {
    	source: "iana"
    },
    	"application/atomsvc+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"atomsvc"
    	]
    },
    	"application/atsc-dwd+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"dwd"
    	]
    },
    	"application/atsc-dynamic-event-message": {
    	source: "iana"
    },
    	"application/atsc-held+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"held"
    	]
    },
    	"application/atsc-rdt+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/atsc-rsat+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rsat"
    	]
    },
    	"application/atxml": {
    	source: "iana"
    },
    	"application/auth-policy+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/bacnet-xdd+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/batch-smtp": {
    	source: "iana"
    },
    	"application/bdoc": {
    	compressible: false,
    	extensions: [
    		"bdoc"
    	]
    },
    	"application/beep+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/calendar+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/calendar+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xcs"
    	]
    },
    	"application/call-completion": {
    	source: "iana"
    },
    	"application/cals-1840": {
    	source: "iana"
    },
    	"application/captive+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/cbor": {
    	source: "iana"
    },
    	"application/cbor-seq": {
    	source: "iana"
    },
    	"application/cccex": {
    	source: "iana"
    },
    	"application/ccmp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/ccxml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ccxml"
    	]
    },
    	"application/cdfx+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"cdfx"
    	]
    },
    	"application/cdmi-capability": {
    	source: "iana",
    	extensions: [
    		"cdmia"
    	]
    },
    	"application/cdmi-container": {
    	source: "iana",
    	extensions: [
    		"cdmic"
    	]
    },
    	"application/cdmi-domain": {
    	source: "iana",
    	extensions: [
    		"cdmid"
    	]
    },
    	"application/cdmi-object": {
    	source: "iana",
    	extensions: [
    		"cdmio"
    	]
    },
    	"application/cdmi-queue": {
    	source: "iana",
    	extensions: [
    		"cdmiq"
    	]
    },
    	"application/cdni": {
    	source: "iana"
    },
    	"application/cea": {
    	source: "iana"
    },
    	"application/cea-2018+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/cellml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/cfw": {
    	source: "iana"
    },
    	"application/city+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/clr": {
    	source: "iana"
    },
    	"application/clue+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/clue_info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/cms": {
    	source: "iana"
    },
    	"application/cnrp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/coap-group+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/coap-payload": {
    	source: "iana"
    },
    	"application/commonground": {
    	source: "iana"
    },
    	"application/conference-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/cose": {
    	source: "iana"
    },
    	"application/cose-key": {
    	source: "iana"
    },
    	"application/cose-key-set": {
    	source: "iana"
    },
    	"application/cpl+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"cpl"
    	]
    },
    	"application/csrattrs": {
    	source: "iana"
    },
    	"application/csta+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/cstadata+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/csvm+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/cu-seeme": {
    	source: "apache",
    	extensions: [
    		"cu"
    	]
    },
    	"application/cwt": {
    	source: "iana"
    },
    	"application/cybercash": {
    	source: "iana"
    },
    	"application/dart": {
    	compressible: true
    },
    	"application/dash+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mpd"
    	]
    },
    	"application/dash-patch+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mpp"
    	]
    },
    	"application/dashdelta": {
    	source: "iana"
    },
    	"application/davmount+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"davmount"
    	]
    },
    	"application/dca-rft": {
    	source: "iana"
    },
    	"application/dcd": {
    	source: "iana"
    },
    	"application/dec-dx": {
    	source: "iana"
    },
    	"application/dialog-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/dicom": {
    	source: "iana"
    },
    	"application/dicom+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/dicom+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/dii": {
    	source: "iana"
    },
    	"application/dit": {
    	source: "iana"
    },
    	"application/dns": {
    	source: "iana"
    },
    	"application/dns+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/dns-message": {
    	source: "iana"
    },
    	"application/docbook+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"dbk"
    	]
    },
    	"application/dots+cbor": {
    	source: "iana"
    },
    	"application/dskpp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/dssc+der": {
    	source: "iana",
    	extensions: [
    		"dssc"
    	]
    },
    	"application/dssc+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xdssc"
    	]
    },
    	"application/dvcs": {
    	source: "iana"
    },
    	"application/ecmascript": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"es",
    		"ecma"
    	]
    },
    	"application/edi-consent": {
    	source: "iana"
    },
    	"application/edi-x12": {
    	source: "iana",
    	compressible: false
    },
    	"application/edifact": {
    	source: "iana",
    	compressible: false
    },
    	"application/efi": {
    	source: "iana"
    },
    	"application/elm+json": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/elm+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.cap+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/emergencycalldata.comment+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.control+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.deviceinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.ecall.msd": {
    	source: "iana"
    },
    	"application/emergencycalldata.providerinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.serviceinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.subscriberinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emergencycalldata.veds+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/emma+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"emma"
    	]
    },
    	"application/emotionml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"emotionml"
    	]
    },
    	"application/encaprtp": {
    	source: "iana"
    },
    	"application/epp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/epub+zip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"epub"
    	]
    },
    	"application/eshop": {
    	source: "iana"
    },
    	"application/exi": {
    	source: "iana",
    	extensions: [
    		"exi"
    	]
    },
    	"application/expect-ct-report+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/express": {
    	source: "iana",
    	extensions: [
    		"exp"
    	]
    },
    	"application/fastinfoset": {
    	source: "iana"
    },
    	"application/fastsoap": {
    	source: "iana"
    },
    	"application/fdt+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"fdt"
    	]
    },
    	"application/fhir+json": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/fhir+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/fido.trusted-apps+json": {
    	compressible: true
    },
    	"application/fits": {
    	source: "iana"
    },
    	"application/flexfec": {
    	source: "iana"
    },
    	"application/font-sfnt": {
    	source: "iana"
    },
    	"application/font-tdpfr": {
    	source: "iana",
    	extensions: [
    		"pfr"
    	]
    },
    	"application/font-woff": {
    	source: "iana",
    	compressible: false
    },
    	"application/framework-attributes+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/geo+json": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"geojson"
    	]
    },
    	"application/geo+json-seq": {
    	source: "iana"
    },
    	"application/geopackage+sqlite3": {
    	source: "iana"
    },
    	"application/geoxacml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/gltf-buffer": {
    	source: "iana"
    },
    	"application/gml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"gml"
    	]
    },
    	"application/gpx+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"gpx"
    	]
    },
    	"application/gxf": {
    	source: "apache",
    	extensions: [
    		"gxf"
    	]
    },
    	"application/gzip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"gz"
    	]
    },
    	"application/h224": {
    	source: "iana"
    },
    	"application/held+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/hjson": {
    	extensions: [
    		"hjson"
    	]
    },
    	"application/http": {
    	source: "iana"
    },
    	"application/hyperstudio": {
    	source: "iana",
    	extensions: [
    		"stk"
    	]
    },
    	"application/ibe-key-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/ibe-pkg-reply+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/ibe-pp-data": {
    	source: "iana"
    },
    	"application/iges": {
    	source: "iana"
    },
    	"application/im-iscomposing+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/index": {
    	source: "iana"
    },
    	"application/index.cmd": {
    	source: "iana"
    },
    	"application/index.obj": {
    	source: "iana"
    },
    	"application/index.response": {
    	source: "iana"
    },
    	"application/index.vnd": {
    	source: "iana"
    },
    	"application/inkml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ink",
    		"inkml"
    	]
    },
    	"application/iotp": {
    	source: "iana"
    },
    	"application/ipfix": {
    	source: "iana",
    	extensions: [
    		"ipfix"
    	]
    },
    	"application/ipp": {
    	source: "iana"
    },
    	"application/isup": {
    	source: "iana"
    },
    	"application/its+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"its"
    	]
    },
    	"application/java-archive": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"jar",
    		"war",
    		"ear"
    	]
    },
    	"application/java-serialized-object": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"ser"
    	]
    },
    	"application/java-vm": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"class"
    	]
    },
    	"application/javascript": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"js",
    		"mjs"
    	]
    },
    	"application/jf2feed+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/jose": {
    	source: "iana"
    },
    	"application/jose+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/jrd+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/jscalendar+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/json": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"json",
    		"map"
    	]
    },
    	"application/json-patch+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/json-seq": {
    	source: "iana"
    },
    	"application/json5": {
    	extensions: [
    		"json5"
    	]
    },
    	"application/jsonml+json": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"jsonml"
    	]
    },
    	"application/jwk+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/jwk-set+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/jwt": {
    	source: "iana"
    },
    	"application/kpml-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/kpml-response+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/ld+json": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"jsonld"
    	]
    },
    	"application/lgr+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"lgr"
    	]
    },
    	"application/link-format": {
    	source: "iana"
    },
    	"application/load-control+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/lost+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"lostxml"
    	]
    },
    	"application/lostsync+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/lpf+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/lxf": {
    	source: "iana"
    },
    	"application/mac-binhex40": {
    	source: "iana",
    	extensions: [
    		"hqx"
    	]
    },
    	"application/mac-compactpro": {
    	source: "apache",
    	extensions: [
    		"cpt"
    	]
    },
    	"application/macwriteii": {
    	source: "iana"
    },
    	"application/mads+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mads"
    	]
    },
    	"application/manifest+json": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"webmanifest"
    	]
    },
    	"application/marc": {
    	source: "iana",
    	extensions: [
    		"mrc"
    	]
    },
    	"application/marcxml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mrcx"
    	]
    },
    	"application/mathematica": {
    	source: "iana",
    	extensions: [
    		"ma",
    		"nb",
    		"mb"
    	]
    },
    	"application/mathml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mathml"
    	]
    },
    	"application/mathml-content+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mathml-presentation+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-associated-procedure-description+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-deregister+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-envelope+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-msk+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-msk-response+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-protection-description+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-reception-report+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-register+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-register-response+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-schedule+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbms-user-service-description+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mbox": {
    	source: "iana",
    	extensions: [
    		"mbox"
    	]
    },
    	"application/media-policy-dataset+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mpf"
    	]
    },
    	"application/media_control+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mediaservercontrol+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mscml"
    	]
    },
    	"application/merge-patch+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/metalink+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"metalink"
    	]
    },
    	"application/metalink4+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"meta4"
    	]
    },
    	"application/mets+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mets"
    	]
    },
    	"application/mf4": {
    	source: "iana"
    },
    	"application/mikey": {
    	source: "iana"
    },
    	"application/mipc": {
    	source: "iana"
    },
    	"application/missing-blocks+cbor-seq": {
    	source: "iana"
    },
    	"application/mmt-aei+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"maei"
    	]
    },
    	"application/mmt-usd+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"musd"
    	]
    },
    	"application/mods+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mods"
    	]
    },
    	"application/moss-keys": {
    	source: "iana"
    },
    	"application/moss-signature": {
    	source: "iana"
    },
    	"application/mosskey-data": {
    	source: "iana"
    },
    	"application/mosskey-request": {
    	source: "iana"
    },
    	"application/mp21": {
    	source: "iana",
    	extensions: [
    		"m21",
    		"mp21"
    	]
    },
    	"application/mp4": {
    	source: "iana",
    	extensions: [
    		"mp4s",
    		"m4p"
    	]
    },
    	"application/mpeg4-generic": {
    	source: "iana"
    },
    	"application/mpeg4-iod": {
    	source: "iana"
    },
    	"application/mpeg4-iod-xmt": {
    	source: "iana"
    },
    	"application/mrb-consumer+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/mrb-publish+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/msc-ivr+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/msc-mixer+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/msword": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"doc",
    		"dot"
    	]
    },
    	"application/mud+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/multipart-core": {
    	source: "iana"
    },
    	"application/mxf": {
    	source: "iana",
    	extensions: [
    		"mxf"
    	]
    },
    	"application/n-quads": {
    	source: "iana",
    	extensions: [
    		"nq"
    	]
    },
    	"application/n-triples": {
    	source: "iana",
    	extensions: [
    		"nt"
    	]
    },
    	"application/nasdata": {
    	source: "iana"
    },
    	"application/news-checkgroups": {
    	source: "iana",
    	charset: "US-ASCII"
    },
    	"application/news-groupinfo": {
    	source: "iana",
    	charset: "US-ASCII"
    },
    	"application/news-transmission": {
    	source: "iana"
    },
    	"application/nlsml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/node": {
    	source: "iana",
    	extensions: [
    		"cjs"
    	]
    },
    	"application/nss": {
    	source: "iana"
    },
    	"application/oauth-authz-req+jwt": {
    	source: "iana"
    },
    	"application/oblivious-dns-message": {
    	source: "iana"
    },
    	"application/ocsp-request": {
    	source: "iana"
    },
    	"application/ocsp-response": {
    	source: "iana"
    },
    	"application/octet-stream": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"bin",
    		"dms",
    		"lrf",
    		"mar",
    		"so",
    		"dist",
    		"distz",
    		"pkg",
    		"bpk",
    		"dump",
    		"elc",
    		"deploy",
    		"exe",
    		"dll",
    		"deb",
    		"dmg",
    		"iso",
    		"img",
    		"msi",
    		"msp",
    		"msm",
    		"buffer"
    	]
    },
    	"application/oda": {
    	source: "iana",
    	extensions: [
    		"oda"
    	]
    },
    	"application/odm+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/odx": {
    	source: "iana"
    },
    	"application/oebps-package+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"opf"
    	]
    },
    	"application/ogg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"ogx"
    	]
    },
    	"application/omdoc+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"omdoc"
    	]
    },
    	"application/onenote": {
    	source: "apache",
    	extensions: [
    		"onetoc",
    		"onetoc2",
    		"onetmp",
    		"onepkg"
    	]
    },
    	"application/opc-nodeset+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/oscore": {
    	source: "iana"
    },
    	"application/oxps": {
    	source: "iana",
    	extensions: [
    		"oxps"
    	]
    },
    	"application/p21": {
    	source: "iana"
    },
    	"application/p21+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/p2p-overlay+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"relo"
    	]
    },
    	"application/parityfec": {
    	source: "iana"
    },
    	"application/passport": {
    	source: "iana"
    },
    	"application/patch-ops-error+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xer"
    	]
    },
    	"application/pdf": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"pdf"
    	]
    },
    	"application/pdx": {
    	source: "iana"
    },
    	"application/pem-certificate-chain": {
    	source: "iana"
    },
    	"application/pgp-encrypted": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"pgp"
    	]
    },
    	"application/pgp-keys": {
    	source: "iana",
    	extensions: [
    		"asc"
    	]
    },
    	"application/pgp-signature": {
    	source: "iana",
    	extensions: [
    		"asc",
    		"sig"
    	]
    },
    	"application/pics-rules": {
    	source: "apache",
    	extensions: [
    		"prf"
    	]
    },
    	"application/pidf+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/pidf-diff+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/pkcs10": {
    	source: "iana",
    	extensions: [
    		"p10"
    	]
    },
    	"application/pkcs12": {
    	source: "iana"
    },
    	"application/pkcs7-mime": {
    	source: "iana",
    	extensions: [
    		"p7m",
    		"p7c"
    	]
    },
    	"application/pkcs7-signature": {
    	source: "iana",
    	extensions: [
    		"p7s"
    	]
    },
    	"application/pkcs8": {
    	source: "iana",
    	extensions: [
    		"p8"
    	]
    },
    	"application/pkcs8-encrypted": {
    	source: "iana"
    },
    	"application/pkix-attr-cert": {
    	source: "iana",
    	extensions: [
    		"ac"
    	]
    },
    	"application/pkix-cert": {
    	source: "iana",
    	extensions: [
    		"cer"
    	]
    },
    	"application/pkix-crl": {
    	source: "iana",
    	extensions: [
    		"crl"
    	]
    },
    	"application/pkix-pkipath": {
    	source: "iana",
    	extensions: [
    		"pkipath"
    	]
    },
    	"application/pkixcmp": {
    	source: "iana",
    	extensions: [
    		"pki"
    	]
    },
    	"application/pls+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"pls"
    	]
    },
    	"application/poc-settings+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/postscript": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ai",
    		"eps",
    		"ps"
    	]
    },
    	"application/ppsp-tracker+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/problem+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/problem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/provenance+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"provx"
    	]
    },
    	"application/prs.alvestrand.titrax-sheet": {
    	source: "iana"
    },
    	"application/prs.cww": {
    	source: "iana",
    	extensions: [
    		"cww"
    	]
    },
    	"application/prs.cyn": {
    	source: "iana",
    	charset: "7-BIT"
    },
    	"application/prs.hpub+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/prs.nprend": {
    	source: "iana"
    },
    	"application/prs.plucker": {
    	source: "iana"
    },
    	"application/prs.rdf-xml-crypt": {
    	source: "iana"
    },
    	"application/prs.xsf+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/pskc+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"pskcxml"
    	]
    },
    	"application/pvd+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/qsig": {
    	source: "iana"
    },
    	"application/raml+yaml": {
    	compressible: true,
    	extensions: [
    		"raml"
    	]
    },
    	"application/raptorfec": {
    	source: "iana"
    },
    	"application/rdap+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/rdf+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rdf",
    		"owl"
    	]
    },
    	"application/reginfo+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rif"
    	]
    },
    	"application/relax-ng-compact-syntax": {
    	source: "iana",
    	extensions: [
    		"rnc"
    	]
    },
    	"application/remote-printing": {
    	source: "iana"
    },
    	"application/reputon+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/resource-lists+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rl"
    	]
    },
    	"application/resource-lists-diff+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rld"
    	]
    },
    	"application/rfc+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/riscos": {
    	source: "iana"
    },
    	"application/rlmi+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/rls-services+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rs"
    	]
    },
    	"application/route-apd+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rapd"
    	]
    },
    	"application/route-s-tsid+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"sls"
    	]
    },
    	"application/route-usd+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rusd"
    	]
    },
    	"application/rpki-ghostbusters": {
    	source: "iana",
    	extensions: [
    		"gbr"
    	]
    },
    	"application/rpki-manifest": {
    	source: "iana",
    	extensions: [
    		"mft"
    	]
    },
    	"application/rpki-publication": {
    	source: "iana"
    },
    	"application/rpki-roa": {
    	source: "iana",
    	extensions: [
    		"roa"
    	]
    },
    	"application/rpki-updown": {
    	source: "iana"
    },
    	"application/rsd+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"rsd"
    	]
    },
    	"application/rss+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"rss"
    	]
    },
    	"application/rtf": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rtf"
    	]
    },
    	"application/rtploopback": {
    	source: "iana"
    },
    	"application/rtx": {
    	source: "iana"
    },
    	"application/samlassertion+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/samlmetadata+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/sarif+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/sarif-external-properties+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/sbe": {
    	source: "iana"
    },
    	"application/sbml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"sbml"
    	]
    },
    	"application/scaip+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/scim+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/scvp-cv-request": {
    	source: "iana",
    	extensions: [
    		"scq"
    	]
    },
    	"application/scvp-cv-response": {
    	source: "iana",
    	extensions: [
    		"scs"
    	]
    },
    	"application/scvp-vp-request": {
    	source: "iana",
    	extensions: [
    		"spq"
    	]
    },
    	"application/scvp-vp-response": {
    	source: "iana",
    	extensions: [
    		"spp"
    	]
    },
    	"application/sdp": {
    	source: "iana",
    	extensions: [
    		"sdp"
    	]
    },
    	"application/secevent+jwt": {
    	source: "iana"
    },
    	"application/senml+cbor": {
    	source: "iana"
    },
    	"application/senml+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/senml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"senmlx"
    	]
    },
    	"application/senml-etch+cbor": {
    	source: "iana"
    },
    	"application/senml-etch+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/senml-exi": {
    	source: "iana"
    },
    	"application/sensml+cbor": {
    	source: "iana"
    },
    	"application/sensml+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/sensml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"sensmlx"
    	]
    },
    	"application/sensml-exi": {
    	source: "iana"
    },
    	"application/sep+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/sep-exi": {
    	source: "iana"
    },
    	"application/session-info": {
    	source: "iana"
    },
    	"application/set-payment": {
    	source: "iana"
    },
    	"application/set-payment-initiation": {
    	source: "iana",
    	extensions: [
    		"setpay"
    	]
    },
    	"application/set-registration": {
    	source: "iana"
    },
    	"application/set-registration-initiation": {
    	source: "iana",
    	extensions: [
    		"setreg"
    	]
    },
    	"application/sgml": {
    	source: "iana"
    },
    	"application/sgml-open-catalog": {
    	source: "iana"
    },
    	"application/shf+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"shf"
    	]
    },
    	"application/sieve": {
    	source: "iana",
    	extensions: [
    		"siv",
    		"sieve"
    	]
    },
    	"application/simple-filter+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/simple-message-summary": {
    	source: "iana"
    },
    	"application/simplesymbolcontainer": {
    	source: "iana"
    },
    	"application/sipc": {
    	source: "iana"
    },
    	"application/slate": {
    	source: "iana"
    },
    	"application/smil": {
    	source: "iana"
    },
    	"application/smil+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"smi",
    		"smil"
    	]
    },
    	"application/smpte336m": {
    	source: "iana"
    },
    	"application/soap+fastinfoset": {
    	source: "iana"
    },
    	"application/soap+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/sparql-query": {
    	source: "iana",
    	extensions: [
    		"rq"
    	]
    },
    	"application/sparql-results+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"srx"
    	]
    },
    	"application/spdx+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/spirits-event+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/sql": {
    	source: "iana"
    },
    	"application/srgs": {
    	source: "iana",
    	extensions: [
    		"gram"
    	]
    },
    	"application/srgs+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"grxml"
    	]
    },
    	"application/sru+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"sru"
    	]
    },
    	"application/ssdl+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"ssdl"
    	]
    },
    	"application/ssml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ssml"
    	]
    },
    	"application/stix+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/swid+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"swidtag"
    	]
    },
    	"application/tamp-apex-update": {
    	source: "iana"
    },
    	"application/tamp-apex-update-confirm": {
    	source: "iana"
    },
    	"application/tamp-community-update": {
    	source: "iana"
    },
    	"application/tamp-community-update-confirm": {
    	source: "iana"
    },
    	"application/tamp-error": {
    	source: "iana"
    },
    	"application/tamp-sequence-adjust": {
    	source: "iana"
    },
    	"application/tamp-sequence-adjust-confirm": {
    	source: "iana"
    },
    	"application/tamp-status-query": {
    	source: "iana"
    },
    	"application/tamp-status-response": {
    	source: "iana"
    },
    	"application/tamp-update": {
    	source: "iana"
    },
    	"application/tamp-update-confirm": {
    	source: "iana"
    },
    	"application/tar": {
    	compressible: true
    },
    	"application/taxii+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/td+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/tei+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"tei",
    		"teicorpus"
    	]
    },
    	"application/tetra_isi": {
    	source: "iana"
    },
    	"application/thraud+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"tfi"
    	]
    },
    	"application/timestamp-query": {
    	source: "iana"
    },
    	"application/timestamp-reply": {
    	source: "iana"
    },
    	"application/timestamped-data": {
    	source: "iana",
    	extensions: [
    		"tsd"
    	]
    },
    	"application/tlsrpt+gzip": {
    	source: "iana"
    },
    	"application/tlsrpt+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/tnauthlist": {
    	source: "iana"
    },
    	"application/token-introspection+jwt": {
    	source: "iana"
    },
    	"application/toml": {
    	compressible: true,
    	extensions: [
    		"toml"
    	]
    },
    	"application/trickle-ice-sdpfrag": {
    	source: "iana"
    },
    	"application/trig": {
    	source: "iana",
    	extensions: [
    		"trig"
    	]
    },
    	"application/ttml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ttml"
    	]
    },
    	"application/tve-trigger": {
    	source: "iana"
    },
    	"application/tzif": {
    	source: "iana"
    },
    	"application/tzif-leap": {
    	source: "iana"
    },
    	"application/ubjson": {
    	compressible: false,
    	extensions: [
    		"ubj"
    	]
    },
    	"application/ulpfec": {
    	source: "iana"
    },
    	"application/urc-grpsheet+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/urc-ressheet+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rsheet"
    	]
    },
    	"application/urc-targetdesc+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"td"
    	]
    },
    	"application/urc-uisocketdesc+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vcard+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vcard+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vemmi": {
    	source: "iana"
    },
    	"application/vividence.scriptfile": {
    	source: "apache"
    },
    	"application/vnd.1000minds.decision-model+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"1km"
    	]
    },
    	"application/vnd.3gpp-prose+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp-prose-pc3ch+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp-v2x-local-service-information": {
    	source: "iana"
    },
    	"application/vnd.3gpp.5gnas": {
    	source: "iana"
    },
    	"application/vnd.3gpp.access-transfer-events+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.bsf+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.gmop+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.gtpc": {
    	source: "iana"
    },
    	"application/vnd.3gpp.interworking-data": {
    	source: "iana"
    },
    	"application/vnd.3gpp.lpp": {
    	source: "iana"
    },
    	"application/vnd.3gpp.mc-signalling-ear": {
    	source: "iana"
    },
    	"application/vnd.3gpp.mcdata-affiliation-command+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcdata-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcdata-payload": {
    	source: "iana"
    },
    	"application/vnd.3gpp.mcdata-service-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcdata-signalling": {
    	source: "iana"
    },
    	"application/vnd.3gpp.mcdata-ue-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcdata-user-profile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-affiliation-command+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-floor-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-location-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-service-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-signed+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-ue-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-ue-init-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcptt-user-profile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-affiliation-command+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-affiliation-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-location-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-service-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-transmission-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-ue-config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mcvideo-user-profile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.mid-call+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.ngap": {
    	source: "iana"
    },
    	"application/vnd.3gpp.pfcp": {
    	source: "iana"
    },
    	"application/vnd.3gpp.pic-bw-large": {
    	source: "iana",
    	extensions: [
    		"plb"
    	]
    },
    	"application/vnd.3gpp.pic-bw-small": {
    	source: "iana",
    	extensions: [
    		"psb"
    	]
    },
    	"application/vnd.3gpp.pic-bw-var": {
    	source: "iana",
    	extensions: [
    		"pvb"
    	]
    },
    	"application/vnd.3gpp.s1ap": {
    	source: "iana"
    },
    	"application/vnd.3gpp.sms": {
    	source: "iana"
    },
    	"application/vnd.3gpp.sms+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.srvcc-ext+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.srvcc-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.state-and-event-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp.ussd+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp2.bcmcsinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.3gpp2.sms": {
    	source: "iana"
    },
    	"application/vnd.3gpp2.tcap": {
    	source: "iana",
    	extensions: [
    		"tcap"
    	]
    },
    	"application/vnd.3lightssoftware.imagescal": {
    	source: "iana"
    },
    	"application/vnd.3m.post-it-notes": {
    	source: "iana",
    	extensions: [
    		"pwn"
    	]
    },
    	"application/vnd.accpac.simply.aso": {
    	source: "iana",
    	extensions: [
    		"aso"
    	]
    },
    	"application/vnd.accpac.simply.imp": {
    	source: "iana",
    	extensions: [
    		"imp"
    	]
    },
    	"application/vnd.acucobol": {
    	source: "iana",
    	extensions: [
    		"acu"
    	]
    },
    	"application/vnd.acucorp": {
    	source: "iana",
    	extensions: [
    		"atc",
    		"acutc"
    	]
    },
    	"application/vnd.adobe.air-application-installer-package+zip": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"air"
    	]
    },
    	"application/vnd.adobe.flash.movie": {
    	source: "iana"
    },
    	"application/vnd.adobe.formscentral.fcdt": {
    	source: "iana",
    	extensions: [
    		"fcdt"
    	]
    },
    	"application/vnd.adobe.fxp": {
    	source: "iana",
    	extensions: [
    		"fxp",
    		"fxpl"
    	]
    },
    	"application/vnd.adobe.partial-upload": {
    	source: "iana"
    },
    	"application/vnd.adobe.xdp+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xdp"
    	]
    },
    	"application/vnd.adobe.xfdf": {
    	source: "iana",
    	extensions: [
    		"xfdf"
    	]
    },
    	"application/vnd.aether.imp": {
    	source: "iana"
    },
    	"application/vnd.afpc.afplinedata": {
    	source: "iana"
    },
    	"application/vnd.afpc.afplinedata-pagedef": {
    	source: "iana"
    },
    	"application/vnd.afpc.cmoca-cmresource": {
    	source: "iana"
    },
    	"application/vnd.afpc.foca-charset": {
    	source: "iana"
    },
    	"application/vnd.afpc.foca-codedfont": {
    	source: "iana"
    },
    	"application/vnd.afpc.foca-codepage": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-cmtable": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-formdef": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-mediummap": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-objectcontainer": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-overlay": {
    	source: "iana"
    },
    	"application/vnd.afpc.modca-pagesegment": {
    	source: "iana"
    },
    	"application/vnd.age": {
    	source: "iana",
    	extensions: [
    		"age"
    	]
    },
    	"application/vnd.ah-barcode": {
    	source: "iana"
    },
    	"application/vnd.ahead.space": {
    	source: "iana",
    	extensions: [
    		"ahead"
    	]
    },
    	"application/vnd.airzip.filesecure.azf": {
    	source: "iana",
    	extensions: [
    		"azf"
    	]
    },
    	"application/vnd.airzip.filesecure.azs": {
    	source: "iana",
    	extensions: [
    		"azs"
    	]
    },
    	"application/vnd.amadeus+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.amazon.ebook": {
    	source: "apache",
    	extensions: [
    		"azw"
    	]
    },
    	"application/vnd.amazon.mobi8-ebook": {
    	source: "iana"
    },
    	"application/vnd.americandynamics.acc": {
    	source: "iana",
    	extensions: [
    		"acc"
    	]
    },
    	"application/vnd.amiga.ami": {
    	source: "iana",
    	extensions: [
    		"ami"
    	]
    },
    	"application/vnd.amundsen.maze+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.android.ota": {
    	source: "iana"
    },
    	"application/vnd.android.package-archive": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"apk"
    	]
    },
    	"application/vnd.anki": {
    	source: "iana"
    },
    	"application/vnd.anser-web-certificate-issue-initiation": {
    	source: "iana",
    	extensions: [
    		"cii"
    	]
    },
    	"application/vnd.anser-web-funds-transfer-initiation": {
    	source: "apache",
    	extensions: [
    		"fti"
    	]
    },
    	"application/vnd.antix.game-component": {
    	source: "iana",
    	extensions: [
    		"atx"
    	]
    },
    	"application/vnd.apache.arrow.file": {
    	source: "iana"
    },
    	"application/vnd.apache.arrow.stream": {
    	source: "iana"
    },
    	"application/vnd.apache.thrift.binary": {
    	source: "iana"
    },
    	"application/vnd.apache.thrift.compact": {
    	source: "iana"
    },
    	"application/vnd.apache.thrift.json": {
    	source: "iana"
    },
    	"application/vnd.api+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.aplextor.warrp+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.apothekende.reservation+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.apple.installer+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mpkg"
    	]
    },
    	"application/vnd.apple.keynote": {
    	source: "iana",
    	extensions: [
    		"key"
    	]
    },
    	"application/vnd.apple.mpegurl": {
    	source: "iana",
    	extensions: [
    		"m3u8"
    	]
    },
    	"application/vnd.apple.numbers": {
    	source: "iana",
    	extensions: [
    		"numbers"
    	]
    },
    	"application/vnd.apple.pages": {
    	source: "iana",
    	extensions: [
    		"pages"
    	]
    },
    	"application/vnd.apple.pkpass": {
    	compressible: false,
    	extensions: [
    		"pkpass"
    	]
    },
    	"application/vnd.arastra.swi": {
    	source: "iana"
    },
    	"application/vnd.aristanetworks.swi": {
    	source: "iana",
    	extensions: [
    		"swi"
    	]
    },
    	"application/vnd.artisan+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.artsquare": {
    	source: "iana"
    },
    	"application/vnd.astraea-software.iota": {
    	source: "iana",
    	extensions: [
    		"iota"
    	]
    },
    	"application/vnd.audiograph": {
    	source: "iana",
    	extensions: [
    		"aep"
    	]
    },
    	"application/vnd.autopackage": {
    	source: "iana"
    },
    	"application/vnd.avalon+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.avistar+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.balsamiq.bmml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"bmml"
    	]
    },
    	"application/vnd.balsamiq.bmpr": {
    	source: "iana"
    },
    	"application/vnd.banana-accounting": {
    	source: "iana"
    },
    	"application/vnd.bbf.usp.error": {
    	source: "iana"
    },
    	"application/vnd.bbf.usp.msg": {
    	source: "iana"
    },
    	"application/vnd.bbf.usp.msg+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.bekitzur-stech+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.bint.med-content": {
    	source: "iana"
    },
    	"application/vnd.biopax.rdf+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.blink-idb-value-wrapper": {
    	source: "iana"
    },
    	"application/vnd.blueice.multipass": {
    	source: "iana",
    	extensions: [
    		"mpm"
    	]
    },
    	"application/vnd.bluetooth.ep.oob": {
    	source: "iana"
    },
    	"application/vnd.bluetooth.le.oob": {
    	source: "iana"
    },
    	"application/vnd.bmi": {
    	source: "iana",
    	extensions: [
    		"bmi"
    	]
    },
    	"application/vnd.bpf": {
    	source: "iana"
    },
    	"application/vnd.bpf3": {
    	source: "iana"
    },
    	"application/vnd.businessobjects": {
    	source: "iana",
    	extensions: [
    		"rep"
    	]
    },
    	"application/vnd.byu.uapi+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cab-jscript": {
    	source: "iana"
    },
    	"application/vnd.canon-cpdl": {
    	source: "iana"
    },
    	"application/vnd.canon-lips": {
    	source: "iana"
    },
    	"application/vnd.capasystems-pg+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cendio.thinlinc.clientconf": {
    	source: "iana"
    },
    	"application/vnd.century-systems.tcp_stream": {
    	source: "iana"
    },
    	"application/vnd.chemdraw+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"cdxml"
    	]
    },
    	"application/vnd.chess-pgn": {
    	source: "iana"
    },
    	"application/vnd.chipnuts.karaoke-mmd": {
    	source: "iana",
    	extensions: [
    		"mmd"
    	]
    },
    	"application/vnd.ciedi": {
    	source: "iana"
    },
    	"application/vnd.cinderella": {
    	source: "iana",
    	extensions: [
    		"cdy"
    	]
    },
    	"application/vnd.cirpack.isdn-ext": {
    	source: "iana"
    },
    	"application/vnd.citationstyles.style+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"csl"
    	]
    },
    	"application/vnd.claymore": {
    	source: "iana",
    	extensions: [
    		"cla"
    	]
    },
    	"application/vnd.cloanto.rp9": {
    	source: "iana",
    	extensions: [
    		"rp9"
    	]
    },
    	"application/vnd.clonk.c4group": {
    	source: "iana",
    	extensions: [
    		"c4g",
    		"c4d",
    		"c4f",
    		"c4p",
    		"c4u"
    	]
    },
    	"application/vnd.cluetrust.cartomobile-config": {
    	source: "iana",
    	extensions: [
    		"c11amc"
    	]
    },
    	"application/vnd.cluetrust.cartomobile-config-pkg": {
    	source: "iana",
    	extensions: [
    		"c11amz"
    	]
    },
    	"application/vnd.coffeescript": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.document": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.document-template": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.presentation": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.presentation-template": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.spreadsheet": {
    	source: "iana"
    },
    	"application/vnd.collabio.xodocuments.spreadsheet-template": {
    	source: "iana"
    },
    	"application/vnd.collection+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.collection.doc+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.collection.next+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.comicbook+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.comicbook-rar": {
    	source: "iana"
    },
    	"application/vnd.commerce-battelle": {
    	source: "iana"
    },
    	"application/vnd.commonspace": {
    	source: "iana",
    	extensions: [
    		"csp"
    	]
    },
    	"application/vnd.contact.cmsg": {
    	source: "iana",
    	extensions: [
    		"cdbcmsg"
    	]
    },
    	"application/vnd.coreos.ignition+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cosmocaller": {
    	source: "iana",
    	extensions: [
    		"cmc"
    	]
    },
    	"application/vnd.crick.clicker": {
    	source: "iana",
    	extensions: [
    		"clkx"
    	]
    },
    	"application/vnd.crick.clicker.keyboard": {
    	source: "iana",
    	extensions: [
    		"clkk"
    	]
    },
    	"application/vnd.crick.clicker.palette": {
    	source: "iana",
    	extensions: [
    		"clkp"
    	]
    },
    	"application/vnd.crick.clicker.template": {
    	source: "iana",
    	extensions: [
    		"clkt"
    	]
    },
    	"application/vnd.crick.clicker.wordbank": {
    	source: "iana",
    	extensions: [
    		"clkw"
    	]
    },
    	"application/vnd.criticaltools.wbs+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wbs"
    	]
    },
    	"application/vnd.cryptii.pipe+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.crypto-shade-file": {
    	source: "iana"
    },
    	"application/vnd.cryptomator.encrypted": {
    	source: "iana"
    },
    	"application/vnd.cryptomator.vault": {
    	source: "iana"
    },
    	"application/vnd.ctc-posml": {
    	source: "iana",
    	extensions: [
    		"pml"
    	]
    },
    	"application/vnd.ctct.ws+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cups-pdf": {
    	source: "iana"
    },
    	"application/vnd.cups-postscript": {
    	source: "iana"
    },
    	"application/vnd.cups-ppd": {
    	source: "iana",
    	extensions: [
    		"ppd"
    	]
    },
    	"application/vnd.cups-raster": {
    	source: "iana"
    },
    	"application/vnd.cups-raw": {
    	source: "iana"
    },
    	"application/vnd.curl": {
    	source: "iana"
    },
    	"application/vnd.curl.car": {
    	source: "apache",
    	extensions: [
    		"car"
    	]
    },
    	"application/vnd.curl.pcurl": {
    	source: "apache",
    	extensions: [
    		"pcurl"
    	]
    },
    	"application/vnd.cyan.dean.root+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cybank": {
    	source: "iana"
    },
    	"application/vnd.cyclonedx+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.cyclonedx+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.d2l.coursepackage1p0+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.d3m-dataset": {
    	source: "iana"
    },
    	"application/vnd.d3m-problem": {
    	source: "iana"
    },
    	"application/vnd.dart": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"dart"
    	]
    },
    	"application/vnd.data-vision.rdz": {
    	source: "iana",
    	extensions: [
    		"rdz"
    	]
    },
    	"application/vnd.datapackage+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dataresource+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dbf": {
    	source: "iana",
    	extensions: [
    		"dbf"
    	]
    },
    	"application/vnd.debian.binary-package": {
    	source: "iana"
    },
    	"application/vnd.dece.data": {
    	source: "iana",
    	extensions: [
    		"uvf",
    		"uvvf",
    		"uvd",
    		"uvvd"
    	]
    },
    	"application/vnd.dece.ttml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"uvt",
    		"uvvt"
    	]
    },
    	"application/vnd.dece.unspecified": {
    	source: "iana",
    	extensions: [
    		"uvx",
    		"uvvx"
    	]
    },
    	"application/vnd.dece.zip": {
    	source: "iana",
    	extensions: [
    		"uvz",
    		"uvvz"
    	]
    },
    	"application/vnd.denovo.fcselayout-link": {
    	source: "iana",
    	extensions: [
    		"fe_launch"
    	]
    },
    	"application/vnd.desmume.movie": {
    	source: "iana"
    },
    	"application/vnd.dir-bi.plate-dl-nosuffix": {
    	source: "iana"
    },
    	"application/vnd.dm.delegation+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dna": {
    	source: "iana",
    	extensions: [
    		"dna"
    	]
    },
    	"application/vnd.document+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dolby.mlp": {
    	source: "apache",
    	extensions: [
    		"mlp"
    	]
    },
    	"application/vnd.dolby.mobile.1": {
    	source: "iana"
    },
    	"application/vnd.dolby.mobile.2": {
    	source: "iana"
    },
    	"application/vnd.doremir.scorecloud-binary-document": {
    	source: "iana"
    },
    	"application/vnd.dpgraph": {
    	source: "iana",
    	extensions: [
    		"dpg"
    	]
    },
    	"application/vnd.dreamfactory": {
    	source: "iana",
    	extensions: [
    		"dfac"
    	]
    },
    	"application/vnd.drive+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ds-keypoint": {
    	source: "apache",
    	extensions: [
    		"kpxx"
    	]
    },
    	"application/vnd.dtg.local": {
    	source: "iana"
    },
    	"application/vnd.dtg.local.flash": {
    	source: "iana"
    },
    	"application/vnd.dtg.local.html": {
    	source: "iana"
    },
    	"application/vnd.dvb.ait": {
    	source: "iana",
    	extensions: [
    		"ait"
    	]
    },
    	"application/vnd.dvb.dvbisl+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.dvbj": {
    	source: "iana"
    },
    	"application/vnd.dvb.esgcontainer": {
    	source: "iana"
    },
    	"application/vnd.dvb.ipdcdftnotifaccess": {
    	source: "iana"
    },
    	"application/vnd.dvb.ipdcesgaccess": {
    	source: "iana"
    },
    	"application/vnd.dvb.ipdcesgaccess2": {
    	source: "iana"
    },
    	"application/vnd.dvb.ipdcesgpdd": {
    	source: "iana"
    },
    	"application/vnd.dvb.ipdcroaming": {
    	source: "iana"
    },
    	"application/vnd.dvb.iptv.alfec-base": {
    	source: "iana"
    },
    	"application/vnd.dvb.iptv.alfec-enhancement": {
    	source: "iana"
    },
    	"application/vnd.dvb.notif-aggregate-root+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-container+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-generic+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-ia-msglist+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-ia-registration-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-ia-registration-response+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.notif-init+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.dvb.pfr": {
    	source: "iana"
    },
    	"application/vnd.dvb.service": {
    	source: "iana",
    	extensions: [
    		"svc"
    	]
    },
    	"application/vnd.dxr": {
    	source: "iana"
    },
    	"application/vnd.dynageo": {
    	source: "iana",
    	extensions: [
    		"geo"
    	]
    },
    	"application/vnd.dzr": {
    	source: "iana"
    },
    	"application/vnd.easykaraoke.cdgdownload": {
    	source: "iana"
    },
    	"application/vnd.ecdis-update": {
    	source: "iana"
    },
    	"application/vnd.ecip.rlp": {
    	source: "iana"
    },
    	"application/vnd.eclipse.ditto+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ecowin.chart": {
    	source: "iana",
    	extensions: [
    		"mag"
    	]
    },
    	"application/vnd.ecowin.filerequest": {
    	source: "iana"
    },
    	"application/vnd.ecowin.fileupdate": {
    	source: "iana"
    },
    	"application/vnd.ecowin.series": {
    	source: "iana"
    },
    	"application/vnd.ecowin.seriesrequest": {
    	source: "iana"
    },
    	"application/vnd.ecowin.seriesupdate": {
    	source: "iana"
    },
    	"application/vnd.efi.img": {
    	source: "iana"
    },
    	"application/vnd.efi.iso": {
    	source: "iana"
    },
    	"application/vnd.emclient.accessrequest+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.enliven": {
    	source: "iana",
    	extensions: [
    		"nml"
    	]
    },
    	"application/vnd.enphase.envoy": {
    	source: "iana"
    },
    	"application/vnd.eprints.data+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.epson.esf": {
    	source: "iana",
    	extensions: [
    		"esf"
    	]
    },
    	"application/vnd.epson.msf": {
    	source: "iana",
    	extensions: [
    		"msf"
    	]
    },
    	"application/vnd.epson.quickanime": {
    	source: "iana",
    	extensions: [
    		"qam"
    	]
    },
    	"application/vnd.epson.salt": {
    	source: "iana",
    	extensions: [
    		"slt"
    	]
    },
    	"application/vnd.epson.ssf": {
    	source: "iana",
    	extensions: [
    		"ssf"
    	]
    },
    	"application/vnd.ericsson.quickcall": {
    	source: "iana"
    },
    	"application/vnd.espass-espass+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.eszigno3+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"es3",
    		"et3"
    	]
    },
    	"application/vnd.etsi.aoc+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.asic-e+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.etsi.asic-s+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.etsi.cug+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvcommand+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvdiscovery+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvprofile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvsad-bc+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvsad-cod+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvsad-npvr+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvservice+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvsync+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.iptvueprofile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.mcid+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.mheg5": {
    	source: "iana"
    },
    	"application/vnd.etsi.overload-control-policy-dataset+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.pstn+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.sci+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.simservs+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.timestamp-token": {
    	source: "iana"
    },
    	"application/vnd.etsi.tsl+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.etsi.tsl.der": {
    	source: "iana"
    },
    	"application/vnd.eu.kasparian.car+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.eudora.data": {
    	source: "iana"
    },
    	"application/vnd.evolv.ecig.profile": {
    	source: "iana"
    },
    	"application/vnd.evolv.ecig.settings": {
    	source: "iana"
    },
    	"application/vnd.evolv.ecig.theme": {
    	source: "iana"
    },
    	"application/vnd.exstream-empower+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.exstream-package": {
    	source: "iana"
    },
    	"application/vnd.ezpix-album": {
    	source: "iana",
    	extensions: [
    		"ez2"
    	]
    },
    	"application/vnd.ezpix-package": {
    	source: "iana",
    	extensions: [
    		"ez3"
    	]
    },
    	"application/vnd.f-secure.mobile": {
    	source: "iana"
    },
    	"application/vnd.familysearch.gedcom+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.fastcopy-disk-image": {
    	source: "iana"
    },
    	"application/vnd.fdf": {
    	source: "iana",
    	extensions: [
    		"fdf"
    	]
    },
    	"application/vnd.fdsn.mseed": {
    	source: "iana",
    	extensions: [
    		"mseed"
    	]
    },
    	"application/vnd.fdsn.seed": {
    	source: "iana",
    	extensions: [
    		"seed",
    		"dataless"
    	]
    },
    	"application/vnd.ffsns": {
    	source: "iana"
    },
    	"application/vnd.ficlab.flb+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.filmit.zfc": {
    	source: "iana"
    },
    	"application/vnd.fints": {
    	source: "iana"
    },
    	"application/vnd.firemonkeys.cloudcell": {
    	source: "iana"
    },
    	"application/vnd.flographit": {
    	source: "iana",
    	extensions: [
    		"gph"
    	]
    },
    	"application/vnd.fluxtime.clip": {
    	source: "iana",
    	extensions: [
    		"ftc"
    	]
    },
    	"application/vnd.font-fontforge-sfd": {
    	source: "iana"
    },
    	"application/vnd.framemaker": {
    	source: "iana",
    	extensions: [
    		"fm",
    		"frame",
    		"maker",
    		"book"
    	]
    },
    	"application/vnd.frogans.fnc": {
    	source: "iana",
    	extensions: [
    		"fnc"
    	]
    },
    	"application/vnd.frogans.ltf": {
    	source: "iana",
    	extensions: [
    		"ltf"
    	]
    },
    	"application/vnd.fsc.weblaunch": {
    	source: "iana",
    	extensions: [
    		"fsc"
    	]
    },
    	"application/vnd.fujifilm.fb.docuworks": {
    	source: "iana"
    },
    	"application/vnd.fujifilm.fb.docuworks.binder": {
    	source: "iana"
    },
    	"application/vnd.fujifilm.fb.docuworks.container": {
    	source: "iana"
    },
    	"application/vnd.fujifilm.fb.jfi+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.fujitsu.oasys": {
    	source: "iana",
    	extensions: [
    		"oas"
    	]
    },
    	"application/vnd.fujitsu.oasys2": {
    	source: "iana",
    	extensions: [
    		"oa2"
    	]
    },
    	"application/vnd.fujitsu.oasys3": {
    	source: "iana",
    	extensions: [
    		"oa3"
    	]
    },
    	"application/vnd.fujitsu.oasysgp": {
    	source: "iana",
    	extensions: [
    		"fg5"
    	]
    },
    	"application/vnd.fujitsu.oasysprs": {
    	source: "iana",
    	extensions: [
    		"bh2"
    	]
    },
    	"application/vnd.fujixerox.art-ex": {
    	source: "iana"
    },
    	"application/vnd.fujixerox.art4": {
    	source: "iana"
    },
    	"application/vnd.fujixerox.ddd": {
    	source: "iana",
    	extensions: [
    		"ddd"
    	]
    },
    	"application/vnd.fujixerox.docuworks": {
    	source: "iana",
    	extensions: [
    		"xdw"
    	]
    },
    	"application/vnd.fujixerox.docuworks.binder": {
    	source: "iana",
    	extensions: [
    		"xbd"
    	]
    },
    	"application/vnd.fujixerox.docuworks.container": {
    	source: "iana"
    },
    	"application/vnd.fujixerox.hbpl": {
    	source: "iana"
    },
    	"application/vnd.fut-misnet": {
    	source: "iana"
    },
    	"application/vnd.futoin+cbor": {
    	source: "iana"
    },
    	"application/vnd.futoin+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.fuzzysheet": {
    	source: "iana",
    	extensions: [
    		"fzs"
    	]
    },
    	"application/vnd.genomatix.tuxedo": {
    	source: "iana",
    	extensions: [
    		"txd"
    	]
    },
    	"application/vnd.gentics.grd+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.geo+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.geocube+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.geogebra.file": {
    	source: "iana",
    	extensions: [
    		"ggb"
    	]
    },
    	"application/vnd.geogebra.slides": {
    	source: "iana"
    },
    	"application/vnd.geogebra.tool": {
    	source: "iana",
    	extensions: [
    		"ggt"
    	]
    },
    	"application/vnd.geometry-explorer": {
    	source: "iana",
    	extensions: [
    		"gex",
    		"gre"
    	]
    },
    	"application/vnd.geonext": {
    	source: "iana",
    	extensions: [
    		"gxt"
    	]
    },
    	"application/vnd.geoplan": {
    	source: "iana",
    	extensions: [
    		"g2w"
    	]
    },
    	"application/vnd.geospace": {
    	source: "iana",
    	extensions: [
    		"g3w"
    	]
    },
    	"application/vnd.gerber": {
    	source: "iana"
    },
    	"application/vnd.globalplatform.card-content-mgt": {
    	source: "iana"
    },
    	"application/vnd.globalplatform.card-content-mgt-response": {
    	source: "iana"
    },
    	"application/vnd.gmx": {
    	source: "iana",
    	extensions: [
    		"gmx"
    	]
    },
    	"application/vnd.google-apps.document": {
    	compressible: false,
    	extensions: [
    		"gdoc"
    	]
    },
    	"application/vnd.google-apps.presentation": {
    	compressible: false,
    	extensions: [
    		"gslides"
    	]
    },
    	"application/vnd.google-apps.spreadsheet": {
    	compressible: false,
    	extensions: [
    		"gsheet"
    	]
    },
    	"application/vnd.google-earth.kml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"kml"
    	]
    },
    	"application/vnd.google-earth.kmz": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"kmz"
    	]
    },
    	"application/vnd.gov.sk.e-form+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.gov.sk.e-form+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.gov.sk.xmldatacontainer+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.grafeq": {
    	source: "iana",
    	extensions: [
    		"gqf",
    		"gqs"
    	]
    },
    	"application/vnd.gridmp": {
    	source: "iana"
    },
    	"application/vnd.groove-account": {
    	source: "iana",
    	extensions: [
    		"gac"
    	]
    },
    	"application/vnd.groove-help": {
    	source: "iana",
    	extensions: [
    		"ghf"
    	]
    },
    	"application/vnd.groove-identity-message": {
    	source: "iana",
    	extensions: [
    		"gim"
    	]
    },
    	"application/vnd.groove-injector": {
    	source: "iana",
    	extensions: [
    		"grv"
    	]
    },
    	"application/vnd.groove-tool-message": {
    	source: "iana",
    	extensions: [
    		"gtm"
    	]
    },
    	"application/vnd.groove-tool-template": {
    	source: "iana",
    	extensions: [
    		"tpl"
    	]
    },
    	"application/vnd.groove-vcard": {
    	source: "iana",
    	extensions: [
    		"vcg"
    	]
    },
    	"application/vnd.hal+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hal+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"hal"
    	]
    },
    	"application/vnd.handheld-entertainment+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"zmm"
    	]
    },
    	"application/vnd.hbci": {
    	source: "iana",
    	extensions: [
    		"hbci"
    	]
    },
    	"application/vnd.hc+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hcl-bireports": {
    	source: "iana"
    },
    	"application/vnd.hdt": {
    	source: "iana"
    },
    	"application/vnd.heroku+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hhe.lesson-player": {
    	source: "iana",
    	extensions: [
    		"les"
    	]
    },
    	"application/vnd.hl7cda+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.hl7v2+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.hp-hpgl": {
    	source: "iana",
    	extensions: [
    		"hpgl"
    	]
    },
    	"application/vnd.hp-hpid": {
    	source: "iana",
    	extensions: [
    		"hpid"
    	]
    },
    	"application/vnd.hp-hps": {
    	source: "iana",
    	extensions: [
    		"hps"
    	]
    },
    	"application/vnd.hp-jlyt": {
    	source: "iana",
    	extensions: [
    		"jlt"
    	]
    },
    	"application/vnd.hp-pcl": {
    	source: "iana",
    	extensions: [
    		"pcl"
    	]
    },
    	"application/vnd.hp-pclxl": {
    	source: "iana",
    	extensions: [
    		"pclxl"
    	]
    },
    	"application/vnd.httphone": {
    	source: "iana"
    },
    	"application/vnd.hydrostatix.sof-data": {
    	source: "iana",
    	extensions: [
    		"sfd-hdstx"
    	]
    },
    	"application/vnd.hyper+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hyper-item+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hyperdrive+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.hzn-3d-crossword": {
    	source: "iana"
    },
    	"application/vnd.ibm.afplinedata": {
    	source: "iana"
    },
    	"application/vnd.ibm.electronic-media": {
    	source: "iana"
    },
    	"application/vnd.ibm.minipay": {
    	source: "iana",
    	extensions: [
    		"mpy"
    	]
    },
    	"application/vnd.ibm.modcap": {
    	source: "iana",
    	extensions: [
    		"afp",
    		"listafp",
    		"list3820"
    	]
    },
    	"application/vnd.ibm.rights-management": {
    	source: "iana",
    	extensions: [
    		"irm"
    	]
    },
    	"application/vnd.ibm.secure-container": {
    	source: "iana",
    	extensions: [
    		"sc"
    	]
    },
    	"application/vnd.iccprofile": {
    	source: "iana",
    	extensions: [
    		"icc",
    		"icm"
    	]
    },
    	"application/vnd.ieee.1905": {
    	source: "iana"
    },
    	"application/vnd.igloader": {
    	source: "iana",
    	extensions: [
    		"igl"
    	]
    },
    	"application/vnd.imagemeter.folder+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.imagemeter.image+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.immervision-ivp": {
    	source: "iana",
    	extensions: [
    		"ivp"
    	]
    },
    	"application/vnd.immervision-ivu": {
    	source: "iana",
    	extensions: [
    		"ivu"
    	]
    },
    	"application/vnd.ims.imsccv1p1": {
    	source: "iana"
    },
    	"application/vnd.ims.imsccv1p2": {
    	source: "iana"
    },
    	"application/vnd.ims.imsccv1p3": {
    	source: "iana"
    },
    	"application/vnd.ims.lis.v2.result+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ims.lti.v2.toolconsumerprofile+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ims.lti.v2.toolproxy+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ims.lti.v2.toolproxy.id+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ims.lti.v2.toolsettings+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ims.lti.v2.toolsettings.simple+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.informedcontrol.rms+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.informix-visionary": {
    	source: "iana"
    },
    	"application/vnd.infotech.project": {
    	source: "iana"
    },
    	"application/vnd.infotech.project+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.innopath.wamp.notification": {
    	source: "iana"
    },
    	"application/vnd.insors.igm": {
    	source: "iana",
    	extensions: [
    		"igm"
    	]
    },
    	"application/vnd.intercon.formnet": {
    	source: "iana",
    	extensions: [
    		"xpw",
    		"xpx"
    	]
    },
    	"application/vnd.intergeo": {
    	source: "iana",
    	extensions: [
    		"i2g"
    	]
    },
    	"application/vnd.intertrust.digibox": {
    	source: "iana"
    },
    	"application/vnd.intertrust.nncp": {
    	source: "iana"
    },
    	"application/vnd.intu.qbo": {
    	source: "iana",
    	extensions: [
    		"qbo"
    	]
    },
    	"application/vnd.intu.qfx": {
    	source: "iana",
    	extensions: [
    		"qfx"
    	]
    },
    	"application/vnd.iptc.g2.catalogitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.conceptitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.knowledgeitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.newsitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.newsmessage+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.packageitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.iptc.g2.planningitem+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ipunplugged.rcprofile": {
    	source: "iana",
    	extensions: [
    		"rcprofile"
    	]
    },
    	"application/vnd.irepository.package+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"irp"
    	]
    },
    	"application/vnd.is-xpr": {
    	source: "iana",
    	extensions: [
    		"xpr"
    	]
    },
    	"application/vnd.isac.fcs": {
    	source: "iana",
    	extensions: [
    		"fcs"
    	]
    },
    	"application/vnd.iso11783-10+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.jam": {
    	source: "iana",
    	extensions: [
    		"jam"
    	]
    },
    	"application/vnd.japannet-directory-service": {
    	source: "iana"
    },
    	"application/vnd.japannet-jpnstore-wakeup": {
    	source: "iana"
    },
    	"application/vnd.japannet-payment-wakeup": {
    	source: "iana"
    },
    	"application/vnd.japannet-registration": {
    	source: "iana"
    },
    	"application/vnd.japannet-registration-wakeup": {
    	source: "iana"
    },
    	"application/vnd.japannet-setstore-wakeup": {
    	source: "iana"
    },
    	"application/vnd.japannet-verification": {
    	source: "iana"
    },
    	"application/vnd.japannet-verification-wakeup": {
    	source: "iana"
    },
    	"application/vnd.jcp.javame.midlet-rms": {
    	source: "iana",
    	extensions: [
    		"rms"
    	]
    },
    	"application/vnd.jisp": {
    	source: "iana",
    	extensions: [
    		"jisp"
    	]
    },
    	"application/vnd.joost.joda-archive": {
    	source: "iana",
    	extensions: [
    		"joda"
    	]
    },
    	"application/vnd.jsk.isdn-ngn": {
    	source: "iana"
    },
    	"application/vnd.kahootz": {
    	source: "iana",
    	extensions: [
    		"ktz",
    		"ktr"
    	]
    },
    	"application/vnd.kde.karbon": {
    	source: "iana",
    	extensions: [
    		"karbon"
    	]
    },
    	"application/vnd.kde.kchart": {
    	source: "iana",
    	extensions: [
    		"chrt"
    	]
    },
    	"application/vnd.kde.kformula": {
    	source: "iana",
    	extensions: [
    		"kfo"
    	]
    },
    	"application/vnd.kde.kivio": {
    	source: "iana",
    	extensions: [
    		"flw"
    	]
    },
    	"application/vnd.kde.kontour": {
    	source: "iana",
    	extensions: [
    		"kon"
    	]
    },
    	"application/vnd.kde.kpresenter": {
    	source: "iana",
    	extensions: [
    		"kpr",
    		"kpt"
    	]
    },
    	"application/vnd.kde.kspread": {
    	source: "iana",
    	extensions: [
    		"ksp"
    	]
    },
    	"application/vnd.kde.kword": {
    	source: "iana",
    	extensions: [
    		"kwd",
    		"kwt"
    	]
    },
    	"application/vnd.kenameaapp": {
    	source: "iana",
    	extensions: [
    		"htke"
    	]
    },
    	"application/vnd.kidspiration": {
    	source: "iana",
    	extensions: [
    		"kia"
    	]
    },
    	"application/vnd.kinar": {
    	source: "iana",
    	extensions: [
    		"kne",
    		"knp"
    	]
    },
    	"application/vnd.koan": {
    	source: "iana",
    	extensions: [
    		"skp",
    		"skd",
    		"skt",
    		"skm"
    	]
    },
    	"application/vnd.kodak-descriptor": {
    	source: "iana",
    	extensions: [
    		"sse"
    	]
    },
    	"application/vnd.las": {
    	source: "iana"
    },
    	"application/vnd.las.las+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.las.las+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"lasxml"
    	]
    },
    	"application/vnd.laszip": {
    	source: "iana"
    },
    	"application/vnd.leap+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.liberty-request+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.llamagraphics.life-balance.desktop": {
    	source: "iana",
    	extensions: [
    		"lbd"
    	]
    },
    	"application/vnd.llamagraphics.life-balance.exchange+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"lbe"
    	]
    },
    	"application/vnd.logipipe.circuit+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.loom": {
    	source: "iana"
    },
    	"application/vnd.lotus-1-2-3": {
    	source: "iana",
    	extensions: [
    		"123"
    	]
    },
    	"application/vnd.lotus-approach": {
    	source: "iana",
    	extensions: [
    		"apr"
    	]
    },
    	"application/vnd.lotus-freelance": {
    	source: "iana",
    	extensions: [
    		"pre"
    	]
    },
    	"application/vnd.lotus-notes": {
    	source: "iana",
    	extensions: [
    		"nsf"
    	]
    },
    	"application/vnd.lotus-organizer": {
    	source: "iana",
    	extensions: [
    		"org"
    	]
    },
    	"application/vnd.lotus-screencam": {
    	source: "iana",
    	extensions: [
    		"scm"
    	]
    },
    	"application/vnd.lotus-wordpro": {
    	source: "iana",
    	extensions: [
    		"lwp"
    	]
    },
    	"application/vnd.macports.portpkg": {
    	source: "iana",
    	extensions: [
    		"portpkg"
    	]
    },
    	"application/vnd.mapbox-vector-tile": {
    	source: "iana",
    	extensions: [
    		"mvt"
    	]
    },
    	"application/vnd.marlin.drm.actiontoken+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.marlin.drm.conftoken+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.marlin.drm.license+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.marlin.drm.mdcf": {
    	source: "iana"
    },
    	"application/vnd.mason+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.maxar.archive.3tz+zip": {
    	source: "iana",
    	compressible: false
    },
    	"application/vnd.maxmind.maxmind-db": {
    	source: "iana"
    },
    	"application/vnd.mcd": {
    	source: "iana",
    	extensions: [
    		"mcd"
    	]
    },
    	"application/vnd.medcalcdata": {
    	source: "iana",
    	extensions: [
    		"mc1"
    	]
    },
    	"application/vnd.mediastation.cdkey": {
    	source: "iana",
    	extensions: [
    		"cdkey"
    	]
    },
    	"application/vnd.meridian-slingshot": {
    	source: "iana"
    },
    	"application/vnd.mfer": {
    	source: "iana",
    	extensions: [
    		"mwf"
    	]
    },
    	"application/vnd.mfmp": {
    	source: "iana",
    	extensions: [
    		"mfm"
    	]
    },
    	"application/vnd.micro+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.micrografx.flo": {
    	source: "iana",
    	extensions: [
    		"flo"
    	]
    },
    	"application/vnd.micrografx.igx": {
    	source: "iana",
    	extensions: [
    		"igx"
    	]
    },
    	"application/vnd.microsoft.portable-executable": {
    	source: "iana"
    },
    	"application/vnd.microsoft.windows.thumbnail-cache": {
    	source: "iana"
    },
    	"application/vnd.miele+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.mif": {
    	source: "iana",
    	extensions: [
    		"mif"
    	]
    },
    	"application/vnd.minisoft-hp3000-save": {
    	source: "iana"
    },
    	"application/vnd.mitsubishi.misty-guard.trustweb": {
    	source: "iana"
    },
    	"application/vnd.mobius.daf": {
    	source: "iana",
    	extensions: [
    		"daf"
    	]
    },
    	"application/vnd.mobius.dis": {
    	source: "iana",
    	extensions: [
    		"dis"
    	]
    },
    	"application/vnd.mobius.mbk": {
    	source: "iana",
    	extensions: [
    		"mbk"
    	]
    },
    	"application/vnd.mobius.mqy": {
    	source: "iana",
    	extensions: [
    		"mqy"
    	]
    },
    	"application/vnd.mobius.msl": {
    	source: "iana",
    	extensions: [
    		"msl"
    	]
    },
    	"application/vnd.mobius.plc": {
    	source: "iana",
    	extensions: [
    		"plc"
    	]
    },
    	"application/vnd.mobius.txf": {
    	source: "iana",
    	extensions: [
    		"txf"
    	]
    },
    	"application/vnd.mophun.application": {
    	source: "iana",
    	extensions: [
    		"mpn"
    	]
    },
    	"application/vnd.mophun.certificate": {
    	source: "iana",
    	extensions: [
    		"mpc"
    	]
    },
    	"application/vnd.motorola.flexsuite": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.adsi": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.fis": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.gotap": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.kmr": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.ttc": {
    	source: "iana"
    },
    	"application/vnd.motorola.flexsuite.wem": {
    	source: "iana"
    },
    	"application/vnd.motorola.iprm": {
    	source: "iana"
    },
    	"application/vnd.mozilla.xul+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xul"
    	]
    },
    	"application/vnd.ms-3mfdocument": {
    	source: "iana"
    },
    	"application/vnd.ms-artgalry": {
    	source: "iana",
    	extensions: [
    		"cil"
    	]
    },
    	"application/vnd.ms-asf": {
    	source: "iana"
    },
    	"application/vnd.ms-cab-compressed": {
    	source: "iana",
    	extensions: [
    		"cab"
    	]
    },
    	"application/vnd.ms-color.iccprofile": {
    	source: "apache"
    },
    	"application/vnd.ms-excel": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"xls",
    		"xlm",
    		"xla",
    		"xlc",
    		"xlt",
    		"xlw"
    	]
    },
    	"application/vnd.ms-excel.addin.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"xlam"
    	]
    },
    	"application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"xlsb"
    	]
    },
    	"application/vnd.ms-excel.sheet.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"xlsm"
    	]
    },
    	"application/vnd.ms-excel.template.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"xltm"
    	]
    },
    	"application/vnd.ms-fontobject": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"eot"
    	]
    },
    	"application/vnd.ms-htmlhelp": {
    	source: "iana",
    	extensions: [
    		"chm"
    	]
    },
    	"application/vnd.ms-ims": {
    	source: "iana",
    	extensions: [
    		"ims"
    	]
    },
    	"application/vnd.ms-lrm": {
    	source: "iana",
    	extensions: [
    		"lrm"
    	]
    },
    	"application/vnd.ms-office.activex+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ms-officetheme": {
    	source: "iana",
    	extensions: [
    		"thmx"
    	]
    },
    	"application/vnd.ms-opentype": {
    	source: "apache",
    	compressible: true
    },
    	"application/vnd.ms-outlook": {
    	compressible: false,
    	extensions: [
    		"msg"
    	]
    },
    	"application/vnd.ms-package.obfuscated-opentype": {
    	source: "apache"
    },
    	"application/vnd.ms-pki.seccat": {
    	source: "apache",
    	extensions: [
    		"cat"
    	]
    },
    	"application/vnd.ms-pki.stl": {
    	source: "apache",
    	extensions: [
    		"stl"
    	]
    },
    	"application/vnd.ms-playready.initiator+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ms-powerpoint": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"ppt",
    		"pps",
    		"pot"
    	]
    },
    	"application/vnd.ms-powerpoint.addin.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"ppam"
    	]
    },
    	"application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"pptm"
    	]
    },
    	"application/vnd.ms-powerpoint.slide.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"sldm"
    	]
    },
    	"application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"ppsm"
    	]
    },
    	"application/vnd.ms-powerpoint.template.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"potm"
    	]
    },
    	"application/vnd.ms-printdevicecapabilities+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ms-printing.printticket+xml": {
    	source: "apache",
    	compressible: true
    },
    	"application/vnd.ms-printschematicket+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ms-project": {
    	source: "iana",
    	extensions: [
    		"mpp",
    		"mpt"
    	]
    },
    	"application/vnd.ms-tnef": {
    	source: "iana"
    },
    	"application/vnd.ms-windows.devicepairing": {
    	source: "iana"
    },
    	"application/vnd.ms-windows.nwprinting.oob": {
    	source: "iana"
    },
    	"application/vnd.ms-windows.printerpairing": {
    	source: "iana"
    },
    	"application/vnd.ms-windows.wsd.oob": {
    	source: "iana"
    },
    	"application/vnd.ms-wmdrm.lic-chlg-req": {
    	source: "iana"
    },
    	"application/vnd.ms-wmdrm.lic-resp": {
    	source: "iana"
    },
    	"application/vnd.ms-wmdrm.meter-chlg-req": {
    	source: "iana"
    },
    	"application/vnd.ms-wmdrm.meter-resp": {
    	source: "iana"
    },
    	"application/vnd.ms-word.document.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"docm"
    	]
    },
    	"application/vnd.ms-word.template.macroenabled.12": {
    	source: "iana",
    	extensions: [
    		"dotm"
    	]
    },
    	"application/vnd.ms-works": {
    	source: "iana",
    	extensions: [
    		"wps",
    		"wks",
    		"wcm",
    		"wdb"
    	]
    },
    	"application/vnd.ms-wpl": {
    	source: "iana",
    	extensions: [
    		"wpl"
    	]
    },
    	"application/vnd.ms-xpsdocument": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"xps"
    	]
    },
    	"application/vnd.msa-disk-image": {
    	source: "iana"
    },
    	"application/vnd.mseq": {
    	source: "iana",
    	extensions: [
    		"mseq"
    	]
    },
    	"application/vnd.msign": {
    	source: "iana"
    },
    	"application/vnd.multiad.creator": {
    	source: "iana"
    },
    	"application/vnd.multiad.creator.cif": {
    	source: "iana"
    },
    	"application/vnd.music-niff": {
    	source: "iana"
    },
    	"application/vnd.musician": {
    	source: "iana",
    	extensions: [
    		"mus"
    	]
    },
    	"application/vnd.muvee.style": {
    	source: "iana",
    	extensions: [
    		"msty"
    	]
    },
    	"application/vnd.mynfc": {
    	source: "iana",
    	extensions: [
    		"taglet"
    	]
    },
    	"application/vnd.nacamar.ybrid+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.ncd.control": {
    	source: "iana"
    },
    	"application/vnd.ncd.reference": {
    	source: "iana"
    },
    	"application/vnd.nearst.inv+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nebumind.line": {
    	source: "iana"
    },
    	"application/vnd.nervana": {
    	source: "iana"
    },
    	"application/vnd.netfpx": {
    	source: "iana"
    },
    	"application/vnd.neurolanguage.nlu": {
    	source: "iana",
    	extensions: [
    		"nlu"
    	]
    },
    	"application/vnd.nimn": {
    	source: "iana"
    },
    	"application/vnd.nintendo.nitro.rom": {
    	source: "iana"
    },
    	"application/vnd.nintendo.snes.rom": {
    	source: "iana"
    },
    	"application/vnd.nitf": {
    	source: "iana",
    	extensions: [
    		"ntf",
    		"nitf"
    	]
    },
    	"application/vnd.noblenet-directory": {
    	source: "iana",
    	extensions: [
    		"nnd"
    	]
    },
    	"application/vnd.noblenet-sealer": {
    	source: "iana",
    	extensions: [
    		"nns"
    	]
    },
    	"application/vnd.noblenet-web": {
    	source: "iana",
    	extensions: [
    		"nnw"
    	]
    },
    	"application/vnd.nokia.catalogs": {
    	source: "iana"
    },
    	"application/vnd.nokia.conml+wbxml": {
    	source: "iana"
    },
    	"application/vnd.nokia.conml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nokia.iptv.config+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nokia.isds-radio-presets": {
    	source: "iana"
    },
    	"application/vnd.nokia.landmark+wbxml": {
    	source: "iana"
    },
    	"application/vnd.nokia.landmark+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nokia.landmarkcollection+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nokia.n-gage.ac+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ac"
    	]
    },
    	"application/vnd.nokia.n-gage.data": {
    	source: "iana",
    	extensions: [
    		"ngdat"
    	]
    },
    	"application/vnd.nokia.n-gage.symbian.install": {
    	source: "iana",
    	extensions: [
    		"n-gage"
    	]
    },
    	"application/vnd.nokia.ncd": {
    	source: "iana"
    },
    	"application/vnd.nokia.pcd+wbxml": {
    	source: "iana"
    },
    	"application/vnd.nokia.pcd+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.nokia.radio-preset": {
    	source: "iana",
    	extensions: [
    		"rpst"
    	]
    },
    	"application/vnd.nokia.radio-presets": {
    	source: "iana",
    	extensions: [
    		"rpss"
    	]
    },
    	"application/vnd.novadigm.edm": {
    	source: "iana",
    	extensions: [
    		"edm"
    	]
    },
    	"application/vnd.novadigm.edx": {
    	source: "iana",
    	extensions: [
    		"edx"
    	]
    },
    	"application/vnd.novadigm.ext": {
    	source: "iana",
    	extensions: [
    		"ext"
    	]
    },
    	"application/vnd.ntt-local.content-share": {
    	source: "iana"
    },
    	"application/vnd.ntt-local.file-transfer": {
    	source: "iana"
    },
    	"application/vnd.ntt-local.ogw_remote-access": {
    	source: "iana"
    },
    	"application/vnd.ntt-local.sip-ta_remote": {
    	source: "iana"
    },
    	"application/vnd.ntt-local.sip-ta_tcp_stream": {
    	source: "iana"
    },
    	"application/vnd.oasis.opendocument.chart": {
    	source: "iana",
    	extensions: [
    		"odc"
    	]
    },
    	"application/vnd.oasis.opendocument.chart-template": {
    	source: "iana",
    	extensions: [
    		"otc"
    	]
    },
    	"application/vnd.oasis.opendocument.database": {
    	source: "iana",
    	extensions: [
    		"odb"
    	]
    },
    	"application/vnd.oasis.opendocument.formula": {
    	source: "iana",
    	extensions: [
    		"odf"
    	]
    },
    	"application/vnd.oasis.opendocument.formula-template": {
    	source: "iana",
    	extensions: [
    		"odft"
    	]
    },
    	"application/vnd.oasis.opendocument.graphics": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"odg"
    	]
    },
    	"application/vnd.oasis.opendocument.graphics-template": {
    	source: "iana",
    	extensions: [
    		"otg"
    	]
    },
    	"application/vnd.oasis.opendocument.image": {
    	source: "iana",
    	extensions: [
    		"odi"
    	]
    },
    	"application/vnd.oasis.opendocument.image-template": {
    	source: "iana",
    	extensions: [
    		"oti"
    	]
    },
    	"application/vnd.oasis.opendocument.presentation": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"odp"
    	]
    },
    	"application/vnd.oasis.opendocument.presentation-template": {
    	source: "iana",
    	extensions: [
    		"otp"
    	]
    },
    	"application/vnd.oasis.opendocument.spreadsheet": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"ods"
    	]
    },
    	"application/vnd.oasis.opendocument.spreadsheet-template": {
    	source: "iana",
    	extensions: [
    		"ots"
    	]
    },
    	"application/vnd.oasis.opendocument.text": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"odt"
    	]
    },
    	"application/vnd.oasis.opendocument.text-master": {
    	source: "iana",
    	extensions: [
    		"odm"
    	]
    },
    	"application/vnd.oasis.opendocument.text-template": {
    	source: "iana",
    	extensions: [
    		"ott"
    	]
    },
    	"application/vnd.oasis.opendocument.text-web": {
    	source: "iana",
    	extensions: [
    		"oth"
    	]
    },
    	"application/vnd.obn": {
    	source: "iana"
    },
    	"application/vnd.ocf+cbor": {
    	source: "iana"
    },
    	"application/vnd.oci.image.manifest.v1+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oftn.l10n+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.contentaccessdownload+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.contentaccessstreaming+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.cspg-hexbinary": {
    	source: "iana"
    },
    	"application/vnd.oipf.dae.svg+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.dae.xhtml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.mippvcontrolmessage+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.pae.gem": {
    	source: "iana"
    },
    	"application/vnd.oipf.spdiscovery+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.spdlist+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.ueprofile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oipf.userprofile+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.olpc-sugar": {
    	source: "iana",
    	extensions: [
    		"xo"
    	]
    },
    	"application/vnd.oma-scws-config": {
    	source: "iana"
    },
    	"application/vnd.oma-scws-http-request": {
    	source: "iana"
    },
    	"application/vnd.oma-scws-http-response": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.associated-procedure-parameter+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.drm-trigger+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.imd+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.ltkm": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.notification+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.provisioningtrigger": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.sgboot": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.sgdd+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.sgdu": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.simple-symbol-container": {
    	source: "iana"
    },
    	"application/vnd.oma.bcast.smartcard-trigger+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.sprov+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.bcast.stkm": {
    	source: "iana"
    },
    	"application/vnd.oma.cab-address-book+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.cab-feature-handler+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.cab-pcc+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.cab-subs-invite+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.cab-user-prefs+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.dcd": {
    	source: "iana"
    },
    	"application/vnd.oma.dcdc": {
    	source: "iana"
    },
    	"application/vnd.oma.dd2+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"dd2"
    	]
    },
    	"application/vnd.oma.drm.risd+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.group-usage-list+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.lwm2m+cbor": {
    	source: "iana"
    },
    	"application/vnd.oma.lwm2m+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.lwm2m+tlv": {
    	source: "iana"
    },
    	"application/vnd.oma.pal+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.poc.detailed-progress-report+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.poc.final-report+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.poc.groups+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.poc.invocation-descriptor+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.poc.optimized-progress-report+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.push": {
    	source: "iana"
    },
    	"application/vnd.oma.scidm.messages+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oma.xcap-directory+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.omads-email+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.omads-file+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.omads-folder+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.omaloc-supl-init": {
    	source: "iana"
    },
    	"application/vnd.onepager": {
    	source: "iana"
    },
    	"application/vnd.onepagertamp": {
    	source: "iana"
    },
    	"application/vnd.onepagertamx": {
    	source: "iana"
    },
    	"application/vnd.onepagertat": {
    	source: "iana"
    },
    	"application/vnd.onepagertatp": {
    	source: "iana"
    },
    	"application/vnd.onepagertatx": {
    	source: "iana"
    },
    	"application/vnd.openblox.game+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"obgx"
    	]
    },
    	"application/vnd.openblox.game-binary": {
    	source: "iana"
    },
    	"application/vnd.openeye.oeb": {
    	source: "iana"
    },
    	"application/vnd.openofficeorg.extension": {
    	source: "apache",
    	extensions: [
    		"oxt"
    	]
    },
    	"application/vnd.openstreetmap.data+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"osm"
    	]
    },
    	"application/vnd.opentimestamps.ots": {
    	source: "iana"
    },
    	"application/vnd.openxmlformats-officedocument.custom-properties+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawing+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.extended-properties+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"pptx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slide": {
    	source: "iana",
    	extensions: [
    		"sldx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    	source: "iana",
    	extensions: [
    		"ppsx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.template": {
    	source: "iana",
    	extensions: [
    		"potx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"xlsx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    	source: "iana",
    	extensions: [
    		"xltx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.theme+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.themeoverride+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.vmldrawing": {
    	source: "iana"
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"docx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    	source: "iana",
    	extensions: [
    		"dotx"
    	]
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-package.core-properties+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.openxmlformats-package.relationships+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oracle.resource+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.orange.indata": {
    	source: "iana"
    },
    	"application/vnd.osa.netdeploy": {
    	source: "iana"
    },
    	"application/vnd.osgeo.mapguide.package": {
    	source: "iana",
    	extensions: [
    		"mgp"
    	]
    },
    	"application/vnd.osgi.bundle": {
    	source: "iana"
    },
    	"application/vnd.osgi.dp": {
    	source: "iana",
    	extensions: [
    		"dp"
    	]
    },
    	"application/vnd.osgi.subsystem": {
    	source: "iana",
    	extensions: [
    		"esa"
    	]
    },
    	"application/vnd.otps.ct-kip+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.oxli.countgraph": {
    	source: "iana"
    },
    	"application/vnd.pagerduty+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.palm": {
    	source: "iana",
    	extensions: [
    		"pdb",
    		"pqa",
    		"oprc"
    	]
    },
    	"application/vnd.panoply": {
    	source: "iana"
    },
    	"application/vnd.paos.xml": {
    	source: "iana"
    },
    	"application/vnd.patentdive": {
    	source: "iana"
    },
    	"application/vnd.patientecommsdoc": {
    	source: "iana"
    },
    	"application/vnd.pawaafile": {
    	source: "iana",
    	extensions: [
    		"paw"
    	]
    },
    	"application/vnd.pcos": {
    	source: "iana"
    },
    	"application/vnd.pg.format": {
    	source: "iana",
    	extensions: [
    		"str"
    	]
    },
    	"application/vnd.pg.osasli": {
    	source: "iana",
    	extensions: [
    		"ei6"
    	]
    },
    	"application/vnd.piaccess.application-licence": {
    	source: "iana"
    },
    	"application/vnd.picsel": {
    	source: "iana",
    	extensions: [
    		"efif"
    	]
    },
    	"application/vnd.pmi.widget": {
    	source: "iana",
    	extensions: [
    		"wg"
    	]
    },
    	"application/vnd.poc.group-advertisement+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.pocketlearn": {
    	source: "iana",
    	extensions: [
    		"plf"
    	]
    },
    	"application/vnd.powerbuilder6": {
    	source: "iana",
    	extensions: [
    		"pbd"
    	]
    },
    	"application/vnd.powerbuilder6-s": {
    	source: "iana"
    },
    	"application/vnd.powerbuilder7": {
    	source: "iana"
    },
    	"application/vnd.powerbuilder7-s": {
    	source: "iana"
    },
    	"application/vnd.powerbuilder75": {
    	source: "iana"
    },
    	"application/vnd.powerbuilder75-s": {
    	source: "iana"
    },
    	"application/vnd.preminet": {
    	source: "iana"
    },
    	"application/vnd.previewsystems.box": {
    	source: "iana",
    	extensions: [
    		"box"
    	]
    },
    	"application/vnd.proteus.magazine": {
    	source: "iana",
    	extensions: [
    		"mgz"
    	]
    },
    	"application/vnd.psfs": {
    	source: "iana"
    },
    	"application/vnd.publishare-delta-tree": {
    	source: "iana",
    	extensions: [
    		"qps"
    	]
    },
    	"application/vnd.pvi.ptid1": {
    	source: "iana",
    	extensions: [
    		"ptid"
    	]
    },
    	"application/vnd.pwg-multiplexed": {
    	source: "iana"
    },
    	"application/vnd.pwg-xhtml-print+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.qualcomm.brew-app-res": {
    	source: "iana"
    },
    	"application/vnd.quarantainenet": {
    	source: "iana"
    },
    	"application/vnd.quark.quarkxpress": {
    	source: "iana",
    	extensions: [
    		"qxd",
    		"qxt",
    		"qwd",
    		"qwt",
    		"qxl",
    		"qxb"
    	]
    },
    	"application/vnd.quobject-quoxdocument": {
    	source: "iana"
    },
    	"application/vnd.radisys.moml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-audit+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-audit-conf+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-audit-conn+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-audit-dialog+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-audit-stream+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-conf+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-base+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-fax-detect+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-group+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-speech+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.radisys.msml-dialog-transform+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.rainstor.data": {
    	source: "iana"
    },
    	"application/vnd.rapid": {
    	source: "iana"
    },
    	"application/vnd.rar": {
    	source: "iana",
    	extensions: [
    		"rar"
    	]
    },
    	"application/vnd.realvnc.bed": {
    	source: "iana",
    	extensions: [
    		"bed"
    	]
    },
    	"application/vnd.recordare.musicxml": {
    	source: "iana",
    	extensions: [
    		"mxl"
    	]
    },
    	"application/vnd.recordare.musicxml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"musicxml"
    	]
    },
    	"application/vnd.renlearn.rlprint": {
    	source: "iana"
    },
    	"application/vnd.resilient.logic": {
    	source: "iana"
    },
    	"application/vnd.restful+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.rig.cryptonote": {
    	source: "iana",
    	extensions: [
    		"cryptonote"
    	]
    },
    	"application/vnd.rim.cod": {
    	source: "apache",
    	extensions: [
    		"cod"
    	]
    },
    	"application/vnd.rn-realmedia": {
    	source: "apache",
    	extensions: [
    		"rm"
    	]
    },
    	"application/vnd.rn-realmedia-vbr": {
    	source: "apache",
    	extensions: [
    		"rmvb"
    	]
    },
    	"application/vnd.route66.link66+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"link66"
    	]
    },
    	"application/vnd.rs-274x": {
    	source: "iana"
    },
    	"application/vnd.ruckus.download": {
    	source: "iana"
    },
    	"application/vnd.s3sms": {
    	source: "iana"
    },
    	"application/vnd.sailingtracker.track": {
    	source: "iana",
    	extensions: [
    		"st"
    	]
    },
    	"application/vnd.sar": {
    	source: "iana"
    },
    	"application/vnd.sbm.cid": {
    	source: "iana"
    },
    	"application/vnd.sbm.mid2": {
    	source: "iana"
    },
    	"application/vnd.scribus": {
    	source: "iana"
    },
    	"application/vnd.sealed.3df": {
    	source: "iana"
    },
    	"application/vnd.sealed.csf": {
    	source: "iana"
    },
    	"application/vnd.sealed.doc": {
    	source: "iana"
    },
    	"application/vnd.sealed.eml": {
    	source: "iana"
    },
    	"application/vnd.sealed.mht": {
    	source: "iana"
    },
    	"application/vnd.sealed.net": {
    	source: "iana"
    },
    	"application/vnd.sealed.ppt": {
    	source: "iana"
    },
    	"application/vnd.sealed.tiff": {
    	source: "iana"
    },
    	"application/vnd.sealed.xls": {
    	source: "iana"
    },
    	"application/vnd.sealedmedia.softseal.html": {
    	source: "iana"
    },
    	"application/vnd.sealedmedia.softseal.pdf": {
    	source: "iana"
    },
    	"application/vnd.seemail": {
    	source: "iana",
    	extensions: [
    		"see"
    	]
    },
    	"application/vnd.seis+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.sema": {
    	source: "iana",
    	extensions: [
    		"sema"
    	]
    },
    	"application/vnd.semd": {
    	source: "iana",
    	extensions: [
    		"semd"
    	]
    },
    	"application/vnd.semf": {
    	source: "iana",
    	extensions: [
    		"semf"
    	]
    },
    	"application/vnd.shade-save-file": {
    	source: "iana"
    },
    	"application/vnd.shana.informed.formdata": {
    	source: "iana",
    	extensions: [
    		"ifm"
    	]
    },
    	"application/vnd.shana.informed.formtemplate": {
    	source: "iana",
    	extensions: [
    		"itp"
    	]
    },
    	"application/vnd.shana.informed.interchange": {
    	source: "iana",
    	extensions: [
    		"iif"
    	]
    },
    	"application/vnd.shana.informed.package": {
    	source: "iana",
    	extensions: [
    		"ipk"
    	]
    },
    	"application/vnd.shootproof+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.shopkick+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.shp": {
    	source: "iana"
    },
    	"application/vnd.shx": {
    	source: "iana"
    },
    	"application/vnd.sigrok.session": {
    	source: "iana"
    },
    	"application/vnd.simtech-mindmapper": {
    	source: "iana",
    	extensions: [
    		"twd",
    		"twds"
    	]
    },
    	"application/vnd.siren+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.smaf": {
    	source: "iana",
    	extensions: [
    		"mmf"
    	]
    },
    	"application/vnd.smart.notebook": {
    	source: "iana"
    },
    	"application/vnd.smart.teacher": {
    	source: "iana",
    	extensions: [
    		"teacher"
    	]
    },
    	"application/vnd.snesdev-page-table": {
    	source: "iana"
    },
    	"application/vnd.software602.filler.form+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"fo"
    	]
    },
    	"application/vnd.software602.filler.form-xml-zip": {
    	source: "iana"
    },
    	"application/vnd.solent.sdkm+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"sdkm",
    		"sdkd"
    	]
    },
    	"application/vnd.spotfire.dxp": {
    	source: "iana",
    	extensions: [
    		"dxp"
    	]
    },
    	"application/vnd.spotfire.sfs": {
    	source: "iana",
    	extensions: [
    		"sfs"
    	]
    },
    	"application/vnd.sqlite3": {
    	source: "iana"
    },
    	"application/vnd.sss-cod": {
    	source: "iana"
    },
    	"application/vnd.sss-dtf": {
    	source: "iana"
    },
    	"application/vnd.sss-ntf": {
    	source: "iana"
    },
    	"application/vnd.stardivision.calc": {
    	source: "apache",
    	extensions: [
    		"sdc"
    	]
    },
    	"application/vnd.stardivision.draw": {
    	source: "apache",
    	extensions: [
    		"sda"
    	]
    },
    	"application/vnd.stardivision.impress": {
    	source: "apache",
    	extensions: [
    		"sdd"
    	]
    },
    	"application/vnd.stardivision.math": {
    	source: "apache",
    	extensions: [
    		"smf"
    	]
    },
    	"application/vnd.stardivision.writer": {
    	source: "apache",
    	extensions: [
    		"sdw",
    		"vor"
    	]
    },
    	"application/vnd.stardivision.writer-global": {
    	source: "apache",
    	extensions: [
    		"sgl"
    	]
    },
    	"application/vnd.stepmania.package": {
    	source: "iana",
    	extensions: [
    		"smzip"
    	]
    },
    	"application/vnd.stepmania.stepchart": {
    	source: "iana",
    	extensions: [
    		"sm"
    	]
    },
    	"application/vnd.street-stream": {
    	source: "iana"
    },
    	"application/vnd.sun.wadl+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wadl"
    	]
    },
    	"application/vnd.sun.xml.calc": {
    	source: "apache",
    	extensions: [
    		"sxc"
    	]
    },
    	"application/vnd.sun.xml.calc.template": {
    	source: "apache",
    	extensions: [
    		"stc"
    	]
    },
    	"application/vnd.sun.xml.draw": {
    	source: "apache",
    	extensions: [
    		"sxd"
    	]
    },
    	"application/vnd.sun.xml.draw.template": {
    	source: "apache",
    	extensions: [
    		"std"
    	]
    },
    	"application/vnd.sun.xml.impress": {
    	source: "apache",
    	extensions: [
    		"sxi"
    	]
    },
    	"application/vnd.sun.xml.impress.template": {
    	source: "apache",
    	extensions: [
    		"sti"
    	]
    },
    	"application/vnd.sun.xml.math": {
    	source: "apache",
    	extensions: [
    		"sxm"
    	]
    },
    	"application/vnd.sun.xml.writer": {
    	source: "apache",
    	extensions: [
    		"sxw"
    	]
    },
    	"application/vnd.sun.xml.writer.global": {
    	source: "apache",
    	extensions: [
    		"sxg"
    	]
    },
    	"application/vnd.sun.xml.writer.template": {
    	source: "apache",
    	extensions: [
    		"stw"
    	]
    },
    	"application/vnd.sus-calendar": {
    	source: "iana",
    	extensions: [
    		"sus",
    		"susp"
    	]
    },
    	"application/vnd.svd": {
    	source: "iana",
    	extensions: [
    		"svd"
    	]
    },
    	"application/vnd.swiftview-ics": {
    	source: "iana"
    },
    	"application/vnd.sycle+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.syft+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.symbian.install": {
    	source: "apache",
    	extensions: [
    		"sis",
    		"sisx"
    	]
    },
    	"application/vnd.syncml+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"xsm"
    	]
    },
    	"application/vnd.syncml.dm+wbxml": {
    	source: "iana",
    	charset: "UTF-8",
    	extensions: [
    		"bdm"
    	]
    },
    	"application/vnd.syncml.dm+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"xdm"
    	]
    },
    	"application/vnd.syncml.dm.notification": {
    	source: "iana"
    },
    	"application/vnd.syncml.dmddf+wbxml": {
    	source: "iana"
    },
    	"application/vnd.syncml.dmddf+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"ddf"
    	]
    },
    	"application/vnd.syncml.dmtnds+wbxml": {
    	source: "iana"
    },
    	"application/vnd.syncml.dmtnds+xml": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true
    },
    	"application/vnd.syncml.ds.notification": {
    	source: "iana"
    },
    	"application/vnd.tableschema+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.tao.intent-module-archive": {
    	source: "iana",
    	extensions: [
    		"tao"
    	]
    },
    	"application/vnd.tcpdump.pcap": {
    	source: "iana",
    	extensions: [
    		"pcap",
    		"cap",
    		"dmp"
    	]
    },
    	"application/vnd.think-cell.ppttc+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.tmd.mediaflex.api+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.tml": {
    	source: "iana"
    },
    	"application/vnd.tmobile-livetv": {
    	source: "iana",
    	extensions: [
    		"tmo"
    	]
    },
    	"application/vnd.tri.onesource": {
    	source: "iana"
    },
    	"application/vnd.trid.tpt": {
    	source: "iana",
    	extensions: [
    		"tpt"
    	]
    },
    	"application/vnd.triscape.mxs": {
    	source: "iana",
    	extensions: [
    		"mxs"
    	]
    },
    	"application/vnd.trueapp": {
    	source: "iana",
    	extensions: [
    		"tra"
    	]
    },
    	"application/vnd.truedoc": {
    	source: "iana"
    },
    	"application/vnd.ubisoft.webplayer": {
    	source: "iana"
    },
    	"application/vnd.ufdl": {
    	source: "iana",
    	extensions: [
    		"ufd",
    		"ufdl"
    	]
    },
    	"application/vnd.uiq.theme": {
    	source: "iana",
    	extensions: [
    		"utz"
    	]
    },
    	"application/vnd.umajin": {
    	source: "iana",
    	extensions: [
    		"umj"
    	]
    },
    	"application/vnd.unity": {
    	source: "iana",
    	extensions: [
    		"unityweb"
    	]
    },
    	"application/vnd.uoml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"uoml"
    	]
    },
    	"application/vnd.uplanet.alert": {
    	source: "iana"
    },
    	"application/vnd.uplanet.alert-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.bearer-choice": {
    	source: "iana"
    },
    	"application/vnd.uplanet.bearer-choice-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.cacheop": {
    	source: "iana"
    },
    	"application/vnd.uplanet.cacheop-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.channel": {
    	source: "iana"
    },
    	"application/vnd.uplanet.channel-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.list": {
    	source: "iana"
    },
    	"application/vnd.uplanet.list-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.listcmd": {
    	source: "iana"
    },
    	"application/vnd.uplanet.listcmd-wbxml": {
    	source: "iana"
    },
    	"application/vnd.uplanet.signal": {
    	source: "iana"
    },
    	"application/vnd.uri-map": {
    	source: "iana"
    },
    	"application/vnd.valve.source.material": {
    	source: "iana"
    },
    	"application/vnd.vcx": {
    	source: "iana",
    	extensions: [
    		"vcx"
    	]
    },
    	"application/vnd.vd-study": {
    	source: "iana"
    },
    	"application/vnd.vectorworks": {
    	source: "iana"
    },
    	"application/vnd.vel+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.verimatrix.vcas": {
    	source: "iana"
    },
    	"application/vnd.veritone.aion+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.veryant.thin": {
    	source: "iana"
    },
    	"application/vnd.ves.encrypted": {
    	source: "iana"
    },
    	"application/vnd.vidsoft.vidconference": {
    	source: "iana"
    },
    	"application/vnd.visio": {
    	source: "iana",
    	extensions: [
    		"vsd",
    		"vst",
    		"vss",
    		"vsw"
    	]
    },
    	"application/vnd.visionary": {
    	source: "iana",
    	extensions: [
    		"vis"
    	]
    },
    	"application/vnd.vividence.scriptfile": {
    	source: "iana"
    },
    	"application/vnd.vsf": {
    	source: "iana",
    	extensions: [
    		"vsf"
    	]
    },
    	"application/vnd.wap.sic": {
    	source: "iana"
    },
    	"application/vnd.wap.slc": {
    	source: "iana"
    },
    	"application/vnd.wap.wbxml": {
    	source: "iana",
    	charset: "UTF-8",
    	extensions: [
    		"wbxml"
    	]
    },
    	"application/vnd.wap.wmlc": {
    	source: "iana",
    	extensions: [
    		"wmlc"
    	]
    },
    	"application/vnd.wap.wmlscriptc": {
    	source: "iana",
    	extensions: [
    		"wmlsc"
    	]
    },
    	"application/vnd.webturbo": {
    	source: "iana",
    	extensions: [
    		"wtb"
    	]
    },
    	"application/vnd.wfa.dpp": {
    	source: "iana"
    },
    	"application/vnd.wfa.p2p": {
    	source: "iana"
    },
    	"application/vnd.wfa.wsc": {
    	source: "iana"
    },
    	"application/vnd.windows.devicepairing": {
    	source: "iana"
    },
    	"application/vnd.wmc": {
    	source: "iana"
    },
    	"application/vnd.wmf.bootstrap": {
    	source: "iana"
    },
    	"application/vnd.wolfram.mathematica": {
    	source: "iana"
    },
    	"application/vnd.wolfram.mathematica.package": {
    	source: "iana"
    },
    	"application/vnd.wolfram.player": {
    	source: "iana",
    	extensions: [
    		"nbp"
    	]
    },
    	"application/vnd.wordperfect": {
    	source: "iana",
    	extensions: [
    		"wpd"
    	]
    },
    	"application/vnd.wqd": {
    	source: "iana",
    	extensions: [
    		"wqd"
    	]
    },
    	"application/vnd.wrq-hp3000-labelled": {
    	source: "iana"
    },
    	"application/vnd.wt.stf": {
    	source: "iana",
    	extensions: [
    		"stf"
    	]
    },
    	"application/vnd.wv.csp+wbxml": {
    	source: "iana"
    },
    	"application/vnd.wv.csp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.wv.ssp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.xacml+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.xara": {
    	source: "iana",
    	extensions: [
    		"xar"
    	]
    },
    	"application/vnd.xfdl": {
    	source: "iana",
    	extensions: [
    		"xfdl"
    	]
    },
    	"application/vnd.xfdl.webform": {
    	source: "iana"
    },
    	"application/vnd.xmi+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/vnd.xmpie.cpkg": {
    	source: "iana"
    },
    	"application/vnd.xmpie.dpkg": {
    	source: "iana"
    },
    	"application/vnd.xmpie.plan": {
    	source: "iana"
    },
    	"application/vnd.xmpie.ppkg": {
    	source: "iana"
    },
    	"application/vnd.xmpie.xlim": {
    	source: "iana"
    },
    	"application/vnd.yamaha.hv-dic": {
    	source: "iana",
    	extensions: [
    		"hvd"
    	]
    },
    	"application/vnd.yamaha.hv-script": {
    	source: "iana",
    	extensions: [
    		"hvs"
    	]
    },
    	"application/vnd.yamaha.hv-voice": {
    	source: "iana",
    	extensions: [
    		"hvp"
    	]
    },
    	"application/vnd.yamaha.openscoreformat": {
    	source: "iana",
    	extensions: [
    		"osf"
    	]
    },
    	"application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"osfpvg"
    	]
    },
    	"application/vnd.yamaha.remote-setup": {
    	source: "iana"
    },
    	"application/vnd.yamaha.smaf-audio": {
    	source: "iana",
    	extensions: [
    		"saf"
    	]
    },
    	"application/vnd.yamaha.smaf-phrase": {
    	source: "iana",
    	extensions: [
    		"spf"
    	]
    },
    	"application/vnd.yamaha.through-ngn": {
    	source: "iana"
    },
    	"application/vnd.yamaha.tunnel-udpencap": {
    	source: "iana"
    },
    	"application/vnd.yaoweme": {
    	source: "iana"
    },
    	"application/vnd.yellowriver-custom-menu": {
    	source: "iana",
    	extensions: [
    		"cmp"
    	]
    },
    	"application/vnd.youtube.yt": {
    	source: "iana"
    },
    	"application/vnd.zul": {
    	source: "iana",
    	extensions: [
    		"zir",
    		"zirz"
    	]
    },
    	"application/vnd.zzazz.deck+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"zaz"
    	]
    },
    	"application/voicexml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"vxml"
    	]
    },
    	"application/voucher-cms+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/vq-rtcpxr": {
    	source: "iana"
    },
    	"application/wasm": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wasm"
    	]
    },
    	"application/watcherinfo+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wif"
    	]
    },
    	"application/webpush-options+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/whoispp-query": {
    	source: "iana"
    },
    	"application/whoispp-response": {
    	source: "iana"
    },
    	"application/widget": {
    	source: "iana",
    	extensions: [
    		"wgt"
    	]
    },
    	"application/winhlp": {
    	source: "apache",
    	extensions: [
    		"hlp"
    	]
    },
    	"application/wita": {
    	source: "iana"
    },
    	"application/wordperfect5.1": {
    	source: "iana"
    },
    	"application/wsdl+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wsdl"
    	]
    },
    	"application/wspolicy+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"wspolicy"
    	]
    },
    	"application/x-7z-compressed": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"7z"
    	]
    },
    	"application/x-abiword": {
    	source: "apache",
    	extensions: [
    		"abw"
    	]
    },
    	"application/x-ace-compressed": {
    	source: "apache",
    	extensions: [
    		"ace"
    	]
    },
    	"application/x-amf": {
    	source: "apache"
    },
    	"application/x-apple-diskimage": {
    	source: "apache",
    	extensions: [
    		"dmg"
    	]
    },
    	"application/x-arj": {
    	compressible: false,
    	extensions: [
    		"arj"
    	]
    },
    	"application/x-authorware-bin": {
    	source: "apache",
    	extensions: [
    		"aab",
    		"x32",
    		"u32",
    		"vox"
    	]
    },
    	"application/x-authorware-map": {
    	source: "apache",
    	extensions: [
    		"aam"
    	]
    },
    	"application/x-authorware-seg": {
    	source: "apache",
    	extensions: [
    		"aas"
    	]
    },
    	"application/x-bcpio": {
    	source: "apache",
    	extensions: [
    		"bcpio"
    	]
    },
    	"application/x-bdoc": {
    	compressible: false,
    	extensions: [
    		"bdoc"
    	]
    },
    	"application/x-bittorrent": {
    	source: "apache",
    	extensions: [
    		"torrent"
    	]
    },
    	"application/x-blorb": {
    	source: "apache",
    	extensions: [
    		"blb",
    		"blorb"
    	]
    },
    	"application/x-bzip": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"bz"
    	]
    },
    	"application/x-bzip2": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"bz2",
    		"boz"
    	]
    },
    	"application/x-cbr": {
    	source: "apache",
    	extensions: [
    		"cbr",
    		"cba",
    		"cbt",
    		"cbz",
    		"cb7"
    	]
    },
    	"application/x-cdlink": {
    	source: "apache",
    	extensions: [
    		"vcd"
    	]
    },
    	"application/x-cfs-compressed": {
    	source: "apache",
    	extensions: [
    		"cfs"
    	]
    },
    	"application/x-chat": {
    	source: "apache",
    	extensions: [
    		"chat"
    	]
    },
    	"application/x-chess-pgn": {
    	source: "apache",
    	extensions: [
    		"pgn"
    	]
    },
    	"application/x-chrome-extension": {
    	extensions: [
    		"crx"
    	]
    },
    	"application/x-cocoa": {
    	source: "nginx",
    	extensions: [
    		"cco"
    	]
    },
    	"application/x-compress": {
    	source: "apache"
    },
    	"application/x-conference": {
    	source: "apache",
    	extensions: [
    		"nsc"
    	]
    },
    	"application/x-cpio": {
    	source: "apache",
    	extensions: [
    		"cpio"
    	]
    },
    	"application/x-csh": {
    	source: "apache",
    	extensions: [
    		"csh"
    	]
    },
    	"application/x-deb": {
    	compressible: false
    },
    	"application/x-debian-package": {
    	source: "apache",
    	extensions: [
    		"deb",
    		"udeb"
    	]
    },
    	"application/x-dgc-compressed": {
    	source: "apache",
    	extensions: [
    		"dgc"
    	]
    },
    	"application/x-director": {
    	source: "apache",
    	extensions: [
    		"dir",
    		"dcr",
    		"dxr",
    		"cst",
    		"cct",
    		"cxt",
    		"w3d",
    		"fgd",
    		"swa"
    	]
    },
    	"application/x-doom": {
    	source: "apache",
    	extensions: [
    		"wad"
    	]
    },
    	"application/x-dtbncx+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"ncx"
    	]
    },
    	"application/x-dtbook+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"dtb"
    	]
    },
    	"application/x-dtbresource+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"res"
    	]
    },
    	"application/x-dvi": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"dvi"
    	]
    },
    	"application/x-envoy": {
    	source: "apache",
    	extensions: [
    		"evy"
    	]
    },
    	"application/x-eva": {
    	source: "apache",
    	extensions: [
    		"eva"
    	]
    },
    	"application/x-font-bdf": {
    	source: "apache",
    	extensions: [
    		"bdf"
    	]
    },
    	"application/x-font-dos": {
    	source: "apache"
    },
    	"application/x-font-framemaker": {
    	source: "apache"
    },
    	"application/x-font-ghostscript": {
    	source: "apache",
    	extensions: [
    		"gsf"
    	]
    },
    	"application/x-font-libgrx": {
    	source: "apache"
    },
    	"application/x-font-linux-psf": {
    	source: "apache",
    	extensions: [
    		"psf"
    	]
    },
    	"application/x-font-pcf": {
    	source: "apache",
    	extensions: [
    		"pcf"
    	]
    },
    	"application/x-font-snf": {
    	source: "apache",
    	extensions: [
    		"snf"
    	]
    },
    	"application/x-font-speedo": {
    	source: "apache"
    },
    	"application/x-font-sunos-news": {
    	source: "apache"
    },
    	"application/x-font-type1": {
    	source: "apache",
    	extensions: [
    		"pfa",
    		"pfb",
    		"pfm",
    		"afm"
    	]
    },
    	"application/x-font-vfont": {
    	source: "apache"
    },
    	"application/x-freearc": {
    	source: "apache",
    	extensions: [
    		"arc"
    	]
    },
    	"application/x-futuresplash": {
    	source: "apache",
    	extensions: [
    		"spl"
    	]
    },
    	"application/x-gca-compressed": {
    	source: "apache",
    	extensions: [
    		"gca"
    	]
    },
    	"application/x-glulx": {
    	source: "apache",
    	extensions: [
    		"ulx"
    	]
    },
    	"application/x-gnumeric": {
    	source: "apache",
    	extensions: [
    		"gnumeric"
    	]
    },
    	"application/x-gramps-xml": {
    	source: "apache",
    	extensions: [
    		"gramps"
    	]
    },
    	"application/x-gtar": {
    	source: "apache",
    	extensions: [
    		"gtar"
    	]
    },
    	"application/x-gzip": {
    	source: "apache"
    },
    	"application/x-hdf": {
    	source: "apache",
    	extensions: [
    		"hdf"
    	]
    },
    	"application/x-httpd-php": {
    	compressible: true,
    	extensions: [
    		"php"
    	]
    },
    	"application/x-install-instructions": {
    	source: "apache",
    	extensions: [
    		"install"
    	]
    },
    	"application/x-iso9660-image": {
    	source: "apache",
    	extensions: [
    		"iso"
    	]
    },
    	"application/x-iwork-keynote-sffkey": {
    	extensions: [
    		"key"
    	]
    },
    	"application/x-iwork-numbers-sffnumbers": {
    	extensions: [
    		"numbers"
    	]
    },
    	"application/x-iwork-pages-sffpages": {
    	extensions: [
    		"pages"
    	]
    },
    	"application/x-java-archive-diff": {
    	source: "nginx",
    	extensions: [
    		"jardiff"
    	]
    },
    	"application/x-java-jnlp-file": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"jnlp"
    	]
    },
    	"application/x-javascript": {
    	compressible: true
    },
    	"application/x-keepass2": {
    	extensions: [
    		"kdbx"
    	]
    },
    	"application/x-latex": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"latex"
    	]
    },
    	"application/x-lua-bytecode": {
    	extensions: [
    		"luac"
    	]
    },
    	"application/x-lzh-compressed": {
    	source: "apache",
    	extensions: [
    		"lzh",
    		"lha"
    	]
    },
    	"application/x-makeself": {
    	source: "nginx",
    	extensions: [
    		"run"
    	]
    },
    	"application/x-mie": {
    	source: "apache",
    	extensions: [
    		"mie"
    	]
    },
    	"application/x-mobipocket-ebook": {
    	source: "apache",
    	extensions: [
    		"prc",
    		"mobi"
    	]
    },
    	"application/x-mpegurl": {
    	compressible: false
    },
    	"application/x-ms-application": {
    	source: "apache",
    	extensions: [
    		"application"
    	]
    },
    	"application/x-ms-shortcut": {
    	source: "apache",
    	extensions: [
    		"lnk"
    	]
    },
    	"application/x-ms-wmd": {
    	source: "apache",
    	extensions: [
    		"wmd"
    	]
    },
    	"application/x-ms-wmz": {
    	source: "apache",
    	extensions: [
    		"wmz"
    	]
    },
    	"application/x-ms-xbap": {
    	source: "apache",
    	extensions: [
    		"xbap"
    	]
    },
    	"application/x-msaccess": {
    	source: "apache",
    	extensions: [
    		"mdb"
    	]
    },
    	"application/x-msbinder": {
    	source: "apache",
    	extensions: [
    		"obd"
    	]
    },
    	"application/x-mscardfile": {
    	source: "apache",
    	extensions: [
    		"crd"
    	]
    },
    	"application/x-msclip": {
    	source: "apache",
    	extensions: [
    		"clp"
    	]
    },
    	"application/x-msdos-program": {
    	extensions: [
    		"exe"
    	]
    },
    	"application/x-msdownload": {
    	source: "apache",
    	extensions: [
    		"exe",
    		"dll",
    		"com",
    		"bat",
    		"msi"
    	]
    },
    	"application/x-msmediaview": {
    	source: "apache",
    	extensions: [
    		"mvb",
    		"m13",
    		"m14"
    	]
    },
    	"application/x-msmetafile": {
    	source: "apache",
    	extensions: [
    		"wmf",
    		"wmz",
    		"emf",
    		"emz"
    	]
    },
    	"application/x-msmoney": {
    	source: "apache",
    	extensions: [
    		"mny"
    	]
    },
    	"application/x-mspublisher": {
    	source: "apache",
    	extensions: [
    		"pub"
    	]
    },
    	"application/x-msschedule": {
    	source: "apache",
    	extensions: [
    		"scd"
    	]
    },
    	"application/x-msterminal": {
    	source: "apache",
    	extensions: [
    		"trm"
    	]
    },
    	"application/x-mswrite": {
    	source: "apache",
    	extensions: [
    		"wri"
    	]
    },
    	"application/x-netcdf": {
    	source: "apache",
    	extensions: [
    		"nc",
    		"cdf"
    	]
    },
    	"application/x-ns-proxy-autoconfig": {
    	compressible: true,
    	extensions: [
    		"pac"
    	]
    },
    	"application/x-nzb": {
    	source: "apache",
    	extensions: [
    		"nzb"
    	]
    },
    	"application/x-perl": {
    	source: "nginx",
    	extensions: [
    		"pl",
    		"pm"
    	]
    },
    	"application/x-pilot": {
    	source: "nginx",
    	extensions: [
    		"prc",
    		"pdb"
    	]
    },
    	"application/x-pkcs12": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"p12",
    		"pfx"
    	]
    },
    	"application/x-pkcs7-certificates": {
    	source: "apache",
    	extensions: [
    		"p7b",
    		"spc"
    	]
    },
    	"application/x-pkcs7-certreqresp": {
    	source: "apache",
    	extensions: [
    		"p7r"
    	]
    },
    	"application/x-pki-message": {
    	source: "iana"
    },
    	"application/x-rar-compressed": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"rar"
    	]
    },
    	"application/x-redhat-package-manager": {
    	source: "nginx",
    	extensions: [
    		"rpm"
    	]
    },
    	"application/x-research-info-systems": {
    	source: "apache",
    	extensions: [
    		"ris"
    	]
    },
    	"application/x-sea": {
    	source: "nginx",
    	extensions: [
    		"sea"
    	]
    },
    	"application/x-sh": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"sh"
    	]
    },
    	"application/x-shar": {
    	source: "apache",
    	extensions: [
    		"shar"
    	]
    },
    	"application/x-shockwave-flash": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"swf"
    	]
    },
    	"application/x-silverlight-app": {
    	source: "apache",
    	extensions: [
    		"xap"
    	]
    },
    	"application/x-sql": {
    	source: "apache",
    	extensions: [
    		"sql"
    	]
    },
    	"application/x-stuffit": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"sit"
    	]
    },
    	"application/x-stuffitx": {
    	source: "apache",
    	extensions: [
    		"sitx"
    	]
    },
    	"application/x-subrip": {
    	source: "apache",
    	extensions: [
    		"srt"
    	]
    },
    	"application/x-sv4cpio": {
    	source: "apache",
    	extensions: [
    		"sv4cpio"
    	]
    },
    	"application/x-sv4crc": {
    	source: "apache",
    	extensions: [
    		"sv4crc"
    	]
    },
    	"application/x-t3vm-image": {
    	source: "apache",
    	extensions: [
    		"t3"
    	]
    },
    	"application/x-tads": {
    	source: "apache",
    	extensions: [
    		"gam"
    	]
    },
    	"application/x-tar": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"tar"
    	]
    },
    	"application/x-tcl": {
    	source: "apache",
    	extensions: [
    		"tcl",
    		"tk"
    	]
    },
    	"application/x-tex": {
    	source: "apache",
    	extensions: [
    		"tex"
    	]
    },
    	"application/x-tex-tfm": {
    	source: "apache",
    	extensions: [
    		"tfm"
    	]
    },
    	"application/x-texinfo": {
    	source: "apache",
    	extensions: [
    		"texinfo",
    		"texi"
    	]
    },
    	"application/x-tgif": {
    	source: "apache",
    	extensions: [
    		"obj"
    	]
    },
    	"application/x-ustar": {
    	source: "apache",
    	extensions: [
    		"ustar"
    	]
    },
    	"application/x-virtualbox-hdd": {
    	compressible: true,
    	extensions: [
    		"hdd"
    	]
    },
    	"application/x-virtualbox-ova": {
    	compressible: true,
    	extensions: [
    		"ova"
    	]
    },
    	"application/x-virtualbox-ovf": {
    	compressible: true,
    	extensions: [
    		"ovf"
    	]
    },
    	"application/x-virtualbox-vbox": {
    	compressible: true,
    	extensions: [
    		"vbox"
    	]
    },
    	"application/x-virtualbox-vbox-extpack": {
    	compressible: false,
    	extensions: [
    		"vbox-extpack"
    	]
    },
    	"application/x-virtualbox-vdi": {
    	compressible: true,
    	extensions: [
    		"vdi"
    	]
    },
    	"application/x-virtualbox-vhd": {
    	compressible: true,
    	extensions: [
    		"vhd"
    	]
    },
    	"application/x-virtualbox-vmdk": {
    	compressible: true,
    	extensions: [
    		"vmdk"
    	]
    },
    	"application/x-wais-source": {
    	source: "apache",
    	extensions: [
    		"src"
    	]
    },
    	"application/x-web-app-manifest+json": {
    	compressible: true,
    	extensions: [
    		"webapp"
    	]
    },
    	"application/x-www-form-urlencoded": {
    	source: "iana",
    	compressible: true
    },
    	"application/x-x509-ca-cert": {
    	source: "iana",
    	extensions: [
    		"der",
    		"crt",
    		"pem"
    	]
    },
    	"application/x-x509-ca-ra-cert": {
    	source: "iana"
    },
    	"application/x-x509-next-ca-cert": {
    	source: "iana"
    },
    	"application/x-xfig": {
    	source: "apache",
    	extensions: [
    		"fig"
    	]
    },
    	"application/x-xliff+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"xlf"
    	]
    },
    	"application/x-xpinstall": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"xpi"
    	]
    },
    	"application/x-xz": {
    	source: "apache",
    	extensions: [
    		"xz"
    	]
    },
    	"application/x-zmachine": {
    	source: "apache",
    	extensions: [
    		"z1",
    		"z2",
    		"z3",
    		"z4",
    		"z5",
    		"z6",
    		"z7",
    		"z8"
    	]
    },
    	"application/x400-bp": {
    	source: "iana"
    },
    	"application/xacml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xaml+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"xaml"
    	]
    },
    	"application/xcap-att+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xav"
    	]
    },
    	"application/xcap-caps+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xca"
    	]
    },
    	"application/xcap-diff+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xdf"
    	]
    },
    	"application/xcap-el+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xel"
    	]
    },
    	"application/xcap-error+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xcap-ns+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xns"
    	]
    },
    	"application/xcon-conference-info+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xcon-conference-info-diff+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xenc+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xenc"
    	]
    },
    	"application/xhtml+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xhtml",
    		"xht"
    	]
    },
    	"application/xhtml-voice+xml": {
    	source: "apache",
    	compressible: true
    },
    	"application/xliff+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xlf"
    	]
    },
    	"application/xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xml",
    		"xsl",
    		"xsd",
    		"rng"
    	]
    },
    	"application/xml-dtd": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"dtd"
    	]
    },
    	"application/xml-external-parsed-entity": {
    	source: "iana"
    },
    	"application/xml-patch+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xmpp+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/xop+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xop"
    	]
    },
    	"application/xproc+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"xpl"
    	]
    },
    	"application/xslt+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xsl",
    		"xslt"
    	]
    },
    	"application/xspf+xml": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"xspf"
    	]
    },
    	"application/xv+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"mxml",
    		"xhvml",
    		"xvml",
    		"xvm"
    	]
    },
    	"application/yang": {
    	source: "iana",
    	extensions: [
    		"yang"
    	]
    },
    	"application/yang-data+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/yang-data+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/yang-patch+json": {
    	source: "iana",
    	compressible: true
    },
    	"application/yang-patch+xml": {
    	source: "iana",
    	compressible: true
    },
    	"application/yin+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"yin"
    	]
    },
    	"application/zip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"zip"
    	]
    },
    	"application/zlib": {
    	source: "iana"
    },
    	"application/zstd": {
    	source: "iana"
    },
    	"audio/1d-interleaved-parityfec": {
    	source: "iana"
    },
    	"audio/32kadpcm": {
    	source: "iana"
    },
    	"audio/3gpp": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"3gpp"
    	]
    },
    	"audio/3gpp2": {
    	source: "iana"
    },
    	"audio/aac": {
    	source: "iana"
    },
    	"audio/ac3": {
    	source: "iana"
    },
    	"audio/adpcm": {
    	source: "apache",
    	extensions: [
    		"adp"
    	]
    },
    	"audio/amr": {
    	source: "iana",
    	extensions: [
    		"amr"
    	]
    },
    	"audio/amr-wb": {
    	source: "iana"
    },
    	"audio/amr-wb+": {
    	source: "iana"
    },
    	"audio/aptx": {
    	source: "iana"
    },
    	"audio/asc": {
    	source: "iana"
    },
    	"audio/atrac-advanced-lossless": {
    	source: "iana"
    },
    	"audio/atrac-x": {
    	source: "iana"
    },
    	"audio/atrac3": {
    	source: "iana"
    },
    	"audio/basic": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"au",
    		"snd"
    	]
    },
    	"audio/bv16": {
    	source: "iana"
    },
    	"audio/bv32": {
    	source: "iana"
    },
    	"audio/clearmode": {
    	source: "iana"
    },
    	"audio/cn": {
    	source: "iana"
    },
    	"audio/dat12": {
    	source: "iana"
    },
    	"audio/dls": {
    	source: "iana"
    },
    	"audio/dsr-es201108": {
    	source: "iana"
    },
    	"audio/dsr-es202050": {
    	source: "iana"
    },
    	"audio/dsr-es202211": {
    	source: "iana"
    },
    	"audio/dsr-es202212": {
    	source: "iana"
    },
    	"audio/dv": {
    	source: "iana"
    },
    	"audio/dvi4": {
    	source: "iana"
    },
    	"audio/eac3": {
    	source: "iana"
    },
    	"audio/encaprtp": {
    	source: "iana"
    },
    	"audio/evrc": {
    	source: "iana"
    },
    	"audio/evrc-qcp": {
    	source: "iana"
    },
    	"audio/evrc0": {
    	source: "iana"
    },
    	"audio/evrc1": {
    	source: "iana"
    },
    	"audio/evrcb": {
    	source: "iana"
    },
    	"audio/evrcb0": {
    	source: "iana"
    },
    	"audio/evrcb1": {
    	source: "iana"
    },
    	"audio/evrcnw": {
    	source: "iana"
    },
    	"audio/evrcnw0": {
    	source: "iana"
    },
    	"audio/evrcnw1": {
    	source: "iana"
    },
    	"audio/evrcwb": {
    	source: "iana"
    },
    	"audio/evrcwb0": {
    	source: "iana"
    },
    	"audio/evrcwb1": {
    	source: "iana"
    },
    	"audio/evs": {
    	source: "iana"
    },
    	"audio/flexfec": {
    	source: "iana"
    },
    	"audio/fwdred": {
    	source: "iana"
    },
    	"audio/g711-0": {
    	source: "iana"
    },
    	"audio/g719": {
    	source: "iana"
    },
    	"audio/g722": {
    	source: "iana"
    },
    	"audio/g7221": {
    	source: "iana"
    },
    	"audio/g723": {
    	source: "iana"
    },
    	"audio/g726-16": {
    	source: "iana"
    },
    	"audio/g726-24": {
    	source: "iana"
    },
    	"audio/g726-32": {
    	source: "iana"
    },
    	"audio/g726-40": {
    	source: "iana"
    },
    	"audio/g728": {
    	source: "iana"
    },
    	"audio/g729": {
    	source: "iana"
    },
    	"audio/g7291": {
    	source: "iana"
    },
    	"audio/g729d": {
    	source: "iana"
    },
    	"audio/g729e": {
    	source: "iana"
    },
    	"audio/gsm": {
    	source: "iana"
    },
    	"audio/gsm-efr": {
    	source: "iana"
    },
    	"audio/gsm-hr-08": {
    	source: "iana"
    },
    	"audio/ilbc": {
    	source: "iana"
    },
    	"audio/ip-mr_v2.5": {
    	source: "iana"
    },
    	"audio/isac": {
    	source: "apache"
    },
    	"audio/l16": {
    	source: "iana"
    },
    	"audio/l20": {
    	source: "iana"
    },
    	"audio/l24": {
    	source: "iana",
    	compressible: false
    },
    	"audio/l8": {
    	source: "iana"
    },
    	"audio/lpc": {
    	source: "iana"
    },
    	"audio/melp": {
    	source: "iana"
    },
    	"audio/melp1200": {
    	source: "iana"
    },
    	"audio/melp2400": {
    	source: "iana"
    },
    	"audio/melp600": {
    	source: "iana"
    },
    	"audio/mhas": {
    	source: "iana"
    },
    	"audio/midi": {
    	source: "apache",
    	extensions: [
    		"mid",
    		"midi",
    		"kar",
    		"rmi"
    	]
    },
    	"audio/mobile-xmf": {
    	source: "iana",
    	extensions: [
    		"mxmf"
    	]
    },
    	"audio/mp3": {
    	compressible: false,
    	extensions: [
    		"mp3"
    	]
    },
    	"audio/mp4": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"m4a",
    		"mp4a"
    	]
    },
    	"audio/mp4a-latm": {
    	source: "iana"
    },
    	"audio/mpa": {
    	source: "iana"
    },
    	"audio/mpa-robust": {
    	source: "iana"
    },
    	"audio/mpeg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"mpga",
    		"mp2",
    		"mp2a",
    		"mp3",
    		"m2a",
    		"m3a"
    	]
    },
    	"audio/mpeg4-generic": {
    	source: "iana"
    },
    	"audio/musepack": {
    	source: "apache"
    },
    	"audio/ogg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"oga",
    		"ogg",
    		"spx",
    		"opus"
    	]
    },
    	"audio/opus": {
    	source: "iana"
    },
    	"audio/parityfec": {
    	source: "iana"
    },
    	"audio/pcma": {
    	source: "iana"
    },
    	"audio/pcma-wb": {
    	source: "iana"
    },
    	"audio/pcmu": {
    	source: "iana"
    },
    	"audio/pcmu-wb": {
    	source: "iana"
    },
    	"audio/prs.sid": {
    	source: "iana"
    },
    	"audio/qcelp": {
    	source: "iana"
    },
    	"audio/raptorfec": {
    	source: "iana"
    },
    	"audio/red": {
    	source: "iana"
    },
    	"audio/rtp-enc-aescm128": {
    	source: "iana"
    },
    	"audio/rtp-midi": {
    	source: "iana"
    },
    	"audio/rtploopback": {
    	source: "iana"
    },
    	"audio/rtx": {
    	source: "iana"
    },
    	"audio/s3m": {
    	source: "apache",
    	extensions: [
    		"s3m"
    	]
    },
    	"audio/scip": {
    	source: "iana"
    },
    	"audio/silk": {
    	source: "apache",
    	extensions: [
    		"sil"
    	]
    },
    	"audio/smv": {
    	source: "iana"
    },
    	"audio/smv-qcp": {
    	source: "iana"
    },
    	"audio/smv0": {
    	source: "iana"
    },
    	"audio/sofa": {
    	source: "iana"
    },
    	"audio/sp-midi": {
    	source: "iana"
    },
    	"audio/speex": {
    	source: "iana"
    },
    	"audio/t140c": {
    	source: "iana"
    },
    	"audio/t38": {
    	source: "iana"
    },
    	"audio/telephone-event": {
    	source: "iana"
    },
    	"audio/tetra_acelp": {
    	source: "iana"
    },
    	"audio/tetra_acelp_bb": {
    	source: "iana"
    },
    	"audio/tone": {
    	source: "iana"
    },
    	"audio/tsvcis": {
    	source: "iana"
    },
    	"audio/uemclip": {
    	source: "iana"
    },
    	"audio/ulpfec": {
    	source: "iana"
    },
    	"audio/usac": {
    	source: "iana"
    },
    	"audio/vdvi": {
    	source: "iana"
    },
    	"audio/vmr-wb": {
    	source: "iana"
    },
    	"audio/vnd.3gpp.iufp": {
    	source: "iana"
    },
    	"audio/vnd.4sb": {
    	source: "iana"
    },
    	"audio/vnd.audiokoz": {
    	source: "iana"
    },
    	"audio/vnd.celp": {
    	source: "iana"
    },
    	"audio/vnd.cisco.nse": {
    	source: "iana"
    },
    	"audio/vnd.cmles.radio-events": {
    	source: "iana"
    },
    	"audio/vnd.cns.anp1": {
    	source: "iana"
    },
    	"audio/vnd.cns.inf1": {
    	source: "iana"
    },
    	"audio/vnd.dece.audio": {
    	source: "iana",
    	extensions: [
    		"uva",
    		"uvva"
    	]
    },
    	"audio/vnd.digital-winds": {
    	source: "iana",
    	extensions: [
    		"eol"
    	]
    },
    	"audio/vnd.dlna.adts": {
    	source: "iana"
    },
    	"audio/vnd.dolby.heaac.1": {
    	source: "iana"
    },
    	"audio/vnd.dolby.heaac.2": {
    	source: "iana"
    },
    	"audio/vnd.dolby.mlp": {
    	source: "iana"
    },
    	"audio/vnd.dolby.mps": {
    	source: "iana"
    },
    	"audio/vnd.dolby.pl2": {
    	source: "iana"
    },
    	"audio/vnd.dolby.pl2x": {
    	source: "iana"
    },
    	"audio/vnd.dolby.pl2z": {
    	source: "iana"
    },
    	"audio/vnd.dolby.pulse.1": {
    	source: "iana"
    },
    	"audio/vnd.dra": {
    	source: "iana",
    	extensions: [
    		"dra"
    	]
    },
    	"audio/vnd.dts": {
    	source: "iana",
    	extensions: [
    		"dts"
    	]
    },
    	"audio/vnd.dts.hd": {
    	source: "iana",
    	extensions: [
    		"dtshd"
    	]
    },
    	"audio/vnd.dts.uhd": {
    	source: "iana"
    },
    	"audio/vnd.dvb.file": {
    	source: "iana"
    },
    	"audio/vnd.everad.plj": {
    	source: "iana"
    },
    	"audio/vnd.hns.audio": {
    	source: "iana"
    },
    	"audio/vnd.lucent.voice": {
    	source: "iana",
    	extensions: [
    		"lvp"
    	]
    },
    	"audio/vnd.ms-playready.media.pya": {
    	source: "iana",
    	extensions: [
    		"pya"
    	]
    },
    	"audio/vnd.nokia.mobile-xmf": {
    	source: "iana"
    },
    	"audio/vnd.nortel.vbk": {
    	source: "iana"
    },
    	"audio/vnd.nuera.ecelp4800": {
    	source: "iana",
    	extensions: [
    		"ecelp4800"
    	]
    },
    	"audio/vnd.nuera.ecelp7470": {
    	source: "iana",
    	extensions: [
    		"ecelp7470"
    	]
    },
    	"audio/vnd.nuera.ecelp9600": {
    	source: "iana",
    	extensions: [
    		"ecelp9600"
    	]
    },
    	"audio/vnd.octel.sbc": {
    	source: "iana"
    },
    	"audio/vnd.presonus.multitrack": {
    	source: "iana"
    },
    	"audio/vnd.qcelp": {
    	source: "iana"
    },
    	"audio/vnd.rhetorex.32kadpcm": {
    	source: "iana"
    },
    	"audio/vnd.rip": {
    	source: "iana",
    	extensions: [
    		"rip"
    	]
    },
    	"audio/vnd.rn-realaudio": {
    	compressible: false
    },
    	"audio/vnd.sealedmedia.softseal.mpeg": {
    	source: "iana"
    },
    	"audio/vnd.vmx.cvsd": {
    	source: "iana"
    },
    	"audio/vnd.wave": {
    	compressible: false
    },
    	"audio/vorbis": {
    	source: "iana",
    	compressible: false
    },
    	"audio/vorbis-config": {
    	source: "iana"
    },
    	"audio/wav": {
    	compressible: false,
    	extensions: [
    		"wav"
    	]
    },
    	"audio/wave": {
    	compressible: false,
    	extensions: [
    		"wav"
    	]
    },
    	"audio/webm": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"weba"
    	]
    },
    	"audio/x-aac": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"aac"
    	]
    },
    	"audio/x-aiff": {
    	source: "apache",
    	extensions: [
    		"aif",
    		"aiff",
    		"aifc"
    	]
    },
    	"audio/x-caf": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"caf"
    	]
    },
    	"audio/x-flac": {
    	source: "apache",
    	extensions: [
    		"flac"
    	]
    },
    	"audio/x-m4a": {
    	source: "nginx",
    	extensions: [
    		"m4a"
    	]
    },
    	"audio/x-matroska": {
    	source: "apache",
    	extensions: [
    		"mka"
    	]
    },
    	"audio/x-mpegurl": {
    	source: "apache",
    	extensions: [
    		"m3u"
    	]
    },
    	"audio/x-ms-wax": {
    	source: "apache",
    	extensions: [
    		"wax"
    	]
    },
    	"audio/x-ms-wma": {
    	source: "apache",
    	extensions: [
    		"wma"
    	]
    },
    	"audio/x-pn-realaudio": {
    	source: "apache",
    	extensions: [
    		"ram",
    		"ra"
    	]
    },
    	"audio/x-pn-realaudio-plugin": {
    	source: "apache",
    	extensions: [
    		"rmp"
    	]
    },
    	"audio/x-realaudio": {
    	source: "nginx",
    	extensions: [
    		"ra"
    	]
    },
    	"audio/x-tta": {
    	source: "apache"
    },
    	"audio/x-wav": {
    	source: "apache",
    	extensions: [
    		"wav"
    	]
    },
    	"audio/xm": {
    	source: "apache",
    	extensions: [
    		"xm"
    	]
    },
    	"chemical/x-cdx": {
    	source: "apache",
    	extensions: [
    		"cdx"
    	]
    },
    	"chemical/x-cif": {
    	source: "apache",
    	extensions: [
    		"cif"
    	]
    },
    	"chemical/x-cmdf": {
    	source: "apache",
    	extensions: [
    		"cmdf"
    	]
    },
    	"chemical/x-cml": {
    	source: "apache",
    	extensions: [
    		"cml"
    	]
    },
    	"chemical/x-csml": {
    	source: "apache",
    	extensions: [
    		"csml"
    	]
    },
    	"chemical/x-pdb": {
    	source: "apache"
    },
    	"chemical/x-xyz": {
    	source: "apache",
    	extensions: [
    		"xyz"
    	]
    },
    	"font/collection": {
    	source: "iana",
    	extensions: [
    		"ttc"
    	]
    },
    	"font/otf": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"otf"
    	]
    },
    	"font/sfnt": {
    	source: "iana"
    },
    	"font/ttf": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ttf"
    	]
    },
    	"font/woff": {
    	source: "iana",
    	extensions: [
    		"woff"
    	]
    },
    	"font/woff2": {
    	source: "iana",
    	extensions: [
    		"woff2"
    	]
    },
    	"image/aces": {
    	source: "iana",
    	extensions: [
    		"exr"
    	]
    },
    	"image/apng": {
    	compressible: false,
    	extensions: [
    		"apng"
    	]
    },
    	"image/avci": {
    	source: "iana",
    	extensions: [
    		"avci"
    	]
    },
    	"image/avcs": {
    	source: "iana",
    	extensions: [
    		"avcs"
    	]
    },
    	"image/avif": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"avif"
    	]
    },
    	"image/bmp": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"bmp"
    	]
    },
    	"image/cgm": {
    	source: "iana",
    	extensions: [
    		"cgm"
    	]
    },
    	"image/dicom-rle": {
    	source: "iana",
    	extensions: [
    		"drle"
    	]
    },
    	"image/emf": {
    	source: "iana",
    	extensions: [
    		"emf"
    	]
    },
    	"image/fits": {
    	source: "iana",
    	extensions: [
    		"fits"
    	]
    },
    	"image/g3fax": {
    	source: "iana",
    	extensions: [
    		"g3"
    	]
    },
    	"image/gif": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"gif"
    	]
    },
    	"image/heic": {
    	source: "iana",
    	extensions: [
    		"heic"
    	]
    },
    	"image/heic-sequence": {
    	source: "iana",
    	extensions: [
    		"heics"
    	]
    },
    	"image/heif": {
    	source: "iana",
    	extensions: [
    		"heif"
    	]
    },
    	"image/heif-sequence": {
    	source: "iana",
    	extensions: [
    		"heifs"
    	]
    },
    	"image/hej2k": {
    	source: "iana",
    	extensions: [
    		"hej2"
    	]
    },
    	"image/hsj2": {
    	source: "iana",
    	extensions: [
    		"hsj2"
    	]
    },
    	"image/ief": {
    	source: "iana",
    	extensions: [
    		"ief"
    	]
    },
    	"image/jls": {
    	source: "iana",
    	extensions: [
    		"jls"
    	]
    },
    	"image/jp2": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"jp2",
    		"jpg2"
    	]
    },
    	"image/jpeg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"jpeg",
    		"jpg",
    		"jpe"
    	]
    },
    	"image/jph": {
    	source: "iana",
    	extensions: [
    		"jph"
    	]
    },
    	"image/jphc": {
    	source: "iana",
    	extensions: [
    		"jhc"
    	]
    },
    	"image/jpm": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"jpm"
    	]
    },
    	"image/jpx": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"jpx",
    		"jpf"
    	]
    },
    	"image/jxr": {
    	source: "iana",
    	extensions: [
    		"jxr"
    	]
    },
    	"image/jxra": {
    	source: "iana",
    	extensions: [
    		"jxra"
    	]
    },
    	"image/jxrs": {
    	source: "iana",
    	extensions: [
    		"jxrs"
    	]
    },
    	"image/jxs": {
    	source: "iana",
    	extensions: [
    		"jxs"
    	]
    },
    	"image/jxsc": {
    	source: "iana",
    	extensions: [
    		"jxsc"
    	]
    },
    	"image/jxsi": {
    	source: "iana",
    	extensions: [
    		"jxsi"
    	]
    },
    	"image/jxss": {
    	source: "iana",
    	extensions: [
    		"jxss"
    	]
    },
    	"image/ktx": {
    	source: "iana",
    	extensions: [
    		"ktx"
    	]
    },
    	"image/ktx2": {
    	source: "iana",
    	extensions: [
    		"ktx2"
    	]
    },
    	"image/naplps": {
    	source: "iana"
    },
    	"image/pjpeg": {
    	compressible: false
    },
    	"image/png": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"png"
    	]
    },
    	"image/prs.btif": {
    	source: "iana",
    	extensions: [
    		"btif"
    	]
    },
    	"image/prs.pti": {
    	source: "iana",
    	extensions: [
    		"pti"
    	]
    },
    	"image/pwg-raster": {
    	source: "iana"
    },
    	"image/sgi": {
    	source: "apache",
    	extensions: [
    		"sgi"
    	]
    },
    	"image/svg+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"svg",
    		"svgz"
    	]
    },
    	"image/t38": {
    	source: "iana",
    	extensions: [
    		"t38"
    	]
    },
    	"image/tiff": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"tif",
    		"tiff"
    	]
    },
    	"image/tiff-fx": {
    	source: "iana",
    	extensions: [
    		"tfx"
    	]
    },
    	"image/vnd.adobe.photoshop": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"psd"
    	]
    },
    	"image/vnd.airzip.accelerator.azv": {
    	source: "iana",
    	extensions: [
    		"azv"
    	]
    },
    	"image/vnd.cns.inf2": {
    	source: "iana"
    },
    	"image/vnd.dece.graphic": {
    	source: "iana",
    	extensions: [
    		"uvi",
    		"uvvi",
    		"uvg",
    		"uvvg"
    	]
    },
    	"image/vnd.djvu": {
    	source: "iana",
    	extensions: [
    		"djvu",
    		"djv"
    	]
    },
    	"image/vnd.dvb.subtitle": {
    	source: "iana",
    	extensions: [
    		"sub"
    	]
    },
    	"image/vnd.dwg": {
    	source: "iana",
    	extensions: [
    		"dwg"
    	]
    },
    	"image/vnd.dxf": {
    	source: "iana",
    	extensions: [
    		"dxf"
    	]
    },
    	"image/vnd.fastbidsheet": {
    	source: "iana",
    	extensions: [
    		"fbs"
    	]
    },
    	"image/vnd.fpx": {
    	source: "iana",
    	extensions: [
    		"fpx"
    	]
    },
    	"image/vnd.fst": {
    	source: "iana",
    	extensions: [
    		"fst"
    	]
    },
    	"image/vnd.fujixerox.edmics-mmr": {
    	source: "iana",
    	extensions: [
    		"mmr"
    	]
    },
    	"image/vnd.fujixerox.edmics-rlc": {
    	source: "iana",
    	extensions: [
    		"rlc"
    	]
    },
    	"image/vnd.globalgraphics.pgb": {
    	source: "iana"
    },
    	"image/vnd.microsoft.icon": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"ico"
    	]
    },
    	"image/vnd.mix": {
    	source: "iana"
    },
    	"image/vnd.mozilla.apng": {
    	source: "iana"
    },
    	"image/vnd.ms-dds": {
    	compressible: true,
    	extensions: [
    		"dds"
    	]
    },
    	"image/vnd.ms-modi": {
    	source: "iana",
    	extensions: [
    		"mdi"
    	]
    },
    	"image/vnd.ms-photo": {
    	source: "apache",
    	extensions: [
    		"wdp"
    	]
    },
    	"image/vnd.net-fpx": {
    	source: "iana",
    	extensions: [
    		"npx"
    	]
    },
    	"image/vnd.pco.b16": {
    	source: "iana",
    	extensions: [
    		"b16"
    	]
    },
    	"image/vnd.radiance": {
    	source: "iana"
    },
    	"image/vnd.sealed.png": {
    	source: "iana"
    },
    	"image/vnd.sealedmedia.softseal.gif": {
    	source: "iana"
    },
    	"image/vnd.sealedmedia.softseal.jpg": {
    	source: "iana"
    },
    	"image/vnd.svf": {
    	source: "iana"
    },
    	"image/vnd.tencent.tap": {
    	source: "iana",
    	extensions: [
    		"tap"
    	]
    },
    	"image/vnd.valve.source.texture": {
    	source: "iana",
    	extensions: [
    		"vtf"
    	]
    },
    	"image/vnd.wap.wbmp": {
    	source: "iana",
    	extensions: [
    		"wbmp"
    	]
    },
    	"image/vnd.xiff": {
    	source: "iana",
    	extensions: [
    		"xif"
    	]
    },
    	"image/vnd.zbrush.pcx": {
    	source: "iana",
    	extensions: [
    		"pcx"
    	]
    },
    	"image/webp": {
    	source: "apache",
    	extensions: [
    		"webp"
    	]
    },
    	"image/wmf": {
    	source: "iana",
    	extensions: [
    		"wmf"
    	]
    },
    	"image/x-3ds": {
    	source: "apache",
    	extensions: [
    		"3ds"
    	]
    },
    	"image/x-cmu-raster": {
    	source: "apache",
    	extensions: [
    		"ras"
    	]
    },
    	"image/x-cmx": {
    	source: "apache",
    	extensions: [
    		"cmx"
    	]
    },
    	"image/x-freehand": {
    	source: "apache",
    	extensions: [
    		"fh",
    		"fhc",
    		"fh4",
    		"fh5",
    		"fh7"
    	]
    },
    	"image/x-icon": {
    	source: "apache",
    	compressible: true,
    	extensions: [
    		"ico"
    	]
    },
    	"image/x-jng": {
    	source: "nginx",
    	extensions: [
    		"jng"
    	]
    },
    	"image/x-mrsid-image": {
    	source: "apache",
    	extensions: [
    		"sid"
    	]
    },
    	"image/x-ms-bmp": {
    	source: "nginx",
    	compressible: true,
    	extensions: [
    		"bmp"
    	]
    },
    	"image/x-pcx": {
    	source: "apache",
    	extensions: [
    		"pcx"
    	]
    },
    	"image/x-pict": {
    	source: "apache",
    	extensions: [
    		"pic",
    		"pct"
    	]
    },
    	"image/x-portable-anymap": {
    	source: "apache",
    	extensions: [
    		"pnm"
    	]
    },
    	"image/x-portable-bitmap": {
    	source: "apache",
    	extensions: [
    		"pbm"
    	]
    },
    	"image/x-portable-graymap": {
    	source: "apache",
    	extensions: [
    		"pgm"
    	]
    },
    	"image/x-portable-pixmap": {
    	source: "apache",
    	extensions: [
    		"ppm"
    	]
    },
    	"image/x-rgb": {
    	source: "apache",
    	extensions: [
    		"rgb"
    	]
    },
    	"image/x-tga": {
    	source: "apache",
    	extensions: [
    		"tga"
    	]
    },
    	"image/x-xbitmap": {
    	source: "apache",
    	extensions: [
    		"xbm"
    	]
    },
    	"image/x-xcf": {
    	compressible: false
    },
    	"image/x-xpixmap": {
    	source: "apache",
    	extensions: [
    		"xpm"
    	]
    },
    	"image/x-xwindowdump": {
    	source: "apache",
    	extensions: [
    		"xwd"
    	]
    },
    	"message/cpim": {
    	source: "iana"
    },
    	"message/delivery-status": {
    	source: "iana"
    },
    	"message/disposition-notification": {
    	source: "iana",
    	extensions: [
    		"disposition-notification"
    	]
    },
    	"message/external-body": {
    	source: "iana"
    },
    	"message/feedback-report": {
    	source: "iana"
    },
    	"message/global": {
    	source: "iana",
    	extensions: [
    		"u8msg"
    	]
    },
    	"message/global-delivery-status": {
    	source: "iana",
    	extensions: [
    		"u8dsn"
    	]
    },
    	"message/global-disposition-notification": {
    	source: "iana",
    	extensions: [
    		"u8mdn"
    	]
    },
    	"message/global-headers": {
    	source: "iana",
    	extensions: [
    		"u8hdr"
    	]
    },
    	"message/http": {
    	source: "iana",
    	compressible: false
    },
    	"message/imdn+xml": {
    	source: "iana",
    	compressible: true
    },
    	"message/news": {
    	source: "iana"
    },
    	"message/partial": {
    	source: "iana",
    	compressible: false
    },
    	"message/rfc822": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"eml",
    		"mime"
    	]
    },
    	"message/s-http": {
    	source: "iana"
    },
    	"message/sip": {
    	source: "iana"
    },
    	"message/sipfrag": {
    	source: "iana"
    },
    	"message/tracking-status": {
    	source: "iana"
    },
    	"message/vnd.si.simp": {
    	source: "iana"
    },
    	"message/vnd.wfa.wsc": {
    	source: "iana",
    	extensions: [
    		"wsc"
    	]
    },
    	"model/3mf": {
    	source: "iana",
    	extensions: [
    		"3mf"
    	]
    },
    	"model/e57": {
    	source: "iana"
    },
    	"model/gltf+json": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"gltf"
    	]
    },
    	"model/gltf-binary": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"glb"
    	]
    },
    	"model/iges": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"igs",
    		"iges"
    	]
    },
    	"model/mesh": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"msh",
    		"mesh",
    		"silo"
    	]
    },
    	"model/mtl": {
    	source: "iana",
    	extensions: [
    		"mtl"
    	]
    },
    	"model/obj": {
    	source: "iana",
    	extensions: [
    		"obj"
    	]
    },
    	"model/step": {
    	source: "iana"
    },
    	"model/step+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"stpx"
    	]
    },
    	"model/step+zip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"stpz"
    	]
    },
    	"model/step-xml+zip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"stpxz"
    	]
    },
    	"model/stl": {
    	source: "iana",
    	extensions: [
    		"stl"
    	]
    },
    	"model/vnd.collada+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"dae"
    	]
    },
    	"model/vnd.dwf": {
    	source: "iana",
    	extensions: [
    		"dwf"
    	]
    },
    	"model/vnd.flatland.3dml": {
    	source: "iana"
    },
    	"model/vnd.gdl": {
    	source: "iana",
    	extensions: [
    		"gdl"
    	]
    },
    	"model/vnd.gs-gdl": {
    	source: "apache"
    },
    	"model/vnd.gs.gdl": {
    	source: "iana"
    },
    	"model/vnd.gtw": {
    	source: "iana",
    	extensions: [
    		"gtw"
    	]
    },
    	"model/vnd.moml+xml": {
    	source: "iana",
    	compressible: true
    },
    	"model/vnd.mts": {
    	source: "iana",
    	extensions: [
    		"mts"
    	]
    },
    	"model/vnd.opengex": {
    	source: "iana",
    	extensions: [
    		"ogex"
    	]
    },
    	"model/vnd.parasolid.transmit.binary": {
    	source: "iana",
    	extensions: [
    		"x_b"
    	]
    },
    	"model/vnd.parasolid.transmit.text": {
    	source: "iana",
    	extensions: [
    		"x_t"
    	]
    },
    	"model/vnd.pytha.pyox": {
    	source: "iana"
    },
    	"model/vnd.rosette.annotated-data-model": {
    	source: "iana"
    },
    	"model/vnd.sap.vds": {
    	source: "iana",
    	extensions: [
    		"vds"
    	]
    },
    	"model/vnd.usdz+zip": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"usdz"
    	]
    },
    	"model/vnd.valve.source.compiled-map": {
    	source: "iana",
    	extensions: [
    		"bsp"
    	]
    },
    	"model/vnd.vtu": {
    	source: "iana",
    	extensions: [
    		"vtu"
    	]
    },
    	"model/vrml": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"wrl",
    		"vrml"
    	]
    },
    	"model/x3d+binary": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"x3db",
    		"x3dbz"
    	]
    },
    	"model/x3d+fastinfoset": {
    	source: "iana",
    	extensions: [
    		"x3db"
    	]
    },
    	"model/x3d+vrml": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"x3dv",
    		"x3dvz"
    	]
    },
    	"model/x3d+xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"x3d",
    		"x3dz"
    	]
    },
    	"model/x3d-vrml": {
    	source: "iana",
    	extensions: [
    		"x3dv"
    	]
    },
    	"multipart/alternative": {
    	source: "iana",
    	compressible: false
    },
    	"multipart/appledouble": {
    	source: "iana"
    },
    	"multipart/byteranges": {
    	source: "iana"
    },
    	"multipart/digest": {
    	source: "iana"
    },
    	"multipart/encrypted": {
    	source: "iana",
    	compressible: false
    },
    	"multipart/form-data": {
    	source: "iana",
    	compressible: false
    },
    	"multipart/header-set": {
    	source: "iana"
    },
    	"multipart/mixed": {
    	source: "iana"
    },
    	"multipart/multilingual": {
    	source: "iana"
    },
    	"multipart/parallel": {
    	source: "iana"
    },
    	"multipart/related": {
    	source: "iana",
    	compressible: false
    },
    	"multipart/report": {
    	source: "iana"
    },
    	"multipart/signed": {
    	source: "iana",
    	compressible: false
    },
    	"multipart/vnd.bint.med-plus": {
    	source: "iana"
    },
    	"multipart/voice-message": {
    	source: "iana"
    },
    	"multipart/x-mixed-replace": {
    	source: "iana"
    },
    	"text/1d-interleaved-parityfec": {
    	source: "iana"
    },
    	"text/cache-manifest": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"appcache",
    		"manifest"
    	]
    },
    	"text/calendar": {
    	source: "iana",
    	extensions: [
    		"ics",
    		"ifb"
    	]
    },
    	"text/calender": {
    	compressible: true
    },
    	"text/cmd": {
    	compressible: true
    },
    	"text/coffeescript": {
    	extensions: [
    		"coffee",
    		"litcoffee"
    	]
    },
    	"text/cql": {
    	source: "iana"
    },
    	"text/cql-expression": {
    	source: "iana"
    },
    	"text/cql-identifier": {
    	source: "iana"
    },
    	"text/css": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"css"
    	]
    },
    	"text/csv": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"csv"
    	]
    },
    	"text/csv-schema": {
    	source: "iana"
    },
    	"text/directory": {
    	source: "iana"
    },
    	"text/dns": {
    	source: "iana"
    },
    	"text/ecmascript": {
    	source: "iana"
    },
    	"text/encaprtp": {
    	source: "iana"
    },
    	"text/enriched": {
    	source: "iana"
    },
    	"text/fhirpath": {
    	source: "iana"
    },
    	"text/flexfec": {
    	source: "iana"
    },
    	"text/fwdred": {
    	source: "iana"
    },
    	"text/gff3": {
    	source: "iana"
    },
    	"text/grammar-ref-list": {
    	source: "iana"
    },
    	"text/html": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"html",
    		"htm",
    		"shtml"
    	]
    },
    	"text/jade": {
    	extensions: [
    		"jade"
    	]
    },
    	"text/javascript": {
    	source: "iana",
    	compressible: true
    },
    	"text/jcr-cnd": {
    	source: "iana"
    },
    	"text/jsx": {
    	compressible: true,
    	extensions: [
    		"jsx"
    	]
    },
    	"text/less": {
    	compressible: true,
    	extensions: [
    		"less"
    	]
    },
    	"text/markdown": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"markdown",
    		"md"
    	]
    },
    	"text/mathml": {
    	source: "nginx",
    	extensions: [
    		"mml"
    	]
    },
    	"text/mdx": {
    	compressible: true,
    	extensions: [
    		"mdx"
    	]
    },
    	"text/mizar": {
    	source: "iana"
    },
    	"text/n3": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"n3"
    	]
    },
    	"text/parameters": {
    	source: "iana",
    	charset: "UTF-8"
    },
    	"text/parityfec": {
    	source: "iana"
    },
    	"text/plain": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"txt",
    		"text",
    		"conf",
    		"def",
    		"list",
    		"log",
    		"in",
    		"ini"
    	]
    },
    	"text/provenance-notation": {
    	source: "iana",
    	charset: "UTF-8"
    },
    	"text/prs.fallenstein.rst": {
    	source: "iana"
    },
    	"text/prs.lines.tag": {
    	source: "iana",
    	extensions: [
    		"dsc"
    	]
    },
    	"text/prs.prop.logic": {
    	source: "iana"
    },
    	"text/raptorfec": {
    	source: "iana"
    },
    	"text/red": {
    	source: "iana"
    },
    	"text/rfc822-headers": {
    	source: "iana"
    },
    	"text/richtext": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rtx"
    	]
    },
    	"text/rtf": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"rtf"
    	]
    },
    	"text/rtp-enc-aescm128": {
    	source: "iana"
    },
    	"text/rtploopback": {
    	source: "iana"
    },
    	"text/rtx": {
    	source: "iana"
    },
    	"text/sgml": {
    	source: "iana",
    	extensions: [
    		"sgml",
    		"sgm"
    	]
    },
    	"text/shaclc": {
    	source: "iana"
    },
    	"text/shex": {
    	source: "iana",
    	extensions: [
    		"shex"
    	]
    },
    	"text/slim": {
    	extensions: [
    		"slim",
    		"slm"
    	]
    },
    	"text/spdx": {
    	source: "iana",
    	extensions: [
    		"spdx"
    	]
    },
    	"text/strings": {
    	source: "iana"
    },
    	"text/stylus": {
    	extensions: [
    		"stylus",
    		"styl"
    	]
    },
    	"text/t140": {
    	source: "iana"
    },
    	"text/tab-separated-values": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"tsv"
    	]
    },
    	"text/troff": {
    	source: "iana",
    	extensions: [
    		"t",
    		"tr",
    		"roff",
    		"man",
    		"me",
    		"ms"
    	]
    },
    	"text/turtle": {
    	source: "iana",
    	charset: "UTF-8",
    	extensions: [
    		"ttl"
    	]
    },
    	"text/ulpfec": {
    	source: "iana"
    },
    	"text/uri-list": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"uri",
    		"uris",
    		"urls"
    	]
    },
    	"text/vcard": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"vcard"
    	]
    },
    	"text/vnd.a": {
    	source: "iana"
    },
    	"text/vnd.abc": {
    	source: "iana"
    },
    	"text/vnd.ascii-art": {
    	source: "iana"
    },
    	"text/vnd.curl": {
    	source: "iana",
    	extensions: [
    		"curl"
    	]
    },
    	"text/vnd.curl.dcurl": {
    	source: "apache",
    	extensions: [
    		"dcurl"
    	]
    },
    	"text/vnd.curl.mcurl": {
    	source: "apache",
    	extensions: [
    		"mcurl"
    	]
    },
    	"text/vnd.curl.scurl": {
    	source: "apache",
    	extensions: [
    		"scurl"
    	]
    },
    	"text/vnd.debian.copyright": {
    	source: "iana",
    	charset: "UTF-8"
    },
    	"text/vnd.dmclientscript": {
    	source: "iana"
    },
    	"text/vnd.dvb.subtitle": {
    	source: "iana",
    	extensions: [
    		"sub"
    	]
    },
    	"text/vnd.esmertec.theme-descriptor": {
    	source: "iana",
    	charset: "UTF-8"
    },
    	"text/vnd.familysearch.gedcom": {
    	source: "iana",
    	extensions: [
    		"ged"
    	]
    },
    	"text/vnd.ficlab.flt": {
    	source: "iana"
    },
    	"text/vnd.fly": {
    	source: "iana",
    	extensions: [
    		"fly"
    	]
    },
    	"text/vnd.fmi.flexstor": {
    	source: "iana",
    	extensions: [
    		"flx"
    	]
    },
    	"text/vnd.gml": {
    	source: "iana"
    },
    	"text/vnd.graphviz": {
    	source: "iana",
    	extensions: [
    		"gv"
    	]
    },
    	"text/vnd.hans": {
    	source: "iana"
    },
    	"text/vnd.hgl": {
    	source: "iana"
    },
    	"text/vnd.in3d.3dml": {
    	source: "iana",
    	extensions: [
    		"3dml"
    	]
    },
    	"text/vnd.in3d.spot": {
    	source: "iana",
    	extensions: [
    		"spot"
    	]
    },
    	"text/vnd.iptc.newsml": {
    	source: "iana"
    },
    	"text/vnd.iptc.nitf": {
    	source: "iana"
    },
    	"text/vnd.latex-z": {
    	source: "iana"
    },
    	"text/vnd.motorola.reflex": {
    	source: "iana"
    },
    	"text/vnd.ms-mediapackage": {
    	source: "iana"
    },
    	"text/vnd.net2phone.commcenter.command": {
    	source: "iana"
    },
    	"text/vnd.radisys.msml-basic-layout": {
    	source: "iana"
    },
    	"text/vnd.senx.warpscript": {
    	source: "iana"
    },
    	"text/vnd.si.uricatalogue": {
    	source: "iana"
    },
    	"text/vnd.sosi": {
    	source: "iana"
    },
    	"text/vnd.sun.j2me.app-descriptor": {
    	source: "iana",
    	charset: "UTF-8",
    	extensions: [
    		"jad"
    	]
    },
    	"text/vnd.trolltech.linguist": {
    	source: "iana",
    	charset: "UTF-8"
    },
    	"text/vnd.wap.si": {
    	source: "iana"
    },
    	"text/vnd.wap.sl": {
    	source: "iana"
    },
    	"text/vnd.wap.wml": {
    	source: "iana",
    	extensions: [
    		"wml"
    	]
    },
    	"text/vnd.wap.wmlscript": {
    	source: "iana",
    	extensions: [
    		"wmls"
    	]
    },
    	"text/vtt": {
    	source: "iana",
    	charset: "UTF-8",
    	compressible: true,
    	extensions: [
    		"vtt"
    	]
    },
    	"text/x-asm": {
    	source: "apache",
    	extensions: [
    		"s",
    		"asm"
    	]
    },
    	"text/x-c": {
    	source: "apache",
    	extensions: [
    		"c",
    		"cc",
    		"cxx",
    		"cpp",
    		"h",
    		"hh",
    		"dic"
    	]
    },
    	"text/x-component": {
    	source: "nginx",
    	extensions: [
    		"htc"
    	]
    },
    	"text/x-fortran": {
    	source: "apache",
    	extensions: [
    		"f",
    		"for",
    		"f77",
    		"f90"
    	]
    },
    	"text/x-gwt-rpc": {
    	compressible: true
    },
    	"text/x-handlebars-template": {
    	extensions: [
    		"hbs"
    	]
    },
    	"text/x-java-source": {
    	source: "apache",
    	extensions: [
    		"java"
    	]
    },
    	"text/x-jquery-tmpl": {
    	compressible: true
    },
    	"text/x-lua": {
    	extensions: [
    		"lua"
    	]
    },
    	"text/x-markdown": {
    	compressible: true,
    	extensions: [
    		"mkd"
    	]
    },
    	"text/x-nfo": {
    	source: "apache",
    	extensions: [
    		"nfo"
    	]
    },
    	"text/x-opml": {
    	source: "apache",
    	extensions: [
    		"opml"
    	]
    },
    	"text/x-org": {
    	compressible: true,
    	extensions: [
    		"org"
    	]
    },
    	"text/x-pascal": {
    	source: "apache",
    	extensions: [
    		"p",
    		"pas"
    	]
    },
    	"text/x-processing": {
    	compressible: true,
    	extensions: [
    		"pde"
    	]
    },
    	"text/x-sass": {
    	extensions: [
    		"sass"
    	]
    },
    	"text/x-scss": {
    	extensions: [
    		"scss"
    	]
    },
    	"text/x-setext": {
    	source: "apache",
    	extensions: [
    		"etx"
    	]
    },
    	"text/x-sfv": {
    	source: "apache",
    	extensions: [
    		"sfv"
    	]
    },
    	"text/x-suse-ymp": {
    	compressible: true,
    	extensions: [
    		"ymp"
    	]
    },
    	"text/x-uuencode": {
    	source: "apache",
    	extensions: [
    		"uu"
    	]
    },
    	"text/x-vcalendar": {
    	source: "apache",
    	extensions: [
    		"vcs"
    	]
    },
    	"text/x-vcard": {
    	source: "apache",
    	extensions: [
    		"vcf"
    	]
    },
    	"text/xml": {
    	source: "iana",
    	compressible: true,
    	extensions: [
    		"xml"
    	]
    },
    	"text/xml-external-parsed-entity": {
    	source: "iana"
    },
    	"text/yaml": {
    	compressible: true,
    	extensions: [
    		"yaml",
    		"yml"
    	]
    },
    	"video/1d-interleaved-parityfec": {
    	source: "iana"
    },
    	"video/3gpp": {
    	source: "iana",
    	extensions: [
    		"3gp",
    		"3gpp"
    	]
    },
    	"video/3gpp-tt": {
    	source: "iana"
    },
    	"video/3gpp2": {
    	source: "iana",
    	extensions: [
    		"3g2"
    	]
    },
    	"video/av1": {
    	source: "iana"
    },
    	"video/bmpeg": {
    	source: "iana"
    },
    	"video/bt656": {
    	source: "iana"
    },
    	"video/celb": {
    	source: "iana"
    },
    	"video/dv": {
    	source: "iana"
    },
    	"video/encaprtp": {
    	source: "iana"
    },
    	"video/ffv1": {
    	source: "iana"
    },
    	"video/flexfec": {
    	source: "iana"
    },
    	"video/h261": {
    	source: "iana",
    	extensions: [
    		"h261"
    	]
    },
    	"video/h263": {
    	source: "iana",
    	extensions: [
    		"h263"
    	]
    },
    	"video/h263-1998": {
    	source: "iana"
    },
    	"video/h263-2000": {
    	source: "iana"
    },
    	"video/h264": {
    	source: "iana",
    	extensions: [
    		"h264"
    	]
    },
    	"video/h264-rcdo": {
    	source: "iana"
    },
    	"video/h264-svc": {
    	source: "iana"
    },
    	"video/h265": {
    	source: "iana"
    },
    	"video/iso.segment": {
    	source: "iana",
    	extensions: [
    		"m4s"
    	]
    },
    	"video/jpeg": {
    	source: "iana",
    	extensions: [
    		"jpgv"
    	]
    },
    	"video/jpeg2000": {
    	source: "iana"
    },
    	"video/jpm": {
    	source: "apache",
    	extensions: [
    		"jpm",
    		"jpgm"
    	]
    },
    	"video/jxsv": {
    	source: "iana"
    },
    	"video/mj2": {
    	source: "iana",
    	extensions: [
    		"mj2",
    		"mjp2"
    	]
    },
    	"video/mp1s": {
    	source: "iana"
    },
    	"video/mp2p": {
    	source: "iana"
    },
    	"video/mp2t": {
    	source: "iana",
    	extensions: [
    		"ts"
    	]
    },
    	"video/mp4": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"mp4",
    		"mp4v",
    		"mpg4"
    	]
    },
    	"video/mp4v-es": {
    	source: "iana"
    },
    	"video/mpeg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"mpeg",
    		"mpg",
    		"mpe",
    		"m1v",
    		"m2v"
    	]
    },
    	"video/mpeg4-generic": {
    	source: "iana"
    },
    	"video/mpv": {
    	source: "iana"
    },
    	"video/nv": {
    	source: "iana"
    },
    	"video/ogg": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"ogv"
    	]
    },
    	"video/parityfec": {
    	source: "iana"
    },
    	"video/pointer": {
    	source: "iana"
    },
    	"video/quicktime": {
    	source: "iana",
    	compressible: false,
    	extensions: [
    		"qt",
    		"mov"
    	]
    },
    	"video/raptorfec": {
    	source: "iana"
    },
    	"video/raw": {
    	source: "iana"
    },
    	"video/rtp-enc-aescm128": {
    	source: "iana"
    },
    	"video/rtploopback": {
    	source: "iana"
    },
    	"video/rtx": {
    	source: "iana"
    },
    	"video/scip": {
    	source: "iana"
    },
    	"video/smpte291": {
    	source: "iana"
    },
    	"video/smpte292m": {
    	source: "iana"
    },
    	"video/ulpfec": {
    	source: "iana"
    },
    	"video/vc1": {
    	source: "iana"
    },
    	"video/vc2": {
    	source: "iana"
    },
    	"video/vnd.cctv": {
    	source: "iana"
    },
    	"video/vnd.dece.hd": {
    	source: "iana",
    	extensions: [
    		"uvh",
    		"uvvh"
    	]
    },
    	"video/vnd.dece.mobile": {
    	source: "iana",
    	extensions: [
    		"uvm",
    		"uvvm"
    	]
    },
    	"video/vnd.dece.mp4": {
    	source: "iana"
    },
    	"video/vnd.dece.pd": {
    	source: "iana",
    	extensions: [
    		"uvp",
    		"uvvp"
    	]
    },
    	"video/vnd.dece.sd": {
    	source: "iana",
    	extensions: [
    		"uvs",
    		"uvvs"
    	]
    },
    	"video/vnd.dece.video": {
    	source: "iana",
    	extensions: [
    		"uvv",
    		"uvvv"
    	]
    },
    	"video/vnd.directv.mpeg": {
    	source: "iana"
    },
    	"video/vnd.directv.mpeg-tts": {
    	source: "iana"
    },
    	"video/vnd.dlna.mpeg-tts": {
    	source: "iana"
    },
    	"video/vnd.dvb.file": {
    	source: "iana",
    	extensions: [
    		"dvb"
    	]
    },
    	"video/vnd.fvt": {
    	source: "iana",
    	extensions: [
    		"fvt"
    	]
    },
    	"video/vnd.hns.video": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.1dparityfec-1010": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.1dparityfec-2005": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.2dparityfec-1010": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.2dparityfec-2005": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.ttsavc": {
    	source: "iana"
    },
    	"video/vnd.iptvforum.ttsmpeg2": {
    	source: "iana"
    },
    	"video/vnd.motorola.video": {
    	source: "iana"
    },
    	"video/vnd.motorola.videop": {
    	source: "iana"
    },
    	"video/vnd.mpegurl": {
    	source: "iana",
    	extensions: [
    		"mxu",
    		"m4u"
    	]
    },
    	"video/vnd.ms-playready.media.pyv": {
    	source: "iana",
    	extensions: [
    		"pyv"
    	]
    },
    	"video/vnd.nokia.interleaved-multimedia": {
    	source: "iana"
    },
    	"video/vnd.nokia.mp4vr": {
    	source: "iana"
    },
    	"video/vnd.nokia.videovoip": {
    	source: "iana"
    },
    	"video/vnd.objectvideo": {
    	source: "iana"
    },
    	"video/vnd.radgamettools.bink": {
    	source: "iana"
    },
    	"video/vnd.radgamettools.smacker": {
    	source: "iana"
    },
    	"video/vnd.sealed.mpeg1": {
    	source: "iana"
    },
    	"video/vnd.sealed.mpeg4": {
    	source: "iana"
    },
    	"video/vnd.sealed.swf": {
    	source: "iana"
    },
    	"video/vnd.sealedmedia.softseal.mov": {
    	source: "iana"
    },
    	"video/vnd.uvvu.mp4": {
    	source: "iana",
    	extensions: [
    		"uvu",
    		"uvvu"
    	]
    },
    	"video/vnd.vivo": {
    	source: "iana",
    	extensions: [
    		"viv"
    	]
    },
    	"video/vnd.youtube.yt": {
    	source: "iana"
    },
    	"video/vp8": {
    	source: "iana"
    },
    	"video/vp9": {
    	source: "iana"
    },
    	"video/webm": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"webm"
    	]
    },
    	"video/x-f4v": {
    	source: "apache",
    	extensions: [
    		"f4v"
    	]
    },
    	"video/x-fli": {
    	source: "apache",
    	extensions: [
    		"fli"
    	]
    },
    	"video/x-flv": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"flv"
    	]
    },
    	"video/x-m4v": {
    	source: "apache",
    	extensions: [
    		"m4v"
    	]
    },
    	"video/x-matroska": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"mkv",
    		"mk3d",
    		"mks"
    	]
    },
    	"video/x-mng": {
    	source: "apache",
    	extensions: [
    		"mng"
    	]
    },
    	"video/x-ms-asf": {
    	source: "apache",
    	extensions: [
    		"asf",
    		"asx"
    	]
    },
    	"video/x-ms-vob": {
    	source: "apache",
    	extensions: [
    		"vob"
    	]
    },
    	"video/x-ms-wm": {
    	source: "apache",
    	extensions: [
    		"wm"
    	]
    },
    	"video/x-ms-wmv": {
    	source: "apache",
    	compressible: false,
    	extensions: [
    		"wmv"
    	]
    },
    	"video/x-ms-wmx": {
    	source: "apache",
    	extensions: [
    		"wmx"
    	]
    },
    	"video/x-ms-wvx": {
    	source: "apache",
    	extensions: [
    		"wvx"
    	]
    },
    	"video/x-msvideo": {
    	source: "apache",
    	extensions: [
    		"avi"
    	]
    },
    	"video/x-sgi-movie": {
    	source: "apache",
    	extensions: [
    		"movie"
    	]
    },
    	"video/x-smv": {
    	source: "apache",
    	extensions: [
    		"smv"
    	]
    },
    	"x-conference/x-cooltalk": {
    	source: "apache",
    	extensions: [
    		"ice"
    	]
    },
    	"x-shader/x-fragment": {
    	compressible: true
    },
    	"x-shader/x-vertex": {
    	compressible: true
    }
    };

    /*!
     * mime-db
     * Copyright(c) 2014 Jonathan Ong
     * Copyright(c) 2015-2022 Douglas Christopher Wilson
     * MIT Licensed
     */

    /**
     * Module exports.
     */

    var mimeDb = require$$0;

    /*!
     * mime-types
     * Copyright(c) 2014 Jonathan Ong
     * Copyright(c) 2015 Douglas Christopher Wilson
     * MIT Licensed
     */

    (function (exports) {

    	/**
    	 * Module dependencies.
    	 * @private
    	 */

    	var db = mimeDb;
    	var extname = require$$1$1.extname;

    	/**
    	 * Module variables.
    	 * @private
    	 */

    	var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    	var TEXT_TYPE_REGEXP = /^text\//i;

    	/**
    	 * Module exports.
    	 * @public
    	 */

    	exports.charset = charset;
    	exports.charsets = { lookup: charset };
    	exports.contentType = contentType;
    	exports.extension = extension;
    	exports.extensions = Object.create(null);
    	exports.lookup = lookup;
    	exports.types = Object.create(null);

    	// Populate the extensions/types maps
    	populateMaps(exports.extensions, exports.types);

    	/**
    	 * Get the default charset for a MIME type.
    	 *
    	 * @param {string} type
    	 * @return {boolean|string}
    	 */

    	function charset (type) {
    	  if (!type || typeof type !== 'string') {
    	    return false
    	  }

    	  // TODO: use media-typer
    	  var match = EXTRACT_TYPE_REGEXP.exec(type);
    	  var mime = match && db[match[1].toLowerCase()];

    	  if (mime && mime.charset) {
    	    return mime.charset
    	  }

    	  // default text/* to utf-8
    	  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
    	    return 'UTF-8'
    	  }

    	  return false
    	}

    	/**
    	 * Create a full Content-Type header given a MIME type or extension.
    	 *
    	 * @param {string} str
    	 * @return {boolean|string}
    	 */

    	function contentType (str) {
    	  // TODO: should this even be in this module?
    	  if (!str || typeof str !== 'string') {
    	    return false
    	  }

    	  var mime = str.indexOf('/') === -1
    	    ? exports.lookup(str)
    	    : str;

    	  if (!mime) {
    	    return false
    	  }

    	  // TODO: use content-type or other module
    	  if (mime.indexOf('charset') === -1) {
    	    var charset = exports.charset(mime);
    	    if (charset) mime += '; charset=' + charset.toLowerCase();
    	  }

    	  return mime
    	}

    	/**
    	 * Get the default extension for a MIME type.
    	 *
    	 * @param {string} type
    	 * @return {boolean|string}
    	 */

    	function extension (type) {
    	  if (!type || typeof type !== 'string') {
    	    return false
    	  }

    	  // TODO: use media-typer
    	  var match = EXTRACT_TYPE_REGEXP.exec(type);

    	  // get extensions
    	  var exts = match && exports.extensions[match[1].toLowerCase()];

    	  if (!exts || !exts.length) {
    	    return false
    	  }

    	  return exts[0]
    	}

    	/**
    	 * Lookup the MIME type for a file path/extension.
    	 *
    	 * @param {string} path
    	 * @return {boolean|string}
    	 */

    	function lookup (path) {
    	  if (!path || typeof path !== 'string') {
    	    return false
    	  }

    	  // get the extension ("ext" or ".ext" or full path)
    	  var extension = extname('x.' + path)
    	    .toLowerCase()
    	    .substr(1);

    	  if (!extension) {
    	    return false
    	  }

    	  return exports.types[extension] || false
    	}

    	/**
    	 * Populate the extensions and types maps.
    	 * @private
    	 */

    	function populateMaps (extensions, types) {
    	  // source preference (least -> most)
    	  var preference = ['nginx', 'apache', undefined, 'iana'];

    	  Object.keys(db).forEach(function forEachMimeType (type) {
    	    var mime = db[type];
    	    var exts = mime.extensions;

    	    if (!exts || !exts.length) {
    	      return
    	    }

    	    // mime -> extensions
    	    extensions[type] = exts;

    	    // extension -> mime
    	    for (var i = 0; i < exts.length; i++) {
    	      var extension = exts[i];

    	      if (types[extension]) {
    	        var from = preference.indexOf(db[types[extension]].source);
    	        var to = preference.indexOf(mime.source);

    	        if (types[extension] !== 'application/octet-stream' &&
    	          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
    	          // skip the remapping
    	          continue
    	        }
    	      }

    	      // set the extension -> mime
    	      types[extension] = type;
    	    }
    	  });
    	} 
    } (mimeTypes));

    var defer_1 = defer$1;

    /**
     * Runs provided function on next iteration of the event loop
     *
     * @param {function} fn - function to run
     */
    function defer$1(fn)
    {
      var nextTick = typeof setImmediate == 'function'
        ? setImmediate
        : (
          typeof process == 'object' && typeof process.nextTick == 'function'
          ? process.nextTick
          : null
        );

      if (nextTick)
      {
        nextTick(fn);
      }
      else
      {
        setTimeout(fn, 0);
      }
    }

    var defer = defer_1;

    // API
    var async_1 = async$2;

    /**
     * Runs provided callback asynchronously
     * even if callback itself is not
     *
     * @param   {function} callback - callback to invoke
     * @returns {function} - augmented callback
     */
    function async$2(callback)
    {
      var isAsync = false;

      // check if async happened
      defer(function() { isAsync = true; });

      return function async_callback(err, result)
      {
        if (isAsync)
        {
          callback(err, result);
        }
        else
        {
          defer(function nextTick_callback()
          {
            callback(err, result);
          });
        }
      };
    }

    // API
    var abort_1 = abort$2;

    /**
     * Aborts leftover active jobs
     *
     * @param {object} state - current state object
     */
    function abort$2(state)
    {
      Object.keys(state.jobs).forEach(clean.bind(state));

      // reset leftover jobs
      state.jobs = {};
    }

    /**
     * Cleans up leftover job by invoking abort function for the provided job id
     *
     * @this  state
     * @param {string|number} key - job id to abort
     */
    function clean(key)
    {
      if (typeof this.jobs[key] == 'function')
      {
        this.jobs[key]();
      }
    }

    var async$1 = async_1
      , abort$1 = abort_1
      ;

    // API
    var iterate_1 = iterate$2;

    /**
     * Iterates over each job object
     *
     * @param {array|object} list - array or object (named list) to iterate over
     * @param {function} iterator - iterator to run
     * @param {object} state - current job status
     * @param {function} callback - invoked when all elements processed
     */
    function iterate$2(list, iterator, state, callback)
    {
      // store current index
      var key = state['keyedList'] ? state['keyedList'][state.index] : state.index;

      state.jobs[key] = runJob(iterator, key, list[key], function(error, output)
      {
        // don't repeat yourself
        // skip secondary callbacks
        if (!(key in state.jobs))
        {
          return;
        }

        // clean up jobs
        delete state.jobs[key];

        if (error)
        {
          // don't process rest of the results
          // stop still active jobs
          // and reset the list
          abort$1(state);
        }
        else
        {
          state.results[key] = output;
        }

        // return salvaged results
        callback(error, state.results);
      });
    }

    /**
     * Runs iterator over provided job element
     *
     * @param   {function} iterator - iterator to invoke
     * @param   {string|number} key - key/index of the element in the list of jobs
     * @param   {mixed} item - job description
     * @param   {function} callback - invoked after iterator is done with the job
     * @returns {function|mixed} - job abort function or something else
     */
    function runJob(iterator, key, item, callback)
    {
      var aborter;

      // allow shortcut if iterator expects only two arguments
      if (iterator.length == 2)
      {
        aborter = iterator(item, async$1(callback));
      }
      // otherwise go with full three arguments
      else
      {
        aborter = iterator(item, key, async$1(callback));
      }

      return aborter;
    }

    // API
    var state_1 = state;

    /**
     * Creates initial state object
     * for iteration over list
     *
     * @param   {array|object} list - list to iterate over
     * @param   {function|null} sortMethod - function to use for keys sort,
     *                                     or `null` to keep them as is
     * @returns {object} - initial state object
     */
    function state(list, sortMethod)
    {
      var isNamedList = !Array.isArray(list)
        , initState =
        {
          index    : 0,
          keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
          jobs     : {},
          results  : isNamedList ? {} : [],
          size     : isNamedList ? Object.keys(list).length : list.length
        }
        ;

      if (sortMethod)
      {
        // sort array keys based on it's values
        // sort object's keys just on own merit
        initState.keyedList.sort(isNamedList ? sortMethod : function(a, b)
        {
          return sortMethod(list[a], list[b]);
        });
      }

      return initState;
    }

    var abort = abort_1
      , async = async_1
      ;

    // API
    var terminator_1 = terminator$2;

    /**
     * Terminates jobs in the attached state context
     *
     * @this  AsyncKitState#
     * @param {function} callback - final callback to invoke after termination
     */
    function terminator$2(callback)
    {
      if (!Object.keys(this.jobs).length)
      {
        return;
      }

      // fast forward iteration index
      this.index = this.size;

      // abort jobs
      abort(this);

      // send back results we have so far
      async(callback)(null, this.results);
    }

    var iterate$1    = iterate_1
      , initState$1  = state_1
      , terminator$1 = terminator_1
      ;

    // Public API
    var parallel_1 = parallel;

    /**
     * Runs iterator over provided array elements in parallel
     *
     * @param   {array|object} list - array or object (named list) to iterate over
     * @param   {function} iterator - iterator to run
     * @param   {function} callback - invoked when all elements processed
     * @returns {function} - jobs terminator
     */
    function parallel(list, iterator, callback)
    {
      var state = initState$1(list);

      while (state.index < (state['keyedList'] || list).length)
      {
        iterate$1(list, iterator, state, function(error, result)
        {
          if (error)
          {
            callback(error, result);
            return;
          }

          // looks like it's the last one
          if (Object.keys(state.jobs).length === 0)
          {
            callback(null, state.results);
            return;
          }
        });

        state.index++;
      }

      return terminator$1.bind(state, callback);
    }

    var serialOrdered$2 = {exports: {}};

    var iterate    = iterate_1
      , initState  = state_1
      , terminator = terminator_1
      ;

    // Public API
    serialOrdered$2.exports = serialOrdered$1;
    // sorting helpers
    serialOrdered$2.exports.ascending  = ascending;
    serialOrdered$2.exports.descending = descending;

    /**
     * Runs iterator over provided sorted array elements in series
     *
     * @param   {array|object} list - array or object (named list) to iterate over
     * @param   {function} iterator - iterator to run
     * @param   {function} sortMethod - custom sort function
     * @param   {function} callback - invoked when all elements processed
     * @returns {function} - jobs terminator
     */
    function serialOrdered$1(list, iterator, sortMethod, callback)
    {
      var state = initState(list, sortMethod);

      iterate(list, iterator, state, function iteratorHandler(error, result)
      {
        if (error)
        {
          callback(error, result);
          return;
        }

        state.index++;

        // are we there yet?
        if (state.index < (state['keyedList'] || list).length)
        {
          iterate(list, iterator, state, iteratorHandler);
          return;
        }

        // done here
        callback(null, state.results);
      });

      return terminator.bind(state, callback);
    }

    /*
     * -- Sort methods
     */

    /**
     * sort helper to sort array elements in ascending order
     *
     * @param   {mixed} a - an item to compare
     * @param   {mixed} b - an item to compare
     * @returns {number} - comparison result
     */
    function ascending(a, b)
    {
      return a < b ? -1 : a > b ? 1 : 0;
    }

    /**
     * sort helper to sort array elements in descending order
     *
     * @param   {mixed} a - an item to compare
     * @param   {mixed} b - an item to compare
     * @returns {number} - comparison result
     */
    function descending(a, b)
    {
      return -1 * ascending(a, b);
    }

    var serialOrderedExports = serialOrdered$2.exports;

    var serialOrdered = serialOrderedExports;

    // Public API
    var serial_1 = serial;

    /**
     * Runs iterator over provided array elements in series
     *
     * @param   {array|object} list - array or object (named list) to iterate over
     * @param   {function} iterator - iterator to run
     * @param   {function} callback - invoked when all elements processed
     * @returns {function} - jobs terminator
     */
    function serial(list, iterator, callback)
    {
      return serialOrdered(list, iterator, null, callback);
    }

    var asynckit$1 =
    {
      parallel      : parallel_1,
      serial        : serial_1,
      serialOrdered : serialOrderedExports
    };

    /** @type {import('.')} */
    var esObjectAtoms = Object;

    /** @type {import('.')} */
    var esErrors = Error;

    /** @type {import('./eval')} */
    var _eval = EvalError;

    /** @type {import('./range')} */
    var range = RangeError;

    /** @type {import('./ref')} */
    var ref = ReferenceError;

    /** @type {import('./syntax')} */
    var syntax = SyntaxError;

    var type;
    var hasRequiredType;

    function requireType () {
    	if (hasRequiredType) return type;
    	hasRequiredType = 1;

    	/** @type {import('./type')} */
    	type = TypeError;
    	return type;
    }

    /** @type {import('./uri')} */
    var uri = URIError;

    /** @type {import('./abs')} */
    var abs$1 = Math.abs;

    /** @type {import('./floor')} */
    var floor$1 = Math.floor;

    /** @type {import('./max')} */
    var max$2 = Math.max;

    /** @type {import('./min')} */
    var min$1 = Math.min;

    /** @type {import('./pow')} */
    var pow$1 = Math.pow;

    /** @type {import('./round')} */
    var round$1 = Math.round;

    /** @type {import('./isNaN')} */
    var _isNaN = Number.isNaN || function isNaN(a) {
    	return a !== a;
    };

    var $isNaN = _isNaN;

    /** @type {import('./sign')} */
    var sign$1 = function sign(number) {
    	if ($isNaN(number) || number === 0) {
    		return number;
    	}
    	return number < 0 ? -1 : 1;
    };

    /** @type {import('./gOPD')} */
    var gOPD = Object.getOwnPropertyDescriptor;

    /** @type {import('.')} */
    var $gOPD$1 = gOPD;

    if ($gOPD$1) {
    	try {
    		$gOPD$1([], 'length');
    	} catch (e) {
    		// IE 8 has a broken gOPD
    		$gOPD$1 = null;
    	}
    }

    var gopd = $gOPD$1;

    /** @type {import('.')} */
    var $defineProperty$2 = Object.defineProperty || false;
    if ($defineProperty$2) {
    	try {
    		$defineProperty$2({}, 'a', { value: 1 });
    	} catch (e) {
    		// IE 8 has a broken defineProperty
    		$defineProperty$2 = false;
    	}
    }

    var esDefineProperty = $defineProperty$2;

    var shams$1;
    var hasRequiredShams$1;

    function requireShams$1 () {
    	if (hasRequiredShams$1) return shams$1;
    	hasRequiredShams$1 = 1;

    	/** @type {import('./shams')} */
    	/* eslint complexity: [2, 18], max-statements: [2, 33] */
    	shams$1 = function hasSymbols() {
    		if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
    		if (typeof Symbol.iterator === 'symbol') { return true; }

    		/** @type {{ [k in symbol]?: unknown }} */
    		var obj = {};
    		var sym = Symbol('test');
    		var symObj = Object(sym);
    		if (typeof sym === 'string') { return false; }

    		if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
    		if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

    		// temp disabled per https://github.com/ljharb/object.assign/issues/17
    		// if (sym instanceof Symbol) { return false; }
    		// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
    		// if (!(symObj instanceof Symbol)) { return false; }

    		// if (typeof Symbol.prototype.toString !== 'function') { return false; }
    		// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

    		var symVal = 42;
    		obj[sym] = symVal;
    		for (var _ in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
    		if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

    		if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

    		var syms = Object.getOwnPropertySymbols(obj);
    		if (syms.length !== 1 || syms[0] !== sym) { return false; }

    		if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

    		if (typeof Object.getOwnPropertyDescriptor === 'function') {
    			// eslint-disable-next-line no-extra-parens
    			var descriptor = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(obj, sym));
    			if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
    		}

    		return true;
    	};
    	return shams$1;
    }

    var hasSymbols$1;
    var hasRequiredHasSymbols;

    function requireHasSymbols () {
    	if (hasRequiredHasSymbols) return hasSymbols$1;
    	hasRequiredHasSymbols = 1;

    	var origSymbol = typeof Symbol !== 'undefined' && Symbol;
    	var hasSymbolSham = requireShams$1();

    	/** @type {import('.')} */
    	hasSymbols$1 = function hasNativeSymbols() {
    		if (typeof origSymbol !== 'function') { return false; }
    		if (typeof Symbol !== 'function') { return false; }
    		if (typeof origSymbol('foo') !== 'symbol') { return false; }
    		if (typeof Symbol('bar') !== 'symbol') { return false; }

    		return hasSymbolSham();
    	};
    	return hasSymbols$1;
    }

    var Reflect_getPrototypeOf;
    var hasRequiredReflect_getPrototypeOf;

    function requireReflect_getPrototypeOf () {
    	if (hasRequiredReflect_getPrototypeOf) return Reflect_getPrototypeOf;
    	hasRequiredReflect_getPrototypeOf = 1;

    	/** @type {import('./Reflect.getPrototypeOf')} */
    	Reflect_getPrototypeOf = (typeof Reflect !== 'undefined' && Reflect.getPrototypeOf) || null;
    	return Reflect_getPrototypeOf;
    }

    var Object_getPrototypeOf;
    var hasRequiredObject_getPrototypeOf;

    function requireObject_getPrototypeOf () {
    	if (hasRequiredObject_getPrototypeOf) return Object_getPrototypeOf;
    	hasRequiredObject_getPrototypeOf = 1;

    	var $Object = esObjectAtoms;

    	/** @type {import('./Object.getPrototypeOf')} */
    	Object_getPrototypeOf = $Object.getPrototypeOf || null;
    	return Object_getPrototypeOf;
    }

    /* eslint no-invalid-this: 1 */

    var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
    var toStr = Object.prototype.toString;
    var max$1 = Math.max;
    var funcType = '[object Function]';

    var concatty = function concatty(a, b) {
        var arr = [];

        for (var i = 0; i < a.length; i += 1) {
            arr[i] = a[i];
        }
        for (var j = 0; j < b.length; j += 1) {
            arr[j + a.length] = b[j];
        }

        return arr;
    };

    var slicy = function slicy(arrLike, offset) {
        var arr = [];
        for (var i = offset, j = 0; i < arrLike.length; i += 1, j += 1) {
            arr[j] = arrLike[i];
        }
        return arr;
    };

    var joiny = function (arr, joiner) {
        var str = '';
        for (var i = 0; i < arr.length; i += 1) {
            str += arr[i];
            if (i + 1 < arr.length) {
                str += joiner;
            }
        }
        return str;
    };

    var implementation$1 = function bind(that) {
        var target = this;
        if (typeof target !== 'function' || toStr.apply(target) !== funcType) {
            throw new TypeError(ERROR_MESSAGE + target);
        }
        var args = slicy(arguments, 1);

        var bound;
        var binder = function () {
            if (this instanceof bound) {
                var result = target.apply(
                    this,
                    concatty(args, arguments)
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;
            }
            return target.apply(
                that,
                concatty(args, arguments)
            );

        };

        var boundLength = max$1(0, target.length - args.length);
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            boundArgs[i] = '$' + i;
        }

        bound = Function('binder', 'return function (' + joiny(boundArgs, ',') + '){ return binder.apply(this,arguments); }')(binder);

        if (target.prototype) {
            var Empty = function Empty() {};
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }

        return bound;
    };

    var implementation = implementation$1;

    var functionBind = Function.prototype.bind || implementation;

    var functionCall;
    var hasRequiredFunctionCall;

    function requireFunctionCall () {
    	if (hasRequiredFunctionCall) return functionCall;
    	hasRequiredFunctionCall = 1;

    	/** @type {import('./functionCall')} */
    	functionCall = Function.prototype.call;
    	return functionCall;
    }

    var functionApply;
    var hasRequiredFunctionApply;

    function requireFunctionApply () {
    	if (hasRequiredFunctionApply) return functionApply;
    	hasRequiredFunctionApply = 1;

    	/** @type {import('./functionApply')} */
    	functionApply = Function.prototype.apply;
    	return functionApply;
    }

    var reflectApply;
    var hasRequiredReflectApply;

    function requireReflectApply () {
    	if (hasRequiredReflectApply) return reflectApply;
    	hasRequiredReflectApply = 1;

    	/** @type {import('./reflectApply')} */
    	reflectApply = typeof Reflect !== 'undefined' && Reflect && Reflect.apply;
    	return reflectApply;
    }

    var actualApply;
    var hasRequiredActualApply;

    function requireActualApply () {
    	if (hasRequiredActualApply) return actualApply;
    	hasRequiredActualApply = 1;

    	var bind = functionBind;

    	var $apply = requireFunctionApply();
    	var $call = requireFunctionCall();
    	var $reflectApply = requireReflectApply();

    	/** @type {import('./actualApply')} */
    	actualApply = $reflectApply || bind.call($call, $apply);
    	return actualApply;
    }

    var callBindApplyHelpers;
    var hasRequiredCallBindApplyHelpers;

    function requireCallBindApplyHelpers () {
    	if (hasRequiredCallBindApplyHelpers) return callBindApplyHelpers;
    	hasRequiredCallBindApplyHelpers = 1;

    	var bind = functionBind;
    	var $TypeError = requireType();

    	var $call = requireFunctionCall();
    	var $actualApply = requireActualApply();

    	/** @type {(args: [Function, thisArg?: unknown, ...args: unknown[]]) => Function} TODO FIXME, find a way to use import('.') */
    	callBindApplyHelpers = function callBindBasic(args) {
    		if (args.length < 1 || typeof args[0] !== 'function') {
    			throw new $TypeError('a function is required');
    		}
    		return $actualApply(bind, $call, args);
    	};
    	return callBindApplyHelpers;
    }

    var get;
    var hasRequiredGet;

    function requireGet () {
    	if (hasRequiredGet) return get;
    	hasRequiredGet = 1;

    	var callBind = requireCallBindApplyHelpers();
    	var gOPD = gopd;

    	var hasProtoAccessor;
    	try {
    		// eslint-disable-next-line no-extra-parens, no-proto
    		hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */ ([]).__proto__ === Array.prototype;
    	} catch (e) {
    		if (!e || typeof e !== 'object' || !('code' in e) || e.code !== 'ERR_PROTO_ACCESS') {
    			throw e;
    		}
    	}

    	// eslint-disable-next-line no-extra-parens
    	var desc = !!hasProtoAccessor && gOPD && gOPD(Object.prototype, /** @type {keyof typeof Object.prototype} */ ('__proto__'));

    	var $Object = Object;
    	var $getPrototypeOf = $Object.getPrototypeOf;

    	/** @type {import('./get')} */
    	get = desc && typeof desc.get === 'function'
    		? callBind([desc.get])
    		: typeof $getPrototypeOf === 'function'
    			? /** @type {import('./get')} */ function getDunder(value) {
    				// eslint-disable-next-line eqeqeq
    				return $getPrototypeOf(value == null ? value : $Object(value));
    			}
    			: false;
    	return get;
    }

    var getProto$1;
    var hasRequiredGetProto;

    function requireGetProto () {
    	if (hasRequiredGetProto) return getProto$1;
    	hasRequiredGetProto = 1;

    	var reflectGetProto = requireReflect_getPrototypeOf();
    	var originalGetProto = requireObject_getPrototypeOf();

    	var getDunderProto = requireGet();

    	/** @type {import('.')} */
    	getProto$1 = reflectGetProto
    		? function getProto(O) {
    			// @ts-expect-error TS can't narrow inside a closure, for some reason
    			return reflectGetProto(O);
    		}
    		: originalGetProto
    			? function getProto(O) {
    				if (!O || (typeof O !== 'object' && typeof O !== 'function')) {
    					throw new TypeError('getProto: not an object');
    				}
    				// @ts-expect-error TS can't narrow inside a closure, for some reason
    				return originalGetProto(O);
    			}
    			: getDunderProto
    				? function getProto(O) {
    					// @ts-expect-error TS can't narrow inside a closure, for some reason
    					return getDunderProto(O);
    				}
    				: null;
    	return getProto$1;
    }

    var call = Function.prototype.call;
    var $hasOwn = Object.prototype.hasOwnProperty;
    var bind$1 = functionBind;

    /** @type {import('.')} */
    var hasown = bind$1.call(call, $hasOwn);

    var undefined$1;

    var $Object = esObjectAtoms;

    var $Error = esErrors;
    var $EvalError = _eval;
    var $RangeError = range;
    var $ReferenceError = ref;
    var $SyntaxError = syntax;
    var $TypeError$1 = requireType();
    var $URIError = uri;

    var abs = abs$1;
    var floor = floor$1;
    var max = max$2;
    var min = min$1;
    var pow = pow$1;
    var round = round$1;
    var sign = sign$1;

    var $Function = Function;

    // eslint-disable-next-line consistent-return
    var getEvalledConstructor = function (expressionSyntax) {
    	try {
    		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
    	} catch (e) {}
    };

    var $gOPD = gopd;
    var $defineProperty$1 = esDefineProperty;

    var throwTypeError = function () {
    	throw new $TypeError$1();
    };
    var ThrowTypeError = $gOPD
    	? (function () {
    		try {
    			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
    			arguments.callee; // IE 8 does not throw here
    			return throwTypeError;
    		} catch (calleeThrows) {
    			try {
    				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
    				return $gOPD(arguments, 'callee').get;
    			} catch (gOPDthrows) {
    				return throwTypeError;
    			}
    		}
    	}())
    	: throwTypeError;

    var hasSymbols = requireHasSymbols()();

    var getProto = requireGetProto();
    var $ObjectGPO = requireObject_getPrototypeOf();
    var $ReflectGPO = requireReflect_getPrototypeOf();

    var $apply = requireFunctionApply();
    var $call = requireFunctionCall();

    var needsEval = {};

    var TypedArray = typeof Uint8Array === 'undefined' || !getProto ? undefined$1 : getProto(Uint8Array);

    var INTRINSICS = {
    	__proto__: null,
    	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
    	'%Array%': Array,
    	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
    	'%ArrayIteratorPrototype%': hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined$1,
    	'%AsyncFromSyncIteratorPrototype%': undefined$1,
    	'%AsyncFunction%': needsEval,
    	'%AsyncGenerator%': needsEval,
    	'%AsyncGeneratorFunction%': needsEval,
    	'%AsyncIteratorPrototype%': needsEval,
    	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
    	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
    	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
    	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
    	'%Boolean%': Boolean,
    	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
    	'%Date%': Date,
    	'%decodeURI%': decodeURI,
    	'%decodeURIComponent%': decodeURIComponent,
    	'%encodeURI%': encodeURI,
    	'%encodeURIComponent%': encodeURIComponent,
    	'%Error%': $Error,
    	'%eval%': eval, // eslint-disable-line no-eval
    	'%EvalError%': $EvalError,
    	'%Float16Array%': typeof Float16Array === 'undefined' ? undefined$1 : Float16Array,
    	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
    	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
    	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
    	'%Function%': $Function,
    	'%GeneratorFunction%': needsEval,
    	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
    	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
    	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
    	'%isFinite%': isFinite,
    	'%isNaN%': isNaN,
    	'%IteratorPrototype%': hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
    	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
    	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
    	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
    	'%Math%': Math,
    	'%Number%': Number,
    	'%Object%': $Object,
    	'%Object.getOwnPropertyDescriptor%': $gOPD,
    	'%parseFloat%': parseFloat,
    	'%parseInt%': parseInt,
    	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
    	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
    	'%RangeError%': $RangeError,
    	'%ReferenceError%': $ReferenceError,
    	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
    	'%RegExp%': RegExp,
    	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
    	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols || !getProto ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
    	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
    	'%String%': String,
    	'%StringIteratorPrototype%': hasSymbols && getProto ? getProto(''[Symbol.iterator]()) : undefined$1,
    	'%Symbol%': hasSymbols ? Symbol : undefined$1,
    	'%SyntaxError%': $SyntaxError,
    	'%ThrowTypeError%': ThrowTypeError,
    	'%TypedArray%': TypedArray,
    	'%TypeError%': $TypeError$1,
    	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
    	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
    	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
    	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
    	'%URIError%': $URIError,
    	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
    	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
    	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet,

    	'%Function.prototype.call%': $call,
    	'%Function.prototype.apply%': $apply,
    	'%Object.defineProperty%': $defineProperty$1,
    	'%Object.getPrototypeOf%': $ObjectGPO,
    	'%Math.abs%': abs,
    	'%Math.floor%': floor,
    	'%Math.max%': max,
    	'%Math.min%': min,
    	'%Math.pow%': pow,
    	'%Math.round%': round,
    	'%Math.sign%': sign,
    	'%Reflect.getPrototypeOf%': $ReflectGPO
    };

    if (getProto) {
    	try {
    		null.error; // eslint-disable-line no-unused-expressions
    	} catch (e) {
    		// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
    		var errorProto = getProto(getProto(e));
    		INTRINSICS['%Error.prototype%'] = errorProto;
    	}
    }

    var doEval = function doEval(name) {
    	var value;
    	if (name === '%AsyncFunction%') {
    		value = getEvalledConstructor('async function () {}');
    	} else if (name === '%GeneratorFunction%') {
    		value = getEvalledConstructor('function* () {}');
    	} else if (name === '%AsyncGeneratorFunction%') {
    		value = getEvalledConstructor('async function* () {}');
    	} else if (name === '%AsyncGenerator%') {
    		var fn = doEval('%AsyncGeneratorFunction%');
    		if (fn) {
    			value = fn.prototype;
    		}
    	} else if (name === '%AsyncIteratorPrototype%') {
    		var gen = doEval('%AsyncGenerator%');
    		if (gen && getProto) {
    			value = getProto(gen.prototype);
    		}
    	}

    	INTRINSICS[name] = value;

    	return value;
    };

    var LEGACY_ALIASES = {
    	__proto__: null,
    	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
    	'%ArrayPrototype%': ['Array', 'prototype'],
    	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
    	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
    	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
    	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
    	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
    	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
    	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
    	'%BooleanPrototype%': ['Boolean', 'prototype'],
    	'%DataViewPrototype%': ['DataView', 'prototype'],
    	'%DatePrototype%': ['Date', 'prototype'],
    	'%ErrorPrototype%': ['Error', 'prototype'],
    	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
    	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
    	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
    	'%FunctionPrototype%': ['Function', 'prototype'],
    	'%Generator%': ['GeneratorFunction', 'prototype'],
    	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
    	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
    	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
    	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
    	'%JSONParse%': ['JSON', 'parse'],
    	'%JSONStringify%': ['JSON', 'stringify'],
    	'%MapPrototype%': ['Map', 'prototype'],
    	'%NumberPrototype%': ['Number', 'prototype'],
    	'%ObjectPrototype%': ['Object', 'prototype'],
    	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
    	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
    	'%PromisePrototype%': ['Promise', 'prototype'],
    	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
    	'%Promise_all%': ['Promise', 'all'],
    	'%Promise_reject%': ['Promise', 'reject'],
    	'%Promise_resolve%': ['Promise', 'resolve'],
    	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
    	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
    	'%RegExpPrototype%': ['RegExp', 'prototype'],
    	'%SetPrototype%': ['Set', 'prototype'],
    	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
    	'%StringPrototype%': ['String', 'prototype'],
    	'%SymbolPrototype%': ['Symbol', 'prototype'],
    	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
    	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
    	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
    	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
    	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
    	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
    	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
    	'%URIErrorPrototype%': ['URIError', 'prototype'],
    	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
    	'%WeakSetPrototype%': ['WeakSet', 'prototype']
    };

    var bind = functionBind;
    var hasOwn$2 = hasown;
    var $concat = bind.call($call, Array.prototype.concat);
    var $spliceApply = bind.call($apply, Array.prototype.splice);
    var $replace = bind.call($call, String.prototype.replace);
    var $strSlice = bind.call($call, String.prototype.slice);
    var $exec = bind.call($call, RegExp.prototype.exec);

    /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
    var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
    var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
    var stringToPath = function stringToPath(string) {
    	var first = $strSlice(string, 0, 1);
    	var last = $strSlice(string, -1);
    	if (first === '%' && last !== '%') {
    		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
    	} else if (last === '%' && first !== '%') {
    		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
    	}
    	var result = [];
    	$replace(string, rePropName, function (match, number, quote, subString) {
    		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
    	});
    	return result;
    };
    /* end adaptation */

    var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
    	var intrinsicName = name;
    	var alias;
    	if (hasOwn$2(LEGACY_ALIASES, intrinsicName)) {
    		alias = LEGACY_ALIASES[intrinsicName];
    		intrinsicName = '%' + alias[0] + '%';
    	}

    	if (hasOwn$2(INTRINSICS, intrinsicName)) {
    		var value = INTRINSICS[intrinsicName];
    		if (value === needsEval) {
    			value = doEval(intrinsicName);
    		}
    		if (typeof value === 'undefined' && !allowMissing) {
    			throw new $TypeError$1('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
    		}

    		return {
    			alias: alias,
    			name: intrinsicName,
    			value: value
    		};
    	}

    	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
    };

    var getIntrinsic = function GetIntrinsic(name, allowMissing) {
    	if (typeof name !== 'string' || name.length === 0) {
    		throw new $TypeError$1('intrinsic name must be a non-empty string');
    	}
    	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
    		throw new $TypeError$1('"allowMissing" argument must be a boolean');
    	}

    	if ($exec(/^%?[^%]*%?$/, name) === null) {
    		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
    	}
    	var parts = stringToPath(name);
    	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

    	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
    	var intrinsicRealName = intrinsic.name;
    	var value = intrinsic.value;
    	var skipFurtherCaching = false;

    	var alias = intrinsic.alias;
    	if (alias) {
    		intrinsicBaseName = alias[0];
    		$spliceApply(parts, $concat([0, 1], alias));
    	}

    	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
    		var part = parts[i];
    		var first = $strSlice(part, 0, 1);
    		var last = $strSlice(part, -1);
    		if (
    			(
    				(first === '"' || first === "'" || first === '`')
    				|| (last === '"' || last === "'" || last === '`')
    			)
    			&& first !== last
    		) {
    			throw new $SyntaxError('property names with quotes must have matching quotes');
    		}
    		if (part === 'constructor' || !isOwn) {
    			skipFurtherCaching = true;
    		}

    		intrinsicBaseName += '.' + part;
    		intrinsicRealName = '%' + intrinsicBaseName + '%';

    		if (hasOwn$2(INTRINSICS, intrinsicRealName)) {
    			value = INTRINSICS[intrinsicRealName];
    		} else if (value != null) {
    			if (!(part in value)) {
    				if (!allowMissing) {
    					throw new $TypeError$1('base intrinsic for ' + name + ' exists, but the property is not available.');
    				}
    				return void undefined$1;
    			}
    			if ($gOPD && (i + 1) >= parts.length) {
    				var desc = $gOPD(value, part);
    				isOwn = !!desc;

    				// By convention, when a data property is converted to an accessor
    				// property to emulate a data property that does not suffer from
    				// the override mistake, that accessor's getter is marked with
    				// an `originalValue` property. Here, when we detect this, we
    				// uphold the illusion by pretending to see that original data
    				// property, i.e., returning the value rather than the getter
    				// itself.
    				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
    					value = desc.get;
    				} else {
    					value = value[part];
    				}
    			} else {
    				isOwn = hasOwn$2(value, part);
    				value = value[part];
    			}

    			if (isOwn && !skipFurtherCaching) {
    				INTRINSICS[intrinsicRealName] = value;
    			}
    		}
    	}
    	return value;
    };

    var shams;
    var hasRequiredShams;

    function requireShams () {
    	if (hasRequiredShams) return shams;
    	hasRequiredShams = 1;

    	var hasSymbols = requireShams$1();

    	/** @type {import('.')} */
    	shams = function hasToStringTagShams() {
    		return hasSymbols() && !!Symbol.toStringTag;
    	};
    	return shams;
    }

    var GetIntrinsic = getIntrinsic;

    var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);

    var hasToStringTag = requireShams()();
    var hasOwn$1 = hasown;
    var $TypeError = requireType();

    var toStringTag = hasToStringTag ? Symbol.toStringTag : null;

    /** @type {import('.')} */
    var esSetTostringtag = function setToStringTag(object, value) {
    	var overrideIfSet = arguments.length > 2 && !!arguments[2] && arguments[2].force;
    	var nonConfigurable = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
    	if (
    		(typeof overrideIfSet !== 'undefined' && typeof overrideIfSet !== 'boolean')
    		|| (typeof nonConfigurable !== 'undefined' && typeof nonConfigurable !== 'boolean')
    	) {
    		throw new $TypeError('if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans');
    	}
    	if (toStringTag && (overrideIfSet || !hasOwn$1(object, toStringTag))) {
    		if ($defineProperty) {
    			$defineProperty(object, toStringTag, {
    				configurable: !nonConfigurable,
    				enumerable: false,
    				value: value,
    				writable: false
    			});
    		} else {
    			object[toStringTag] = value; // eslint-disable-line no-param-reassign
    		}
    	}
    };

    // populates missing values
    var populate$1 = function (dst, src) {
      Object.keys(src).forEach(function (prop) {
        dst[prop] = dst[prop] || src[prop]; // eslint-disable-line no-param-reassign
      });

      return dst;
    };

    var CombinedStream = combined_stream;
    var util = require$$1;
    var path = require$$1$1;
    var http$2 = require$$3;
    var https$1 = require$$4;
    var parseUrl$2 = require$$0$1.parse;
    var fs = require$$6;
    var Stream = stream.Stream;
    var crypto = require$$8;
    var mime = mimeTypes;
    var asynckit = asynckit$1;
    var setToStringTag = esSetTostringtag;
    var hasOwn = hasown;
    var populate = populate$1;

    /**
     * Create readable "multipart/form-data" streams.
     * Can be used to submit forms
     * and file uploads to other web applications.
     *
     * @constructor
     * @param {object} options - Properties to be added/overriden for FormData and CombinedStream
     */
    function FormData$1(options) {
      if (!(this instanceof FormData$1)) {
        return new FormData$1(options);
      }

      this._overheadLength = 0;
      this._valueLength = 0;
      this._valuesToMeasure = [];

      CombinedStream.call(this);

      options = options || {}; // eslint-disable-line no-param-reassign
      for (var option in options) { // eslint-disable-line no-restricted-syntax
        this[option] = options[option];
      }
    }

    // make it a Stream
    util.inherits(FormData$1, CombinedStream);

    FormData$1.LINE_BREAK = '\r\n';
    FormData$1.DEFAULT_CONTENT_TYPE = 'application/octet-stream';

    FormData$1.prototype.append = function (field, value, options) {
      options = options || {}; // eslint-disable-line no-param-reassign

      // allow filename as single option
      if (typeof options === 'string') {
        options = { filename: options }; // eslint-disable-line no-param-reassign
      }

      var append = CombinedStream.prototype.append.bind(this);

      // all that streamy business can't handle numbers
      if (typeof value === 'number' || value == null) {
        value = String(value); // eslint-disable-line no-param-reassign
      }

      // https://github.com/felixge/node-form-data/issues/38
      if (Array.isArray(value)) {
        /*
         * Please convert your array into string
         * the way web server expects it
         */
        this._error(new Error('Arrays are not supported.'));
        return;
      }

      var header = this._multiPartHeader(field, value, options);
      var footer = this._multiPartFooter();

      append(header);
      append(value);
      append(footer);

      // pass along options.knownLength
      this._trackLength(header, value, options);
    };

    FormData$1.prototype._trackLength = function (header, value, options) {
      var valueLength = 0;

      /*
       * used w/ getLengthSync(), when length is known.
       * e.g. for streaming directly from a remote server,
       * w/ a known file a size, and not wanting to wait for
       * incoming file to finish to get its size.
       */
      if (options.knownLength != null) {
        valueLength += Number(options.knownLength);
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else if (typeof value === 'string') {
        valueLength = Buffer.byteLength(value);
      }

      this._valueLength += valueLength;

      // @check why add CRLF? does this account for custom/multiple CRLFs?
      this._overheadLength += Buffer.byteLength(header) + FormData$1.LINE_BREAK.length;

      // empty or either doesn't have path or not an http response or not a stream
      if (!value || (!value.path && !(value.readable && hasOwn(value, 'httpVersion')) && !(value instanceof Stream))) {
        return;
      }

      // no need to bother with the length
      if (!options.knownLength) {
        this._valuesToMeasure.push(value);
      }
    };

    FormData$1.prototype._lengthRetriever = function (value, callback) {
      if (hasOwn(value, 'fd')) {
        // take read range into a account
        // `end` = Infinity –> read file till the end
        //
        // TODO: Looks like there is bug in Node fs.createReadStream
        // it doesn't respect `end` options without `start` options
        // Fix it when node fixes it.
        // https://github.com/joyent/node/issues/7819
        if (value.end != undefined && value.end != Infinity && value.start != undefined) {
          // when end specified
          // no need to calculate range
          // inclusive, starts with 0
          callback(null, value.end + 1 - (value.start ? value.start : 0)); // eslint-disable-line callback-return

          // not that fast snoopy
        } else {
          // still need to fetch file size from fs
          fs.stat(value.path, function (err, stat) {
            if (err) {
              callback(err);
              return;
            }

            // update final size based on the range options
            var fileSize = stat.size - (value.start ? value.start : 0);
            callback(null, fileSize);
          });
        }

        // or http response
      } else if (hasOwn(value, 'httpVersion')) {
        callback(null, Number(value.headers['content-length'])); // eslint-disable-line callback-return

        // or request stream http://github.com/mikeal/request
      } else if (hasOwn(value, 'httpModule')) {
        // wait till response come back
        value.on('response', function (response) {
          value.pause();
          callback(null, Number(response.headers['content-length']));
        });
        value.resume();

        // something else
      } else {
        callback('Unknown stream'); // eslint-disable-line callback-return
      }
    };

    FormData$1.prototype._multiPartHeader = function (field, value, options) {
      /*
       * custom header specified (as string)?
       * it becomes responsible for boundary
       * (e.g. to handle extra CRLFs on .NET servers)
       */
      if (typeof options.header === 'string') {
        return options.header;
      }

      var contentDisposition = this._getContentDisposition(value, options);
      var contentType = this._getContentType(value, options);

      var contents = '';
      var headers = {
        // add custom disposition as third element or keep it two elements if not
        'Content-Disposition': ['form-data', 'name="' + field + '"'].concat(contentDisposition || []),
        // if no content type. allow it to be empty array
        'Content-Type': [].concat(contentType || [])
      };

      // allow custom headers.
      if (typeof options.header === 'object') {
        populate(headers, options.header);
      }

      var header;
      for (var prop in headers) { // eslint-disable-line no-restricted-syntax
        if (hasOwn(headers, prop)) {
          header = headers[prop];

          // skip nullish headers.
          if (header == null) {
            continue; // eslint-disable-line no-restricted-syntax, no-continue
          }

          // convert all headers to arrays.
          if (!Array.isArray(header)) {
            header = [header];
          }

          // add non-empty headers.
          if (header.length) {
            contents += prop + ': ' + header.join('; ') + FormData$1.LINE_BREAK;
          }
        }
      }

      return '--' + this.getBoundary() + FormData$1.LINE_BREAK + contents + FormData$1.LINE_BREAK;
    };

    FormData$1.prototype._getContentDisposition = function (value, options) { // eslint-disable-line consistent-return
      var filename;

      if (typeof options.filepath === 'string') {
        // custom filepath for relative paths
        filename = path.normalize(options.filepath).replace(/\\/g, '/');
      } else if (options.filename || (value && (value.name || value.path))) {
        /*
         * custom filename take precedence
         * formidable and the browser add a name property
         * fs- and request- streams have path property
         */
        filename = path.basename(options.filename || (value && (value.name || value.path)));
      } else if (value && value.readable && hasOwn(value, 'httpVersion')) {
        // or try http response
        filename = path.basename(value.client._httpMessage.path || '');
      }

      if (filename) {
        return 'filename="' + filename + '"';
      }
    };

    FormData$1.prototype._getContentType = function (value, options) {
      // use custom content-type above all
      var contentType = options.contentType;

      // or try `name` from formidable, browser
      if (!contentType && value && value.name) {
        contentType = mime.lookup(value.name);
      }

      // or try `path` from fs-, request- streams
      if (!contentType && value && value.path) {
        contentType = mime.lookup(value.path);
      }

      // or if it's http-reponse
      if (!contentType && value && value.readable && hasOwn(value, 'httpVersion')) {
        contentType = value.headers['content-type'];
      }

      // or guess it from the filepath or filename
      if (!contentType && (options.filepath || options.filename)) {
        contentType = mime.lookup(options.filepath || options.filename);
      }

      // fallback to the default content type if `value` is not simple value
      if (!contentType && value && typeof value === 'object') {
        contentType = FormData$1.DEFAULT_CONTENT_TYPE;
      }

      return contentType;
    };

    FormData$1.prototype._multiPartFooter = function () {
      return function (next) {
        var footer = FormData$1.LINE_BREAK;

        var lastPart = this._streams.length === 0;
        if (lastPart) {
          footer += this._lastBoundary();
        }

        next(footer);
      }.bind(this);
    };

    FormData$1.prototype._lastBoundary = function () {
      return '--' + this.getBoundary() + '--' + FormData$1.LINE_BREAK;
    };

    FormData$1.prototype.getHeaders = function (userHeaders) {
      var header;
      var formHeaders = {
        'content-type': 'multipart/form-data; boundary=' + this.getBoundary()
      };

      for (header in userHeaders) { // eslint-disable-line no-restricted-syntax
        if (hasOwn(userHeaders, header)) {
          formHeaders[header.toLowerCase()] = userHeaders[header];
        }
      }

      return formHeaders;
    };

    FormData$1.prototype.setBoundary = function (boundary) {
      if (typeof boundary !== 'string') {
        throw new TypeError('FormData boundary must be a string');
      }
      this._boundary = boundary;
    };

    FormData$1.prototype.getBoundary = function () {
      if (!this._boundary) {
        this._generateBoundary();
      }

      return this._boundary;
    };

    FormData$1.prototype.getBuffer = function () {
      var dataBuffer = new Buffer.alloc(0); // eslint-disable-line new-cap
      var boundary = this.getBoundary();

      // Create the form content. Add Line breaks to the end of data.
      for (var i = 0, len = this._streams.length; i < len; i++) {
        if (typeof this._streams[i] !== 'function') {
          // Add content to the buffer.
          if (Buffer.isBuffer(this._streams[i])) {
            dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
          } else {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
          }

          // Add break after content.
          if (typeof this._streams[i] !== 'string' || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData$1.LINE_BREAK)]);
          }
        }
      }

      // Add the footer and return the Buffer object.
      return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
    };

    FormData$1.prototype._generateBoundary = function () {
      // This generates a 50 character boundary similar to those used by Firefox.

      // They are optimized for boyer-moore parsing.
      this._boundary = '--------------------------' + crypto.randomBytes(12).toString('hex');
    };

    // Note: getLengthSync DOESN'T calculate streams length
    // As workaround one can calculate file size manually and add it as knownLength option
    FormData$1.prototype.getLengthSync = function () {
      var knownLength = this._overheadLength + this._valueLength;

      // Don't get confused, there are 3 "internal" streams for each keyval pair so it basically checks if there is any value added to the form
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }

      // https://github.com/form-data/form-data/issues/40
      if (!this.hasKnownLength()) {
        /*
         * Some async length retrievers are present
         * therefore synchronous length calculation is false.
         * Please use getLength(callback) to get proper length
         */
        this._error(new Error('Cannot calculate proper length in synchronous way.'));
      }

      return knownLength;
    };

    // Public API to check if length of added values is known
    // https://github.com/form-data/form-data/issues/196
    // https://github.com/form-data/form-data/issues/262
    FormData$1.prototype.hasKnownLength = function () {
      var hasKnownLength = true;

      if (this._valuesToMeasure.length) {
        hasKnownLength = false;
      }

      return hasKnownLength;
    };

    FormData$1.prototype.getLength = function (cb) {
      var knownLength = this._overheadLength + this._valueLength;

      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }

      if (!this._valuesToMeasure.length) {
        process.nextTick(cb.bind(this, null, knownLength));
        return;
      }

      asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function (err, values) {
        if (err) {
          cb(err);
          return;
        }

        values.forEach(function (length) {
          knownLength += length;
        });

        cb(null, knownLength);
      });
    };

    FormData$1.prototype.submit = function (params, cb) {
      var request;
      var options;
      var defaults = { method: 'post' };

      // parse provided url if it's string or treat it as options object
      if (typeof params === 'string') {
        params = parseUrl$2(params); // eslint-disable-line no-param-reassign
        /* eslint sort-keys: 0 */
        options = populate({
          port: params.port,
          path: params.pathname,
          host: params.hostname,
          protocol: params.protocol
        }, defaults);
      } else { // use custom params
        options = populate(params, defaults);
        // if no port provided use default one
        if (!options.port) {
          options.port = options.protocol === 'https:' ? 443 : 80;
        }
      }

      // put that good code in getHeaders to some use
      options.headers = this.getHeaders(params.headers);

      // https if specified, fallback to http in any other case
      if (options.protocol === 'https:') {
        request = https$1.request(options);
      } else {
        request = http$2.request(options);
      }

      // get content length and fire away
      this.getLength(function (err, length) {
        if (err && err !== 'Unknown stream') {
          this._error(err);
          return;
        }

        // add content length
        if (length) {
          request.setHeader('Content-Length', length);
        }

        this.pipe(request);
        if (cb) {
          var onResponse;

          var callback = function (error, responce) {
            request.removeListener('error', callback);
            request.removeListener('response', onResponse);

            return cb.call(this, error, responce); // eslint-disable-line no-invalid-this
          };

          onResponse = callback.bind(this, null);

          request.on('error', callback);
          request.on('response', onResponse);
        }
      }.bind(this));

      return request;
    };

    FormData$1.prototype._error = function (err) {
      if (!this.error) {
        this.error = err;
        this.pause();
        this.emit('error', err);
      }
    };

    FormData$1.prototype.toString = function () {
      return '[object FormData]';
    };
    setToStringTag(FormData$1, 'FormData');

    // Public API
    var form_data = FormData$1;

    var FormData$2 = /*@__PURE__*/getDefaultExportFromCjs(form_data);

    /**
     * Determines if the given thing is a array or js object.
     *
     * @param {string} thing - The object or array to be visited.
     *
     * @returns {boolean}
     */
    function isVisitable(thing) {
      return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
    }

    /**
     * It removes the brackets from the end of a string
     *
     * @param {string} key - The key of the parameter.
     *
     * @returns {string} the key without the brackets.
     */
    function removeBrackets(key) {
      return utils$1.endsWith(key, '[]') ? key.slice(0, -2) : key;
    }

    /**
     * It takes a path, a key, and a boolean, and returns a string
     *
     * @param {string} path - The path to the current key.
     * @param {string} key - The key of the current object being iterated over.
     * @param {string} dots - If true, the key will be rendered with dots instead of brackets.
     *
     * @returns {string} The path to the current key.
     */
    function renderKey(path, key, dots) {
      if (!path) return key;
      return path.concat(key).map(function each(token, i) {
        // eslint-disable-next-line no-param-reassign
        token = removeBrackets(token);
        return !dots && i ? '[' + token + ']' : token;
      }).join(dots ? '.' : '');
    }

    /**
     * If the array is an array and none of its elements are visitable, then it's a flat array.
     *
     * @param {Array<any>} arr - The array to check
     *
     * @returns {boolean}
     */
    function isFlatArray(arr) {
      return utils$1.isArray(arr) && !arr.some(isVisitable);
    }

    const predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });

    /**
     * Convert a data object to FormData
     *
     * @param {Object} obj
     * @param {?Object} [formData]
     * @param {?Object} [options]
     * @param {Function} [options.visitor]
     * @param {Boolean} [options.metaTokens = true]
     * @param {Boolean} [options.dots = false]
     * @param {?Boolean} [options.indexes = false]
     *
     * @returns {Object}
     **/

    /**
     * It converts an object into a FormData object
     *
     * @param {Object<any, any>} obj - The object to convert to form data.
     * @param {string} formData - The FormData object to append to.
     * @param {Object<string, any>} options
     *
     * @returns
     */
    function toFormData$1(obj, formData, options) {
      if (!utils$1.isObject(obj)) {
        throw new TypeError('target must be an object');
      }

      // eslint-disable-next-line no-param-reassign
      formData = formData || new (FormData$2 || FormData)();

      // eslint-disable-next-line no-param-reassign
      options = utils$1.toFlatObject(options, {
        metaTokens: true,
        dots: false,
        indexes: false
      }, false, function defined(option, source) {
        // eslint-disable-next-line no-eq-null,eqeqeq
        return !utils$1.isUndefined(source[option]);
      });

      const metaTokens = options.metaTokens;
      // eslint-disable-next-line no-use-before-define
      const visitor = options.visitor || defaultVisitor;
      const dots = options.dots;
      const indexes = options.indexes;
      const _Blob = options.Blob || typeof Blob !== 'undefined' && Blob;
      const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);

      if (!utils$1.isFunction(visitor)) {
        throw new TypeError('visitor must be a function');
      }

      function convertValue(value) {
        if (value === null) return '';

        if (utils$1.isDate(value)) {
          return value.toISOString();
        }

        if (utils$1.isBoolean(value)) {
          return value.toString();
        }

        if (!useBlob && utils$1.isBlob(value)) {
          throw new AxiosError$1('Blob is not supported. Use a Buffer instead.');
        }

        if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
          return useBlob && typeof Blob === 'function' ? new Blob([value]) : Buffer.from(value);
        }

        return value;
      }

      /**
       * Default visitor.
       *
       * @param {*} value
       * @param {String|Number} key
       * @param {Array<String|Number>} path
       * @this {FormData}
       *
       * @returns {boolean} return true to visit the each prop of the value recursively
       */
      function defaultVisitor(value, key, path) {
        let arr = value;

        if (value && !path && typeof value === 'object') {
          if (utils$1.endsWith(key, '{}')) {
            // eslint-disable-next-line no-param-reassign
            key = metaTokens ? key : key.slice(0, -2);
            // eslint-disable-next-line no-param-reassign
            value = JSON.stringify(value);
          } else if (
            (utils$1.isArray(value) && isFlatArray(value)) ||
            ((utils$1.isFileList(value) || utils$1.endsWith(key, '[]')) && (arr = utils$1.toArray(value))
            )) {
            // eslint-disable-next-line no-param-reassign
            key = removeBrackets(key);

            arr.forEach(function each(el, index) {
              !(utils$1.isUndefined(el) || el === null) && formData.append(
                // eslint-disable-next-line no-nested-ternary
                indexes === true ? renderKey([key], index, dots) : (indexes === null ? key : key + '[]'),
                convertValue(el)
              );
            });
            return false;
          }
        }

        if (isVisitable(value)) {
          return true;
        }

        formData.append(renderKey(path, key, dots), convertValue(value));

        return false;
      }

      const stack = [];

      const exposedHelpers = Object.assign(predicates, {
        defaultVisitor,
        convertValue,
        isVisitable
      });

      function build(value, path) {
        if (utils$1.isUndefined(value)) return;

        if (stack.indexOf(value) !== -1) {
          throw Error('Circular reference detected in ' + path.join('.'));
        }

        stack.push(value);

        utils$1.forEach(value, function each(el, key) {
          const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(
            formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers
          );

          if (result === true) {
            build(el, path ? path.concat(key) : [key]);
          }
        });

        stack.pop();
      }

      if (!utils$1.isObject(obj)) {
        throw new TypeError('data must be an object');
      }

      build(obj);

      return formData;
    }

    /**
     * It encodes a string by replacing all characters that are not in the unreserved set with
     * their percent-encoded equivalents
     *
     * @param {string} str - The string to encode.
     *
     * @returns {string} The encoded string.
     */
    function encode$1(str) {
      const charMap = {
        '!': '%21',
        "'": '%27',
        '(': '%28',
        ')': '%29',
        '~': '%7E',
        '%20': '+',
        '%00': '\x00'
      };
      return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
        return charMap[match];
      });
    }

    /**
     * It takes a params object and converts it to a FormData object
     *
     * @param {Object<string, any>} params - The parameters to be converted to a FormData object.
     * @param {Object<string, any>} options - The options object passed to the Axios constructor.
     *
     * @returns {void}
     */
    function AxiosURLSearchParams(params, options) {
      this._pairs = [];

      params && toFormData$1(params, this, options);
    }

    const prototype = AxiosURLSearchParams.prototype;

    prototype.append = function append(name, value) {
      this._pairs.push([name, value]);
    };

    prototype.toString = function toString(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode$1);
      } : encode$1;

      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + '=' + _encode(pair[1]);
      }, '').join('&');
    };

    /**
     * It replaces all instances of the characters `:`, `$`, `,`, `+`, `[`, and `]` with their
     * URI encoded counterparts
     *
     * @param {string} val The value to be encoded.
     *
     * @returns {string} The encoded value.
     */
    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @param {?(object|Function)} options
     *
     * @returns {string} The formatted url
     */
    function buildURL(url, params, options) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }
      
      const _encode = options && options.encode || encode;

      if (utils$1.isFunction(options)) {
        options = {
          serialize: options
        };
      } 

      const serializeFn = options && options.serialize;

      let serializedParams;

      if (serializeFn) {
        serializedParams = serializeFn(params, options);
      } else {
        serializedParams = utils$1.isURLSearchParams(params) ?
          params.toString() :
          new AxiosURLSearchParams(params, options).toString(_encode);
      }

      if (serializedParams) {
        const hashmarkIndex = url.indexOf("#");

        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }
        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    }

    class InterceptorManager {
      constructor() {
        this.handlers = [];
      }

      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }

      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }

      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }

      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils$1.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    }

    var transitionalDefaults = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    };

    var URLSearchParams$1 = require$$0$1.URLSearchParams;

    const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

    const DIGIT = '0123456789';

    const ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };

    const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = '';
      const {length} = alphabet;
      const randomValues = new Uint32Array(size);
      require$$8.randomFillSync(randomValues);
      for (let i = 0; i < size; i++) {
        str += alphabet[randomValues[i] % length];
      }

      return str;
    };


    var platform$1 = {
      isNode: true,
      classes: {
        URLSearchParams: URLSearchParams$1,
        FormData: FormData$2,
        Blob: typeof Blob !== 'undefined' && Blob || null
      },
      ALPHABET,
      generateString,
      protocols: [ 'http', 'https', 'file', 'data' ]
    };

    const hasBrowserEnv = typeof window !== 'undefined' && typeof document !== 'undefined';

    const _navigator = typeof navigator === 'object' && navigator || undefined;

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     *
     * @returns {boolean}
     */
    const hasStandardBrowserEnv = hasBrowserEnv &&
      (!_navigator || ['ReactNative', 'NativeScript', 'NS'].indexOf(_navigator.product) < 0);

    /**
     * Determine if we're running in a standard browser webWorker environment
     *
     * Although the `isStandardBrowserEnv` method indicates that
     * `allows axios to run in a web worker`, the WebWorker will still be
     * filtered out due to its judgment standard
     * `typeof window !== 'undefined' && typeof document !== 'undefined'`.
     * This leads to a problem when axios post `FormData` in webWorker
     */
    const hasStandardBrowserWebWorkerEnv = (() => {
      return (
        typeof WorkerGlobalScope !== 'undefined' &&
        // eslint-disable-next-line no-undef
        self instanceof WorkerGlobalScope &&
        typeof self.importScripts === 'function'
      );
    })();

    const origin = hasBrowserEnv && window.location.href || 'http://localhost';

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        hasBrowserEnv: hasBrowserEnv,
        hasStandardBrowserEnv: hasStandardBrowserEnv,
        hasStandardBrowserWebWorkerEnv: hasStandardBrowserWebWorkerEnv,
        navigator: _navigator,
        origin: origin
    });

    var platform = {
      ...utils,
      ...platform$1
    };

    function toURLEncodedForm(data, options) {
      return toFormData$1(data, new platform.classes.URLSearchParams(), {
        visitor: function(value, key, path, helpers) {
          if (platform.isNode && utils$1.isBuffer(value)) {
            this.append(key, value.toString('base64'));
            return false;
          }

          return helpers.defaultVisitor.apply(this, arguments);
        },
        ...options
      });
    }

    /**
     * It takes a string like `foo[x][y][z]` and returns an array like `['foo', 'x', 'y', 'z']
     *
     * @param {string} name - The name of the property to get.
     *
     * @returns An array of strings.
     */
    function parsePropPath(name) {
      // foo[x][y][z]
      // foo.x.y.z
      // foo-x-y-z
      // foo x y z
      return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map(match => {
        return match[0] === '[]' ? '' : match[1] || match[0];
      });
    }

    /**
     * Convert an array to an object.
     *
     * @param {Array<any>} arr - The array to convert to an object.
     *
     * @returns An object with the same keys and values as the array.
     */
    function arrayToObject(arr) {
      const obj = {};
      const keys = Object.keys(arr);
      let i;
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        obj[key] = arr[key];
      }
      return obj;
    }

    /**
     * It takes a FormData object and returns a JavaScript object
     *
     * @param {string} formData The FormData object to convert to JSON.
     *
     * @returns {Object<string, any> | null} The converted object.
     */
    function formDataToJSON(formData) {
      function buildPath(path, value, target, index) {
        let name = path[index++];

        if (name === '__proto__') return true;

        const isNumericKey = Number.isFinite(+name);
        const isLast = index >= path.length;
        name = !name && utils$1.isArray(target) ? target.length : name;

        if (isLast) {
          if (utils$1.hasOwnProp(target, name)) {
            target[name] = [target[name], value];
          } else {
            target[name] = value;
          }

          return !isNumericKey;
        }

        if (!target[name] || !utils$1.isObject(target[name])) {
          target[name] = [];
        }

        const result = buildPath(path, value, target[name], index);

        if (result && utils$1.isArray(target[name])) {
          target[name] = arrayToObject(target[name]);
        }

        return !isNumericKey;
      }

      if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
        const obj = {};

        utils$1.forEachEntry(formData, (name, value) => {
          buildPath(parsePropPath(name), value, obj, 0);
        });

        return obj;
      }

      return null;
    }

    /**
     * It takes a string, tries to parse it, and if it fails, it returns the stringified version
     * of the input
     *
     * @param {any} rawValue - The value to be stringified.
     * @param {Function} parser - A function that parses a string into a JavaScript object.
     * @param {Function} encoder - A function that takes a value and returns a string.
     *
     * @returns {string} A stringified version of the rawValue.
     */
    function stringifySafely(rawValue, parser, encoder) {
      if (utils$1.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils$1.trim(rawValue);
        } catch (e) {
          if (e.name !== 'SyntaxError') {
            throw e;
          }
        }
      }

      return (encoder || JSON.stringify)(rawValue);
    }

    const defaults = {

      transitional: transitionalDefaults,

      adapter: ['xhr', 'http', 'fetch'],

      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || '';
        const hasJSONContentType = contentType.indexOf('application/json') > -1;
        const isObjectPayload = utils$1.isObject(data);

        if (isObjectPayload && utils$1.isHTMLForm(data)) {
          data = new FormData(data);
        }

        const isFormData = utils$1.isFormData(data);

        if (isFormData) {
          return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
        }

        if (utils$1.isArrayBuffer(data) ||
          utils$1.isBuffer(data) ||
          utils$1.isStream(data) ||
          utils$1.isFile(data) ||
          utils$1.isBlob(data) ||
          utils$1.isReadableStream(data)
        ) {
          return data;
        }
        if (utils$1.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils$1.isURLSearchParams(data)) {
          headers.setContentType('application/x-www-form-urlencoded;charset=utf-8', false);
          return data.toString();
        }

        let isFileList;

        if (isObjectPayload) {
          if (contentType.indexOf('application/x-www-form-urlencoded') > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }

          if ((isFileList = utils$1.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
            const _FormData = this.env && this.env.FormData;

            return toFormData$1(
              isFileList ? {'files[]': data} : data,
              _FormData && new _FormData(),
              this.formSerializer
            );
          }
        }

        if (isObjectPayload || hasJSONContentType ) {
          headers.setContentType('application/json', false);
          return stringifySafely(data);
        }

        return data;
      }],

      transformResponse: [function transformResponse(data) {
        const transitional = this.transitional || defaults.transitional;
        const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        const JSONRequested = this.responseType === 'json';

        if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
          return data;
        }

        if (data && utils$1.isString(data) && ((forcedJSONParsing && !this.responseType) || JSONRequested)) {
          const silentJSONParsing = transitional && transitional.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;

          try {
            return JSON.parse(data);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === 'SyntaxError') {
                throw AxiosError$1.from(e, AxiosError$1.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }

        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      env: {
        FormData: platform.classes.FormData,
        Blob: platform.classes.Blob
      },

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },

      headers: {
        common: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': undefined
        }
      }
    };

    utils$1.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (method) => {
      defaults.headers[method] = {};
    });

    // RawAxiosHeaders whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    const ignoreDuplicateOf = utils$1.toObjectSet([
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ]);

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} rawHeaders Headers needing to be parsed
     *
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = rawHeaders => {
      const parsed = {};
      let key;
      let val;
      let i;

      rawHeaders && rawHeaders.split('\n').forEach(function parser(line) {
        i = line.indexOf(':');
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();

        if (!key || (parsed[key] && ignoreDuplicateOf[key])) {
          return;
        }

        if (key === 'set-cookie') {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      });

      return parsed;
    };

    const $internals = Symbol('internals');

    function normalizeHeader(header) {
      return header && String(header).trim().toLowerCase();
    }

    function normalizeValue(value) {
      if (value === false || value == null) {
        return value;
      }

      return utils$1.isArray(value) ? value.map(normalizeValue) : String(value);
    }

    function parseTokens(str) {
      const tokens = Object.create(null);
      const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
      let match;

      while ((match = tokensRE.exec(str))) {
        tokens[match[1]] = match[2];
      }

      return tokens;
    }

    const isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());

    function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
      if (utils$1.isFunction(filter)) {
        return filter.call(this, value, header);
      }

      if (isHeaderNameFilter) {
        value = header;
      }

      if (!utils$1.isString(value)) return;

      if (utils$1.isString(filter)) {
        return value.indexOf(filter) !== -1;
      }

      if (utils$1.isRegExp(filter)) {
        return filter.test(value);
      }
    }

    function formatHeader(header) {
      return header.trim()
        .toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
          return char.toUpperCase() + str;
        });
    }

    function buildAccessors(obj, header) {
      const accessorName = utils$1.toCamelCase(' ' + header);

      ['get', 'set', 'has'].forEach(methodName => {
        Object.defineProperty(obj, methodName + accessorName, {
          value: function(arg1, arg2, arg3) {
            return this[methodName].call(this, header, arg1, arg2, arg3);
          },
          configurable: true
        });
      });
    }

    let AxiosHeaders$1 = class AxiosHeaders {
      constructor(headers) {
        headers && this.set(headers);
      }

      set(header, valueOrRewrite, rewrite) {
        const self = this;

        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);

          if (!lHeader) {
            throw new Error('header name must be a non-empty string');
          }

          const key = utils$1.findKey(self, lHeader);

          if(!key || self[key] === undefined || _rewrite === true || (_rewrite === undefined && self[key] !== false)) {
            self[key || _header] = normalizeValue(_value);
          }
        }

        const setHeaders = (headers, _rewrite) =>
          utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));

        if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if(utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders(header), valueOrRewrite);
        } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
          let obj = {}, dest, key;
          for (const entry of header) {
            if (!utils$1.isArray(entry)) {
              throw TypeError('Object iterator must return a key-value pair');
            }

            obj[key = entry[0]] = (dest = obj[key]) ?
              (utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]]) : entry[1];
          }

          setHeaders(obj, valueOrRewrite);
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }

        return this;
      }

      get(header, parser) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          if (key) {
            const value = this[key];

            if (!parser) {
              return value;
            }

            if (parser === true) {
              return parseTokens(value);
            }

            if (utils$1.isFunction(parser)) {
              return parser.call(this, value, key);
            }

            if (utils$1.isRegExp(parser)) {
              return parser.exec(value);
            }

            throw new TypeError('parser must be boolean|regexp|function');
          }
        }
      }

      has(header, matcher) {
        header = normalizeHeader(header);

        if (header) {
          const key = utils$1.findKey(this, header);

          return !!(key && this[key] !== undefined && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }

        return false;
      }

      delete(header, matcher) {
        const self = this;
        let deleted = false;

        function deleteHeader(_header) {
          _header = normalizeHeader(_header);

          if (_header) {
            const key = utils$1.findKey(self, _header);

            if (key && (!matcher || matchHeaderValue(self, self[key], key, matcher))) {
              delete self[key];

              deleted = true;
            }
          }
        }

        if (utils$1.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }

        return deleted;
      }

      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;

        while (i--) {
          const key = keys[i];
          if(!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }

        return deleted;
      }

      normalize(format) {
        const self = this;
        const headers = {};

        utils$1.forEach(this, (value, header) => {
          const key = utils$1.findKey(headers, header);

          if (key) {
            self[key] = normalizeValue(value);
            delete self[header];
            return;
          }

          const normalized = format ? formatHeader(header) : String(header).trim();

          if (normalized !== header) {
            delete self[header];
          }

          self[normalized] = normalizeValue(value);

          headers[normalized] = true;
        });

        return this;
      }

      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }

      toJSON(asStrings) {
        const obj = Object.create(null);

        utils$1.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(', ') : value);
        });

        return obj;
      }

      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }

      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ': ' + value).join('\n');
      }

      getSetCookie() {
        return this.get("set-cookie") || [];
      }

      get [Symbol.toStringTag]() {
        return 'AxiosHeaders';
      }

      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }

      static concat(first, ...targets) {
        const computed = new this(first);

        targets.forEach((target) => computed.set(target));

        return computed;
      }

      static accessor(header) {
        const internals = this[$internals] = (this[$internals] = {
          accessors: {}
        });

        const accessors = internals.accessors;
        const prototype = this.prototype;

        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);

          if (!accessors[lHeader]) {
            buildAccessors(prototype, _header);
            accessors[lHeader] = true;
          }
        }

        utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);

        return this;
      }
    };

    AxiosHeaders$1.accessor(['Content-Type', 'Content-Length', 'Accept', 'Accept-Encoding', 'User-Agent', 'Authorization']);

    // reserved names hotfix
    utils$1.reduceDescriptors(AxiosHeaders$1.prototype, ({value}, key) => {
      let mapped = key[0].toUpperCase() + key.slice(1); // map `set` => `Set`
      return {
        get: () => value,
        set(headerValue) {
          this[mapped] = headerValue;
        }
      }
    });

    utils$1.freezeMethods(AxiosHeaders$1);

    /**
     * Transform the data for a request or a response
     *
     * @param {Array|Function} fns A single function or Array of functions
     * @param {?Object} response The response object
     *
     * @returns {*} The resulting transformed data
     */
    function transformData(fns, response) {
      const config = this || defaults;
      const context = response || config;
      const headers = AxiosHeaders$1.from(context.headers);
      let data = context.data;

      utils$1.forEach(fns, function transform(fn) {
        data = fn.call(config, data, headers.normalize(), response ? response.status : undefined);
      });

      headers.normalize();

      return data;
    }

    function isCancel$1(value) {
      return !!(value && value.__CANCEL__);
    }

    /**
     * A `CanceledError` is an object that is thrown when an operation is canceled.
     *
     * @param {string=} message The message.
     * @param {Object=} config The config.
     * @param {Object=} request The request.
     *
     * @returns {CanceledError} The created error.
     */
    function CanceledError$1(message, config, request) {
      // eslint-disable-next-line no-eq-null,eqeqeq
      AxiosError$1.call(this, message == null ? 'canceled' : message, AxiosError$1.ERR_CANCELED, config, request);
      this.name = 'CanceledError';
    }

    utils$1.inherits(CanceledError$1, AxiosError$1, {
      __CANCEL__: true
    });

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     *
     * @returns {object} The response.
     */
    function settle(resolve, reject, response) {
      const validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError$1(
          'Request failed with status code ' + response.status,
          [AxiosError$1.ERR_BAD_REQUEST, AxiosError$1.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
          response.config,
          response.request,
          response
        ));
      }
    }

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     *
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    function isAbsoluteURL$1(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    }

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     *
     * @returns {string} The combined URL
     */
    function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/?\/$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    }

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     *
     * @returns {string} The combined full path
     */
    function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
      let isRelativeUrl = !isAbsoluteURL$1(requestedURL);
      if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    }

    var proxyFromEnv = {};

    var parseUrl$1 = require$$0$1.parse;

    var DEFAULT_PORTS = {
      ftp: 21,
      gopher: 70,
      http: 80,
      https: 443,
      ws: 80,
      wss: 443,
    };

    var stringEndsWith = String.prototype.endsWith || function(s) {
      return s.length <= this.length &&
        this.indexOf(s, this.length - s.length) !== -1;
    };

    /**
     * @param {string|object} url - The URL, or the result from url.parse.
     * @return {string} The URL of the proxy that should handle the request to the
     *  given URL. If no proxy is set, this will be an empty string.
     */
    function getProxyForUrl(url) {
      var parsedUrl = typeof url === 'string' ? parseUrl$1(url) : url || {};
      var proto = parsedUrl.protocol;
      var hostname = parsedUrl.host;
      var port = parsedUrl.port;
      if (typeof hostname !== 'string' || !hostname || typeof proto !== 'string') {
        return '';  // Don't proxy URLs without a valid scheme or host.
      }

      proto = proto.split(':', 1)[0];
      // Stripping ports in this way instead of using parsedUrl.hostname to make
      // sure that the brackets around IPv6 addresses are kept.
      hostname = hostname.replace(/:\d*$/, '');
      port = parseInt(port) || DEFAULT_PORTS[proto] || 0;
      if (!shouldProxy(hostname, port)) {
        return '';  // Don't proxy URLs that match NO_PROXY.
      }

      var proxy =
        getEnv('npm_config_' + proto + '_proxy') ||
        getEnv(proto + '_proxy') ||
        getEnv('npm_config_proxy') ||
        getEnv('all_proxy');
      if (proxy && proxy.indexOf('://') === -1) {
        // Missing scheme in proxy, default to the requested URL's scheme.
        proxy = proto + '://' + proxy;
      }
      return proxy;
    }

    /**
     * Determines whether a given URL should be proxied.
     *
     * @param {string} hostname - The host name of the URL.
     * @param {number} port - The effective port of the URL.
     * @returns {boolean} Whether the given URL should be proxied.
     * @private
     */
    function shouldProxy(hostname, port) {
      var NO_PROXY =
        (getEnv('npm_config_no_proxy') || getEnv('no_proxy')).toLowerCase();
      if (!NO_PROXY) {
        return true;  // Always proxy if NO_PROXY is not set.
      }
      if (NO_PROXY === '*') {
        return false;  // Never proxy if wildcard is set.
      }

      return NO_PROXY.split(/[,\s]/).every(function(proxy) {
        if (!proxy) {
          return true;  // Skip zero-length hosts.
        }
        var parsedProxy = proxy.match(/^(.+):(\d+)$/);
        var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
        var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
        if (parsedProxyPort && parsedProxyPort !== port) {
          return true;  // Skip if ports don't match.
        }

        if (!/^[.*]/.test(parsedProxyHostname)) {
          // No wildcards, so stop proxying if there is an exact match.
          return hostname !== parsedProxyHostname;
        }

        if (parsedProxyHostname.charAt(0) === '*') {
          // Remove leading wildcard.
          parsedProxyHostname = parsedProxyHostname.slice(1);
        }
        // Stop proxying if the hostname ends with the no_proxy host.
        return !stringEndsWith.call(hostname, parsedProxyHostname);
      });
    }

    /**
     * Get the value for an environment variable.
     *
     * @param {string} key - The name of the environment variable.
     * @return {string} The value of the environment variable.
     * @private
     */
    function getEnv(key) {
      return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || '';
    }

    proxyFromEnv.getProxyForUrl = getProxyForUrl;

    var followRedirects$1 = {exports: {}};

    var src = {exports: {}};

    var browser$1 = {exports: {}};

    /**
     * Helpers.
     */

    var ms;
    var hasRequiredMs;

    function requireMs () {
    	if (hasRequiredMs) return ms;
    	hasRequiredMs = 1;
    	var s = 1000;
    	var m = s * 60;
    	var h = m * 60;
    	var d = h * 24;
    	var w = d * 7;
    	var y = d * 365.25;

    	/**
    	 * Parse or format the given `val`.
    	 *
    	 * Options:
    	 *
    	 *  - `long` verbose formatting [false]
    	 *
    	 * @param {String|Number} val
    	 * @param {Object} [options]
    	 * @throws {Error} throw an error if val is not a non-empty string or a number
    	 * @return {String|Number}
    	 * @api public
    	 */

    	ms = function (val, options) {
    	  options = options || {};
    	  var type = typeof val;
    	  if (type === 'string' && val.length > 0) {
    	    return parse(val);
    	  } else if (type === 'number' && isFinite(val)) {
    	    return options.long ? fmtLong(val) : fmtShort(val);
    	  }
    	  throw new Error(
    	    'val is not a non-empty string or a valid number. val=' +
    	      JSON.stringify(val)
    	  );
    	};

    	/**
    	 * Parse the given `str` and return milliseconds.
    	 *
    	 * @param {String} str
    	 * @return {Number}
    	 * @api private
    	 */

    	function parse(str) {
    	  str = String(str);
    	  if (str.length > 100) {
    	    return;
    	  }
    	  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    	    str
    	  );
    	  if (!match) {
    	    return;
    	  }
    	  var n = parseFloat(match[1]);
    	  var type = (match[2] || 'ms').toLowerCase();
    	  switch (type) {
    	    case 'years':
    	    case 'year':
    	    case 'yrs':
    	    case 'yr':
    	    case 'y':
    	      return n * y;
    	    case 'weeks':
    	    case 'week':
    	    case 'w':
    	      return n * w;
    	    case 'days':
    	    case 'day':
    	    case 'd':
    	      return n * d;
    	    case 'hours':
    	    case 'hour':
    	    case 'hrs':
    	    case 'hr':
    	    case 'h':
    	      return n * h;
    	    case 'minutes':
    	    case 'minute':
    	    case 'mins':
    	    case 'min':
    	    case 'm':
    	      return n * m;
    	    case 'seconds':
    	    case 'second':
    	    case 'secs':
    	    case 'sec':
    	    case 's':
    	      return n * s;
    	    case 'milliseconds':
    	    case 'millisecond':
    	    case 'msecs':
    	    case 'msec':
    	    case 'ms':
    	      return n;
    	    default:
    	      return undefined;
    	  }
    	}

    	/**
    	 * Short format for `ms`.
    	 *
    	 * @param {Number} ms
    	 * @return {String}
    	 * @api private
    	 */

    	function fmtShort(ms) {
    	  var msAbs = Math.abs(ms);
    	  if (msAbs >= d) {
    	    return Math.round(ms / d) + 'd';
    	  }
    	  if (msAbs >= h) {
    	    return Math.round(ms / h) + 'h';
    	  }
    	  if (msAbs >= m) {
    	    return Math.round(ms / m) + 'm';
    	  }
    	  if (msAbs >= s) {
    	    return Math.round(ms / s) + 's';
    	  }
    	  return ms + 'ms';
    	}

    	/**
    	 * Long format for `ms`.
    	 *
    	 * @param {Number} ms
    	 * @return {String}
    	 * @api private
    	 */

    	function fmtLong(ms) {
    	  var msAbs = Math.abs(ms);
    	  if (msAbs >= d) {
    	    return plural(ms, msAbs, d, 'day');
    	  }
    	  if (msAbs >= h) {
    	    return plural(ms, msAbs, h, 'hour');
    	  }
    	  if (msAbs >= m) {
    	    return plural(ms, msAbs, m, 'minute');
    	  }
    	  if (msAbs >= s) {
    	    return plural(ms, msAbs, s, 'second');
    	  }
    	  return ms + ' ms';
    	}

    	/**
    	 * Pluralization helper.
    	 */

    	function plural(ms, msAbs, n, name) {
    	  var isPlural = msAbs >= n * 1.5;
    	  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    	}
    	return ms;
    }

    var common;
    var hasRequiredCommon;

    function requireCommon () {
    	if (hasRequiredCommon) return common;
    	hasRequiredCommon = 1;
    	/**
    	 * This is the common logic for both the Node.js and web browser
    	 * implementations of `debug()`.
    	 */

    	function setup(env) {
    		createDebug.debug = createDebug;
    		createDebug.default = createDebug;
    		createDebug.coerce = coerce;
    		createDebug.disable = disable;
    		createDebug.enable = enable;
    		createDebug.enabled = enabled;
    		createDebug.humanize = requireMs();
    		createDebug.destroy = destroy;

    		Object.keys(env).forEach(key => {
    			createDebug[key] = env[key];
    		});

    		/**
    		* The currently active debug mode names, and names to skip.
    		*/

    		createDebug.names = [];
    		createDebug.skips = [];

    		/**
    		* Map of special "%n" handling functions, for the debug "format" argument.
    		*
    		* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    		*/
    		createDebug.formatters = {};

    		/**
    		* Selects a color for a debug namespace
    		* @param {String} namespace The namespace string for the debug instance to be colored
    		* @return {Number|String} An ANSI color code for the given namespace
    		* @api private
    		*/
    		function selectColor(namespace) {
    			let hash = 0;

    			for (let i = 0; i < namespace.length; i++) {
    				hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    				hash |= 0; // Convert to 32bit integer
    			}

    			return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    		}
    		createDebug.selectColor = selectColor;

    		/**
    		* Create a debugger with the given `namespace`.
    		*
    		* @param {String} namespace
    		* @return {Function}
    		* @api public
    		*/
    		function createDebug(namespace) {
    			let prevTime;
    			let enableOverride = null;
    			let namespacesCache;
    			let enabledCache;

    			function debug(...args) {
    				// Disabled?
    				if (!debug.enabled) {
    					return;
    				}

    				const self = debug;

    				// Set `diff` timestamp
    				const curr = Number(new Date());
    				const ms = curr - (prevTime || curr);
    				self.diff = ms;
    				self.prev = prevTime;
    				self.curr = curr;
    				prevTime = curr;

    				args[0] = createDebug.coerce(args[0]);

    				if (typeof args[0] !== 'string') {
    					// Anything else let's inspect with %O
    					args.unshift('%O');
    				}

    				// Apply any `formatters` transformations
    				let index = 0;
    				args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    					// If we encounter an escaped % then don't increase the array index
    					if (match === '%%') {
    						return '%';
    					}
    					index++;
    					const formatter = createDebug.formatters[format];
    					if (typeof formatter === 'function') {
    						const val = args[index];
    						match = formatter.call(self, val);

    						// Now we need to remove `args[index]` since it's inlined in the `format`
    						args.splice(index, 1);
    						index--;
    					}
    					return match;
    				});

    				// Apply env-specific formatting (colors, etc.)
    				createDebug.formatArgs.call(self, args);

    				const logFn = self.log || createDebug.log;
    				logFn.apply(self, args);
    			}

    			debug.namespace = namespace;
    			debug.useColors = createDebug.useColors();
    			debug.color = createDebug.selectColor(namespace);
    			debug.extend = extend;
    			debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    			Object.defineProperty(debug, 'enabled', {
    				enumerable: true,
    				configurable: false,
    				get: () => {
    					if (enableOverride !== null) {
    						return enableOverride;
    					}
    					if (namespacesCache !== createDebug.namespaces) {
    						namespacesCache = createDebug.namespaces;
    						enabledCache = createDebug.enabled(namespace);
    					}

    					return enabledCache;
    				},
    				set: v => {
    					enableOverride = v;
    				}
    			});

    			// Env-specific initialization logic for debug instances
    			if (typeof createDebug.init === 'function') {
    				createDebug.init(debug);
    			}

    			return debug;
    		}

    		function extend(namespace, delimiter) {
    			const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    			newDebug.log = this.log;
    			return newDebug;
    		}

    		/**
    		* Enables a debug mode by namespaces. This can include modes
    		* separated by a colon and wildcards.
    		*
    		* @param {String} namespaces
    		* @api public
    		*/
    		function enable(namespaces) {
    			createDebug.save(namespaces);
    			createDebug.namespaces = namespaces;

    			createDebug.names = [];
    			createDebug.skips = [];

    			const split = (typeof namespaces === 'string' ? namespaces : '')
    				.trim()
    				.replace(/\s+/g, ',')
    				.split(',')
    				.filter(Boolean);

    			for (const ns of split) {
    				if (ns[0] === '-') {
    					createDebug.skips.push(ns.slice(1));
    				} else {
    					createDebug.names.push(ns);
    				}
    			}
    		}

    		/**
    		 * Checks if the given string matches a namespace template, honoring
    		 * asterisks as wildcards.
    		 *
    		 * @param {String} search
    		 * @param {String} template
    		 * @return {Boolean}
    		 */
    		function matchesTemplate(search, template) {
    			let searchIndex = 0;
    			let templateIndex = 0;
    			let starIndex = -1;
    			let matchIndex = 0;

    			while (searchIndex < search.length) {
    				if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
    					// Match character or proceed with wildcard
    					if (template[templateIndex] === '*') {
    						starIndex = templateIndex;
    						matchIndex = searchIndex;
    						templateIndex++; // Skip the '*'
    					} else {
    						searchIndex++;
    						templateIndex++;
    					}
    				} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
    					// Backtrack to the last '*' and try to match more characters
    					templateIndex = starIndex + 1;
    					matchIndex++;
    					searchIndex = matchIndex;
    				} else {
    					return false; // No match
    				}
    			}

    			// Handle trailing '*' in template
    			while (templateIndex < template.length && template[templateIndex] === '*') {
    				templateIndex++;
    			}

    			return templateIndex === template.length;
    		}

    		/**
    		* Disable debug output.
    		*
    		* @return {String} namespaces
    		* @api public
    		*/
    		function disable() {
    			const namespaces = [
    				...createDebug.names,
    				...createDebug.skips.map(namespace => '-' + namespace)
    			].join(',');
    			createDebug.enable('');
    			return namespaces;
    		}

    		/**
    		* Returns true if the given mode name is enabled, false otherwise.
    		*
    		* @param {String} name
    		* @return {Boolean}
    		* @api public
    		*/
    		function enabled(name) {
    			for (const skip of createDebug.skips) {
    				if (matchesTemplate(name, skip)) {
    					return false;
    				}
    			}

    			for (const ns of createDebug.names) {
    				if (matchesTemplate(name, ns)) {
    					return true;
    				}
    			}

    			return false;
    		}

    		/**
    		* Coerce `val`.
    		*
    		* @param {Mixed} val
    		* @return {Mixed}
    		* @api private
    		*/
    		function coerce(val) {
    			if (val instanceof Error) {
    				return val.stack || val.message;
    			}
    			return val;
    		}

    		/**
    		* XXX DO NOT USE. This is a temporary stub function.
    		* XXX It WILL be removed in the next major release.
    		*/
    		function destroy() {
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}

    		createDebug.enable(createDebug.load());

    		return createDebug;
    	}

    	common = setup;
    	return common;
    }

    /* eslint-env browser */

    var hasRequiredBrowser$1;

    function requireBrowser$1 () {
    	if (hasRequiredBrowser$1) return browser$1.exports;
    	hasRequiredBrowser$1 = 1;
    	(function (module, exports) {
    		/**
    		 * This is the web browser implementation of `debug()`.
    		 */

    		exports.formatArgs = formatArgs;
    		exports.save = save;
    		exports.load = load;
    		exports.useColors = useColors;
    		exports.storage = localstorage();
    		exports.destroy = (() => {
    			let warned = false;

    			return () => {
    				if (!warned) {
    					warned = true;
    					console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    				}
    			};
    		})();

    		/**
    		 * Colors.
    		 */

    		exports.colors = [
    			'#0000CC',
    			'#0000FF',
    			'#0033CC',
    			'#0033FF',
    			'#0066CC',
    			'#0066FF',
    			'#0099CC',
    			'#0099FF',
    			'#00CC00',
    			'#00CC33',
    			'#00CC66',
    			'#00CC99',
    			'#00CCCC',
    			'#00CCFF',
    			'#3300CC',
    			'#3300FF',
    			'#3333CC',
    			'#3333FF',
    			'#3366CC',
    			'#3366FF',
    			'#3399CC',
    			'#3399FF',
    			'#33CC00',
    			'#33CC33',
    			'#33CC66',
    			'#33CC99',
    			'#33CCCC',
    			'#33CCFF',
    			'#6600CC',
    			'#6600FF',
    			'#6633CC',
    			'#6633FF',
    			'#66CC00',
    			'#66CC33',
    			'#9900CC',
    			'#9900FF',
    			'#9933CC',
    			'#9933FF',
    			'#99CC00',
    			'#99CC33',
    			'#CC0000',
    			'#CC0033',
    			'#CC0066',
    			'#CC0099',
    			'#CC00CC',
    			'#CC00FF',
    			'#CC3300',
    			'#CC3333',
    			'#CC3366',
    			'#CC3399',
    			'#CC33CC',
    			'#CC33FF',
    			'#CC6600',
    			'#CC6633',
    			'#CC9900',
    			'#CC9933',
    			'#CCCC00',
    			'#CCCC33',
    			'#FF0000',
    			'#FF0033',
    			'#FF0066',
    			'#FF0099',
    			'#FF00CC',
    			'#FF00FF',
    			'#FF3300',
    			'#FF3333',
    			'#FF3366',
    			'#FF3399',
    			'#FF33CC',
    			'#FF33FF',
    			'#FF6600',
    			'#FF6633',
    			'#FF9900',
    			'#FF9933',
    			'#FFCC00',
    			'#FFCC33'
    		];

    		/**
    		 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
    		 * and the Firebug extension (any Firefox version) are known
    		 * to support "%c" CSS customizations.
    		 *
    		 * TODO: add a `localStorage` variable to explicitly enable/disable colors
    		 */

    		// eslint-disable-next-line complexity
    		function useColors() {
    			// NB: In an Electron preload script, document will be defined but not fully
    			// initialized. Since we know we're in Chrome, we'll just detect this case
    			// explicitly
    			if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    				return true;
    			}

    			// Internet Explorer and Edge do not support colors.
    			if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    				return false;
    			}

    			let m;

    			// Is webkit? http://stackoverflow.com/a/16459606/376773
    			// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    			// eslint-disable-next-line no-return-assign
    			return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    				// Is firebug? http://stackoverflow.com/a/398120/376773
    				(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    				// Is firefox >= v31?
    				// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    				(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
    				// Double check webkit in userAgent just in case we are in a worker
    				(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    		}

    		/**
    		 * Colorize log arguments if enabled.
    		 *
    		 * @api public
    		 */

    		function formatArgs(args) {
    			args[0] = (this.useColors ? '%c' : '') +
    				this.namespace +
    				(this.useColors ? ' %c' : ' ') +
    				args[0] +
    				(this.useColors ? '%c ' : ' ') +
    				'+' + module.exports.humanize(this.diff);

    			if (!this.useColors) {
    				return;
    			}

    			const c = 'color: ' + this.color;
    			args.splice(1, 0, c, 'color: inherit');

    			// The final "%c" is somewhat tricky, because there could be other
    			// arguments passed either before or after the %c, so we need to
    			// figure out the correct index to insert the CSS into
    			let index = 0;
    			let lastC = 0;
    			args[0].replace(/%[a-zA-Z%]/g, match => {
    				if (match === '%%') {
    					return;
    				}
    				index++;
    				if (match === '%c') {
    					// We only are interested in the *last* %c
    					// (the user may have provided their own)
    					lastC = index;
    				}
    			});

    			args.splice(lastC, 0, c);
    		}

    		/**
    		 * Invokes `console.debug()` when available.
    		 * No-op when `console.debug` is not a "function".
    		 * If `console.debug` is not available, falls back
    		 * to `console.log`.
    		 *
    		 * @api public
    		 */
    		exports.log = console.debug || console.log || (() => {});

    		/**
    		 * Save `namespaces`.
    		 *
    		 * @param {String} namespaces
    		 * @api private
    		 */
    		function save(namespaces) {
    			try {
    				if (namespaces) {
    					exports.storage.setItem('debug', namespaces);
    				} else {
    					exports.storage.removeItem('debug');
    				}
    			} catch (error) {
    				// Swallow
    				// XXX (@Qix-) should we be logging these?
    			}
    		}

    		/**
    		 * Load `namespaces`.
    		 *
    		 * @return {String} returns the previously persisted debug modes
    		 * @api private
    		 */
    		function load() {
    			let r;
    			try {
    				r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
    			} catch (error) {
    				// Swallow
    				// XXX (@Qix-) should we be logging these?
    			}

    			// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    			if (!r && typeof process !== 'undefined' && 'env' in process) {
    				r = process.env.DEBUG;
    			}

    			return r;
    		}

    		/**
    		 * Localstorage attempts to return the localstorage.
    		 *
    		 * This is necessary because safari throws
    		 * when a user disables cookies/localstorage
    		 * and you attempt to access it.
    		 *
    		 * @return {LocalStorage}
    		 * @api private
    		 */

    		function localstorage() {
    			try {
    				// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    				// The Browser also has localStorage in the global context.
    				return localStorage;
    			} catch (error) {
    				// Swallow
    				// XXX (@Qix-) should we be logging these?
    			}
    		}

    		module.exports = requireCommon()(exports);

    		const {formatters} = module.exports;

    		/**
    		 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
    		 */

    		formatters.j = function (v) {
    			try {
    				return JSON.stringify(v);
    			} catch (error) {
    				return '[UnexpectedJSONParseError]: ' + error.message;
    			}
    		}; 
    	} (browser$1, browser$1.exports));
    	return browser$1.exports;
    }

    var node = {exports: {}};

    /* eslint-env browser */

    var browser;
    var hasRequiredBrowser;

    function requireBrowser () {
    	if (hasRequiredBrowser) return browser;
    	hasRequiredBrowser = 1;

    	function getChromeVersion() {
    		const matches = /(Chrome|Chromium)\/(?<chromeVersion>\d+)\./.exec(navigator.userAgent);

    		if (!matches) {
    			return;
    		}

    		return Number.parseInt(matches.groups.chromeVersion, 10);
    	}

    	const colorSupport = getChromeVersion() >= 69 ? {
    		level: 1,
    		hasBasic: true,
    		has256: false,
    		has16m: false
    	} : false;

    	browser = {
    		stdout: colorSupport,
    		stderr: colorSupport
    	};
    	return browser;
    }

    /**
     * Module dependencies.
     */

    var hasRequiredNode;

    function requireNode () {
    	if (hasRequiredNode) return node.exports;
    	hasRequiredNode = 1;
    	(function (module, exports) {
    		const tty = require$$0$2;
    		const util = require$$1;

    		/**
    		 * This is the Node.js implementation of `debug()`.
    		 */

    		exports.init = init;
    		exports.log = log;
    		exports.formatArgs = formatArgs;
    		exports.save = save;
    		exports.load = load;
    		exports.useColors = useColors;
    		exports.destroy = util.deprecate(
    			() => {},
    			'Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.'
    		);

    		/**
    		 * Colors.
    		 */

    		exports.colors = [6, 2, 3, 4, 5, 1];

    		try {
    			// Optional dependency (as in, doesn't need to be installed, NOT like optionalDependencies in package.json)
    			// eslint-disable-next-line import/no-extraneous-dependencies
    			const supportsColor = requireBrowser();

    			if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
    				exports.colors = [
    					20,
    					21,
    					26,
    					27,
    					32,
    					33,
    					38,
    					39,
    					40,
    					41,
    					42,
    					43,
    					44,
    					45,
    					56,
    					57,
    					62,
    					63,
    					68,
    					69,
    					74,
    					75,
    					76,
    					77,
    					78,
    					79,
    					80,
    					81,
    					92,
    					93,
    					98,
    					99,
    					112,
    					113,
    					128,
    					129,
    					134,
    					135,
    					148,
    					149,
    					160,
    					161,
    					162,
    					163,
    					164,
    					165,
    					166,
    					167,
    					168,
    					169,
    					170,
    					171,
    					172,
    					173,
    					178,
    					179,
    					184,
    					185,
    					196,
    					197,
    					198,
    					199,
    					200,
    					201,
    					202,
    					203,
    					204,
    					205,
    					206,
    					207,
    					208,
    					209,
    					214,
    					215,
    					220,
    					221
    				];
    			}
    		} catch (error) {
    			// Swallow - we only care if `supports-color` is available; it doesn't have to be.
    		}

    		/**
    		 * Build up the default `inspectOpts` object from the environment variables.
    		 *
    		 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
    		 */

    		exports.inspectOpts = Object.keys(process.env).filter(key => {
    			return /^debug_/i.test(key);
    		}).reduce((obj, key) => {
    			// Camel-case
    			const prop = key
    				.substring(6)
    				.toLowerCase()
    				.replace(/_([a-z])/g, (_, k) => {
    					return k.toUpperCase();
    				});

    			// Coerce string value into JS value
    			let val = process.env[key];
    			if (/^(yes|on|true|enabled)$/i.test(val)) {
    				val = true;
    			} else if (/^(no|off|false|disabled)$/i.test(val)) {
    				val = false;
    			} else if (val === 'null') {
    				val = null;
    			} else {
    				val = Number(val);
    			}

    			obj[prop] = val;
    			return obj;
    		}, {});

    		/**
    		 * Is stdout a TTY? Colored output is enabled when `true`.
    		 */

    		function useColors() {
    			return 'colors' in exports.inspectOpts ?
    				Boolean(exports.inspectOpts.colors) :
    				tty.isatty(process.stderr.fd);
    		}

    		/**
    		 * Adds ANSI color escape codes if enabled.
    		 *
    		 * @api public
    		 */

    		function formatArgs(args) {
    			const {namespace: name, useColors} = this;

    			if (useColors) {
    				const c = this.color;
    				const colorCode = '\u001B[3' + (c < 8 ? c : '8;5;' + c);
    				const prefix = `  ${colorCode};1m${name} \u001B[0m`;

    				args[0] = prefix + args[0].split('\n').join('\n' + prefix);
    				args.push(colorCode + 'm+' + module.exports.humanize(this.diff) + '\u001B[0m');
    			} else {
    				args[0] = getDate() + name + ' ' + args[0];
    			}
    		}

    		function getDate() {
    			if (exports.inspectOpts.hideDate) {
    				return '';
    			}
    			return new Date().toISOString() + ' ';
    		}

    		/**
    		 * Invokes `util.formatWithOptions()` with the specified arguments and writes to stderr.
    		 */

    		function log(...args) {
    			return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + '\n');
    		}

    		/**
    		 * Save `namespaces`.
    		 *
    		 * @param {String} namespaces
    		 * @api private
    		 */
    		function save(namespaces) {
    			if (namespaces) {
    				process.env.DEBUG = namespaces;
    			} else {
    				// If you set a process.env field to null or undefined, it gets cast to the
    				// string 'null' or 'undefined'. Just delete instead.
    				delete process.env.DEBUG;
    			}
    		}

    		/**
    		 * Load `namespaces`.
    		 *
    		 * @return {String} returns the previously persisted debug modes
    		 * @api private
    		 */

    		function load() {
    			return process.env.DEBUG;
    		}

    		/**
    		 * Init logic for `debug` instances.
    		 *
    		 * Create a new `inspectOpts` object in case `useColors` is set
    		 * differently for a particular `debug` instance.
    		 */

    		function init(debug) {
    			debug.inspectOpts = {};

    			const keys = Object.keys(exports.inspectOpts);
    			for (let i = 0; i < keys.length; i++) {
    				debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
    			}
    		}

    		module.exports = requireCommon()(exports);

    		const {formatters} = module.exports;

    		/**
    		 * Map %o to `util.inspect()`, all on a single line.
    		 */

    		formatters.o = function (v) {
    			this.inspectOpts.colors = this.useColors;
    			return util.inspect(v, this.inspectOpts)
    				.split('\n')
    				.map(str => str.trim())
    				.join(' ');
    		};

    		/**
    		 * Map %O to `util.inspect()`, allowing multiple lines if needed.
    		 */

    		formatters.O = function (v) {
    			this.inspectOpts.colors = this.useColors;
    			return util.inspect(v, this.inspectOpts);
    		}; 
    	} (node, node.exports));
    	return node.exports;
    }

    /**
     * Detect Electron renderer / nwjs process, which is node, but we should
     * treat as a browser.
     */

    var hasRequiredSrc;

    function requireSrc () {
    	if (hasRequiredSrc) return src.exports;
    	hasRequiredSrc = 1;
    	if (typeof process === 'undefined' || process.type === 'renderer' || process.browser === true || process.__nwjs) {
    		src.exports = requireBrowser$1();
    	} else {
    		src.exports = requireNode();
    	}
    	return src.exports;
    }

    var debug$1;

    var debug_1 = function () {
      if (!debug$1) {
        try {
          /* eslint global-require: off */
          debug$1 = requireSrc()("follow-redirects");
        }
        catch (error) { /* */ }
        if (typeof debug$1 !== "function") {
          debug$1 = function () { /* */ };
        }
      }
      debug$1.apply(null, arguments);
    };

    var url = require$$0$1;
    var URL$1 = url.URL;
    var http$1 = require$$3;
    var https = require$$4;
    var Writable = stream.Writable;
    var assert = require$$4$1;
    var debug = debug_1;

    // Preventive platform detection
    // istanbul ignore next
    (function detectUnsupportedEnvironment() {
      var looksLikeNode = typeof process !== "undefined";
      var looksLikeBrowser = typeof window !== "undefined" && typeof document !== "undefined";
      var looksLikeV8 = isFunction(Error.captureStackTrace);
      if (!looksLikeNode && (looksLikeBrowser || !looksLikeV8)) {
        console.warn("The follow-redirects package should be excluded from browser builds.");
      }
    }());

    // Whether to use the native URL object or the legacy url module
    var useNativeURL = false;
    try {
      assert(new URL$1(""));
    }
    catch (error) {
      useNativeURL = error.code === "ERR_INVALID_URL";
    }

    // URL fields to preserve in copy operations
    var preservedUrlFields = [
      "auth",
      "host",
      "hostname",
      "href",
      "path",
      "pathname",
      "port",
      "protocol",
      "query",
      "search",
      "hash",
    ];

    // Create handlers that pass events from native requests
    var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
    var eventHandlers = Object.create(null);
    events.forEach(function (event) {
      eventHandlers[event] = function (arg1, arg2, arg3) {
        this._redirectable.emit(event, arg1, arg2, arg3);
      };
    });

    // Error types with codes
    var InvalidUrlError = createErrorType(
      "ERR_INVALID_URL",
      "Invalid URL",
      TypeError
    );
    var RedirectionError = createErrorType(
      "ERR_FR_REDIRECTION_FAILURE",
      "Redirected request failed"
    );
    var TooManyRedirectsError = createErrorType(
      "ERR_FR_TOO_MANY_REDIRECTS",
      "Maximum number of redirects exceeded",
      RedirectionError
    );
    var MaxBodyLengthExceededError = createErrorType(
      "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
      "Request body larger than maxBodyLength limit"
    );
    var WriteAfterEndError = createErrorType(
      "ERR_STREAM_WRITE_AFTER_END",
      "write after end"
    );

    // istanbul ignore next
    var destroy = Writable.prototype.destroy || noop$1;

    // An HTTP(S) request that can be redirected
    function RedirectableRequest(options, responseCallback) {
      // Initialize the request
      Writable.call(this);
      this._sanitizeOptions(options);
      this._options = options;
      this._ended = false;
      this._ending = false;
      this._redirectCount = 0;
      this._redirects = [];
      this._requestBodyLength = 0;
      this._requestBodyBuffers = [];

      // Attach a callback if passed
      if (responseCallback) {
        this.on("response", responseCallback);
      }

      // React to responses of native requests
      var self = this;
      this._onNativeResponse = function (response) {
        try {
          self._processResponse(response);
        }
        catch (cause) {
          self.emit("error", cause instanceof RedirectionError ?
            cause : new RedirectionError({ cause: cause }));
        }
      };

      // Perform the first request
      this._performRequest();
    }
    RedirectableRequest.prototype = Object.create(Writable.prototype);

    RedirectableRequest.prototype.abort = function () {
      destroyRequest(this._currentRequest);
      this._currentRequest.abort();
      this.emit("abort");
    };

    RedirectableRequest.prototype.destroy = function (error) {
      destroyRequest(this._currentRequest, error);
      destroy.call(this, error);
      return this;
    };

    // Writes buffered data to the current native request
    RedirectableRequest.prototype.write = function (data, encoding, callback) {
      // Writing is not allowed if end has been called
      if (this._ending) {
        throw new WriteAfterEndError();
      }

      // Validate input and shift parameters if necessary
      if (!isString$1(data) && !isBuffer(data)) {
        throw new TypeError("data should be a string, Buffer or Uint8Array");
      }
      if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }

      // Ignore empty buffers, since writing them doesn't invoke the callback
      // https://github.com/nodejs/node/issues/22066
      if (data.length === 0) {
        if (callback) {
          callback();
        }
        return;
      }
      // Only write when we don't exceed the maximum body length
      if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
        this._requestBodyLength += data.length;
        this._requestBodyBuffers.push({ data: data, encoding: encoding });
        this._currentRequest.write(data, encoding, callback);
      }
      // Error when we exceed the maximum body length
      else {
        this.emit("error", new MaxBodyLengthExceededError());
        this.abort();
      }
    };

    // Ends the current native request
    RedirectableRequest.prototype.end = function (data, encoding, callback) {
      // Shift parameters if necessary
      if (isFunction(data)) {
        callback = data;
        data = encoding = null;
      }
      else if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }

      // Write data if needed and end
      if (!data) {
        this._ended = this._ending = true;
        this._currentRequest.end(null, null, callback);
      }
      else {
        var self = this;
        var currentRequest = this._currentRequest;
        this.write(data, encoding, function () {
          self._ended = true;
          currentRequest.end(null, null, callback);
        });
        this._ending = true;
      }
    };

    // Sets a header value on the current native request
    RedirectableRequest.prototype.setHeader = function (name, value) {
      this._options.headers[name] = value;
      this._currentRequest.setHeader(name, value);
    };

    // Clears a header value on the current native request
    RedirectableRequest.prototype.removeHeader = function (name) {
      delete this._options.headers[name];
      this._currentRequest.removeHeader(name);
    };

    // Global timeout for all underlying requests
    RedirectableRequest.prototype.setTimeout = function (msecs, callback) {
      var self = this;

      // Destroys the socket on timeout
      function destroyOnTimeout(socket) {
        socket.setTimeout(msecs);
        socket.removeListener("timeout", socket.destroy);
        socket.addListener("timeout", socket.destroy);
      }

      // Sets up a timer to trigger a timeout event
      function startTimer(socket) {
        if (self._timeout) {
          clearTimeout(self._timeout);
        }
        self._timeout = setTimeout(function () {
          self.emit("timeout");
          clearTimer();
        }, msecs);
        destroyOnTimeout(socket);
      }

      // Stops a timeout from triggering
      function clearTimer() {
        // Clear the timeout
        if (self._timeout) {
          clearTimeout(self._timeout);
          self._timeout = null;
        }

        // Clean up all attached listeners
        self.removeListener("abort", clearTimer);
        self.removeListener("error", clearTimer);
        self.removeListener("response", clearTimer);
        self.removeListener("close", clearTimer);
        if (callback) {
          self.removeListener("timeout", callback);
        }
        if (!self.socket) {
          self._currentRequest.removeListener("socket", startTimer);
        }
      }

      // Attach callback if passed
      if (callback) {
        this.on("timeout", callback);
      }

      // Start the timer if or when the socket is opened
      if (this.socket) {
        startTimer(this.socket);
      }
      else {
        this._currentRequest.once("socket", startTimer);
      }

      // Clean up on events
      this.on("socket", destroyOnTimeout);
      this.on("abort", clearTimer);
      this.on("error", clearTimer);
      this.on("response", clearTimer);
      this.on("close", clearTimer);

      return this;
    };

    // Proxy all other public ClientRequest methods
    [
      "flushHeaders", "getHeader",
      "setNoDelay", "setSocketKeepAlive",
    ].forEach(function (method) {
      RedirectableRequest.prototype[method] = function (a, b) {
        return this._currentRequest[method](a, b);
      };
    });

    // Proxy all public ClientRequest properties
    ["aborted", "connection", "socket"].forEach(function (property) {
      Object.defineProperty(RedirectableRequest.prototype, property, {
        get: function () { return this._currentRequest[property]; },
      });
    });

    RedirectableRequest.prototype._sanitizeOptions = function (options) {
      // Ensure headers are always present
      if (!options.headers) {
        options.headers = {};
      }

      // Since http.request treats host as an alias of hostname,
      // but the url module interprets host as hostname plus port,
      // eliminate the host property to avoid confusion.
      if (options.host) {
        // Use hostname if set, because it has precedence
        if (!options.hostname) {
          options.hostname = options.host;
        }
        delete options.host;
      }

      // Complete the URL object when necessary
      if (!options.pathname && options.path) {
        var searchPos = options.path.indexOf("?");
        if (searchPos < 0) {
          options.pathname = options.path;
        }
        else {
          options.pathname = options.path.substring(0, searchPos);
          options.search = options.path.substring(searchPos);
        }
      }
    };


    // Executes the next native request (initial or redirect)
    RedirectableRequest.prototype._performRequest = function () {
      // Load the native protocol
      var protocol = this._options.protocol;
      var nativeProtocol = this._options.nativeProtocols[protocol];
      if (!nativeProtocol) {
        throw new TypeError("Unsupported protocol " + protocol);
      }

      // If specified, use the agent corresponding to the protocol
      // (HTTP and HTTPS use different types of agents)
      if (this._options.agents) {
        var scheme = protocol.slice(0, -1);
        this._options.agent = this._options.agents[scheme];
      }

      // Create the native request and set up its event handlers
      var request = this._currentRequest =
            nativeProtocol.request(this._options, this._onNativeResponse);
      request._redirectable = this;
      for (var event of events) {
        request.on(event, eventHandlers[event]);
      }

      // RFC7230§5.3.1: When making a request directly to an origin server, […]
      // a client MUST send only the absolute path […] as the request-target.
      this._currentUrl = /^\//.test(this._options.path) ?
        url.format(this._options) :
        // When making a request to a proxy, […]
        // a client MUST send the target URI in absolute-form […].
        this._options.path;

      // End a redirected request
      // (The first request must be ended explicitly with RedirectableRequest#end)
      if (this._isRedirect) {
        // Write the request entity and end
        var i = 0;
        var self = this;
        var buffers = this._requestBodyBuffers;
        (function writeNext(error) {
          // Only write if this request has not been redirected yet
          // istanbul ignore else
          if (request === self._currentRequest) {
            // Report any write errors
            // istanbul ignore if
            if (error) {
              self.emit("error", error);
            }
            // Write the next buffer if there are still left
            else if (i < buffers.length) {
              var buffer = buffers[i++];
              // istanbul ignore else
              if (!request.finished) {
                request.write(buffer.data, buffer.encoding, writeNext);
              }
            }
            // End the request if `end` has been called on us
            else if (self._ended) {
              request.end();
            }
          }
        }());
      }
    };

    // Processes a response from the current native request
    RedirectableRequest.prototype._processResponse = function (response) {
      // Store the redirected response
      var statusCode = response.statusCode;
      if (this._options.trackRedirects) {
        this._redirects.push({
          url: this._currentUrl,
          headers: response.headers,
          statusCode: statusCode,
        });
      }

      // RFC7231§6.4: The 3xx (Redirection) class of status code indicates
      // that further action needs to be taken by the user agent in order to
      // fulfill the request. If a Location header field is provided,
      // the user agent MAY automatically redirect its request to the URI
      // referenced by the Location field value,
      // even if the specific status code is not understood.

      // If the response is not a redirect; return it as-is
      var location = response.headers.location;
      if (!location || this._options.followRedirects === false ||
          statusCode < 300 || statusCode >= 400) {
        response.responseUrl = this._currentUrl;
        response.redirects = this._redirects;
        this.emit("response", response);

        // Clean up
        this._requestBodyBuffers = [];
        return;
      }

      // The response is a redirect, so abort the current request
      destroyRequest(this._currentRequest);
      // Discard the remainder of the response to avoid waiting for data
      response.destroy();

      // RFC7231§6.4: A client SHOULD detect and intervene
      // in cyclical redirections (i.e., "infinite" redirection loops).
      if (++this._redirectCount > this._options.maxRedirects) {
        throw new TooManyRedirectsError();
      }

      // Store the request headers if applicable
      var requestHeaders;
      var beforeRedirect = this._options.beforeRedirect;
      if (beforeRedirect) {
        requestHeaders = Object.assign({
          // The Host header was set by nativeProtocol.request
          Host: response.req.getHeader("host"),
        }, this._options.headers);
      }

      // RFC7231§6.4: Automatic redirection needs to done with
      // care for methods not known to be safe, […]
      // RFC7231§6.4.2–3: For historical reasons, a user agent MAY change
      // the request method from POST to GET for the subsequent request.
      var method = this._options.method;
      if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" ||
          // RFC7231§6.4.4: The 303 (See Other) status code indicates that
          // the server is redirecting the user agent to a different resource […]
          // A user agent can perform a retrieval request targeting that URI
          // (a GET or HEAD request if using HTTP) […]
          (statusCode === 303) && !/^(?:GET|HEAD)$/.test(this._options.method)) {
        this._options.method = "GET";
        // Drop a possible entity and headers related to it
        this._requestBodyBuffers = [];
        removeMatchingHeaders(/^content-/i, this._options.headers);
      }

      // Drop the Host header, as the redirect might lead to a different host
      var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);

      // If the redirect is relative, carry over the host of the last request
      var currentUrlParts = parseUrl(this._currentUrl);
      var currentHost = currentHostHeader || currentUrlParts.host;
      var currentUrl = /^\w+:/.test(location) ? this._currentUrl :
        url.format(Object.assign(currentUrlParts, { host: currentHost }));

      // Create the redirected request
      var redirectUrl = resolveUrl(location, currentUrl);
      debug("redirecting to", redirectUrl.href);
      this._isRedirect = true;
      spreadUrlObject(redirectUrl, this._options);

      // Drop confidential headers when redirecting to a less secure protocol
      // or to a different domain that is not a superdomain
      if (redirectUrl.protocol !== currentUrlParts.protocol &&
         redirectUrl.protocol !== "https:" ||
         redirectUrl.host !== currentHost &&
         !isSubdomain(redirectUrl.host, currentHost)) {
        removeMatchingHeaders(/^(?:(?:proxy-)?authorization|cookie)$/i, this._options.headers);
      }

      // Evaluate the beforeRedirect callback
      if (isFunction(beforeRedirect)) {
        var responseDetails = {
          headers: response.headers,
          statusCode: statusCode,
        };
        var requestDetails = {
          url: currentUrl,
          method: method,
          headers: requestHeaders,
        };
        beforeRedirect(this._options, responseDetails, requestDetails);
        this._sanitizeOptions(this._options);
      }

      // Perform the redirected request
      this._performRequest();
    };

    // Wraps the key/value object of protocols with redirect functionality
    function wrap(protocols) {
      // Default settings
      var exports = {
        maxRedirects: 21,
        maxBodyLength: 10 * 1024 * 1024,
      };

      // Wrap each protocol
      var nativeProtocols = {};
      Object.keys(protocols).forEach(function (scheme) {
        var protocol = scheme + ":";
        var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
        var wrappedProtocol = exports[scheme] = Object.create(nativeProtocol);

        // Executes a request, following redirects
        function request(input, options, callback) {
          // Parse parameters, ensuring that input is an object
          if (isURL(input)) {
            input = spreadUrlObject(input);
          }
          else if (isString$1(input)) {
            input = spreadUrlObject(parseUrl(input));
          }
          else {
            callback = options;
            options = validateUrl(input);
            input = { protocol: protocol };
          }
          if (isFunction(options)) {
            callback = options;
            options = null;
          }

          // Set defaults
          options = Object.assign({
            maxRedirects: exports.maxRedirects,
            maxBodyLength: exports.maxBodyLength,
          }, input, options);
          options.nativeProtocols = nativeProtocols;
          if (!isString$1(options.host) && !isString$1(options.hostname)) {
            options.hostname = "::1";
          }

          assert.equal(options.protocol, protocol, "protocol mismatch");
          debug("options", options);
          return new RedirectableRequest(options, callback);
        }

        // Executes a GET request, following redirects
        function get(input, options, callback) {
          var wrappedRequest = wrappedProtocol.request(input, options, callback);
          wrappedRequest.end();
          return wrappedRequest;
        }

        // Expose the properties on the wrapped protocol
        Object.defineProperties(wrappedProtocol, {
          request: { value: request, configurable: true, enumerable: true, writable: true },
          get: { value: get, configurable: true, enumerable: true, writable: true },
        });
      });
      return exports;
    }

    function noop$1() { /* empty */ }

    function parseUrl(input) {
      var parsed;
      // istanbul ignore else
      if (useNativeURL) {
        parsed = new URL$1(input);
      }
      else {
        // Ensure the URL is valid and absolute
        parsed = validateUrl(url.parse(input));
        if (!isString$1(parsed.protocol)) {
          throw new InvalidUrlError({ input });
        }
      }
      return parsed;
    }

    function resolveUrl(relative, base) {
      // istanbul ignore next
      return useNativeURL ? new URL$1(relative, base) : parseUrl(url.resolve(base, relative));
    }

    function validateUrl(input) {
      if (/^\[/.test(input.hostname) && !/^\[[:0-9a-f]+\]$/i.test(input.hostname)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      if (/^\[/.test(input.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(input.host)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      return input;
    }

    function spreadUrlObject(urlObject, target) {
      var spread = target || {};
      for (var key of preservedUrlFields) {
        spread[key] = urlObject[key];
      }

      // Fix IPv6 hostname
      if (spread.hostname.startsWith("[")) {
        spread.hostname = spread.hostname.slice(1, -1);
      }
      // Ensure port is a number
      if (spread.port !== "") {
        spread.port = Number(spread.port);
      }
      // Concatenate path
      spread.path = spread.search ? spread.pathname + spread.search : spread.pathname;

      return spread;
    }

    function removeMatchingHeaders(regex, headers) {
      var lastValue;
      for (var header in headers) {
        if (regex.test(header)) {
          lastValue = headers[header];
          delete headers[header];
        }
      }
      return (lastValue === null || typeof lastValue === "undefined") ?
        undefined : String(lastValue).trim();
    }

    function createErrorType(code, message, baseClass) {
      // Create constructor
      function CustomError(properties) {
        // istanbul ignore else
        if (isFunction(Error.captureStackTrace)) {
          Error.captureStackTrace(this, this.constructor);
        }
        Object.assign(this, properties || {});
        this.code = code;
        this.message = this.cause ? message + ": " + this.cause.message : message;
      }

      // Attach constructor and set default properties
      CustomError.prototype = new (baseClass || Error)();
      Object.defineProperties(CustomError.prototype, {
        constructor: {
          value: CustomError,
          enumerable: false,
        },
        name: {
          value: "Error [" + code + "]",
          enumerable: false,
        },
      });
      return CustomError;
    }

    function destroyRequest(request, error) {
      for (var event of events) {
        request.removeListener(event, eventHandlers[event]);
      }
      request.on("error", noop$1);
      request.destroy(error);
    }

    function isSubdomain(subdomain, domain) {
      assert(isString$1(subdomain) && isString$1(domain));
      var dot = subdomain.length - domain.length - 1;
      return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
    }

    function isString$1(value) {
      return typeof value === "string" || value instanceof String;
    }

    function isFunction(value) {
      return typeof value === "function";
    }

    function isBuffer(value) {
      return typeof value === "object" && ("length" in value);
    }

    function isURL(value) {
      return URL$1 && value instanceof URL$1;
    }

    // Exports
    followRedirects$1.exports = wrap({ http: http$1, https: https });
    followRedirects$1.exports.wrap = wrap;

    var followRedirectsExports = followRedirects$1.exports;
    var followRedirects = /*@__PURE__*/getDefaultExportFromCjs(followRedirectsExports);

    const VERSION$1 = "1.11.0";

    function parseProtocol(url) {
      const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
      return match && match[1] || '';
    }

    const DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;

    /**
     * Parse data uri to a Buffer or Blob
     *
     * @param {String} uri
     * @param {?Boolean} asBlob
     * @param {?Object} options
     * @param {?Function} options.Blob
     *
     * @returns {Buffer|Blob}
     */
    function fromDataURI(uri, asBlob, options) {
      const _Blob = options && options.Blob || platform.classes.Blob;
      const protocol = parseProtocol(uri);

      if (asBlob === undefined && _Blob) {
        asBlob = true;
      }

      if (protocol === 'data') {
        uri = protocol.length ? uri.slice(protocol.length + 1) : uri;

        const match = DATA_URL_PATTERN.exec(uri);

        if (!match) {
          throw new AxiosError$1('Invalid URL', AxiosError$1.ERR_INVALID_URL);
        }

        const mime = match[1];
        const isBase64 = match[2];
        const body = match[3];
        const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? 'base64' : 'utf8');

        if (asBlob) {
          if (!_Blob) {
            throw new AxiosError$1('Blob is not supported', AxiosError$1.ERR_NOT_SUPPORT);
          }

          return new _Blob([buffer], {type: mime});
        }

        return buffer;
      }

      throw new AxiosError$1('Unsupported protocol ' + protocol, AxiosError$1.ERR_NOT_SUPPORT);
    }

    const kInternals = Symbol('internals');

    class AxiosTransformStream extends stream.Transform{
      constructor(options) {
        options = utils$1.toFlatObject(options, {
          maxRate: 0,
          chunkSize: 64 * 1024,
          minChunkSize: 100,
          timeWindow: 500,
          ticksRate: 2,
          samplesCount: 15
        }, null, (prop, source) => {
          return !utils$1.isUndefined(source[prop]);
        });

        super({
          readableHighWaterMark: options.chunkSize
        });

        const internals = this[kInternals] = {
          timeWindow: options.timeWindow,
          chunkSize: options.chunkSize,
          maxRate: options.maxRate,
          minChunkSize: options.minChunkSize,
          bytesSeen: 0,
          isCaptured: false,
          notifiedBytesLoaded: 0,
          ts: Date.now(),
          bytes: 0,
          onReadCallback: null
        };

        this.on('newListener', event => {
          if (event === 'progress') {
            if (!internals.isCaptured) {
              internals.isCaptured = true;
            }
          }
        });
      }

      _read(size) {
        const internals = this[kInternals];

        if (internals.onReadCallback) {
          internals.onReadCallback();
        }

        return super._read(size);
      }

      _transform(chunk, encoding, callback) {
        const internals = this[kInternals];
        const maxRate = internals.maxRate;

        const readableHighWaterMark = this.readableHighWaterMark;

        const timeWindow = internals.timeWindow;

        const divider = 1000 / timeWindow;
        const bytesThreshold = (maxRate / divider);
        const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;

        const pushChunk = (_chunk, _callback) => {
          const bytes = Buffer.byteLength(_chunk);
          internals.bytesSeen += bytes;
          internals.bytes += bytes;

          internals.isCaptured && this.emit('progress', internals.bytesSeen);

          if (this.push(_chunk)) {
            process.nextTick(_callback);
          } else {
            internals.onReadCallback = () => {
              internals.onReadCallback = null;
              process.nextTick(_callback);
            };
          }
        };

        const transformChunk = (_chunk, _callback) => {
          const chunkSize = Buffer.byteLength(_chunk);
          let chunkRemainder = null;
          let maxChunkSize = readableHighWaterMark;
          let bytesLeft;
          let passed = 0;

          if (maxRate) {
            const now = Date.now();

            if (!internals.ts || (passed = (now - internals.ts)) >= timeWindow) {
              internals.ts = now;
              bytesLeft = bytesThreshold - internals.bytes;
              internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
              passed = 0;
            }

            bytesLeft = bytesThreshold - internals.bytes;
          }

          if (maxRate) {
            if (bytesLeft <= 0) {
              // next time window
              return setTimeout(() => {
                _callback(null, _chunk);
              }, timeWindow - passed);
            }

            if (bytesLeft < maxChunkSize) {
              maxChunkSize = bytesLeft;
            }
          }

          if (maxChunkSize && chunkSize > maxChunkSize && (chunkSize - maxChunkSize) > minChunkSize) {
            chunkRemainder = _chunk.subarray(maxChunkSize);
            _chunk = _chunk.subarray(0, maxChunkSize);
          }

          pushChunk(_chunk, chunkRemainder ? () => {
            process.nextTick(_callback, null, chunkRemainder);
          } : _callback);
        };

        transformChunk(chunk, function transformNextChunk(err, _chunk) {
          if (err) {
            return callback(err);
          }

          if (_chunk) {
            transformChunk(_chunk, transformNextChunk);
          } else {
            callback(null);
          }
        });
      }
    }

    const {asyncIterator} = Symbol;

    const readBlob = async function* (blob) {
      if (blob.stream) {
        yield* blob.stream();
      } else if (blob.arrayBuffer) {
        yield await blob.arrayBuffer();
      } else if (blob[asyncIterator]) {
        yield* blob[asyncIterator]();
      } else {
        yield blob;
      }
    };

    const BOUNDARY_ALPHABET = platform.ALPHABET.ALPHA_DIGIT + '-_';

    const textEncoder = typeof TextEncoder === 'function' ? new TextEncoder() : new require$$1.TextEncoder();

    const CRLF = '\r\n';
    const CRLF_BYTES = textEncoder.encode(CRLF);
    const CRLF_BYTES_COUNT = 2;

    class FormDataPart {
      constructor(name, value) {
        const {escapeName} = this.constructor;
        const isStringValue = utils$1.isString(value);

        let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${
      !isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ''
    }${CRLF}`;

        if (isStringValue) {
          value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
        } else {
          headers += `Content-Type: ${value.type || "application/octet-stream"}${CRLF}`;
        }

        this.headers = textEncoder.encode(headers + CRLF);

        this.contentLength = isStringValue ? value.byteLength : value.size;

        this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;

        this.name = name;
        this.value = value;
      }

      async *encode(){
        yield this.headers;

        const {value} = this;

        if(utils$1.isTypedArray(value)) {
          yield value;
        } else {
          yield* readBlob(value);
        }

        yield CRLF_BYTES;
      }

      static escapeName(name) {
          return String(name).replace(/[\r\n"]/g, (match) => ({
            '\r' : '%0D',
            '\n' : '%0A',
            '"' : '%22',
          }[match]));
      }
    }

    const formDataToStream = (form, headersHandler, options) => {
      const {
        tag = 'form-data-boundary',
        size = 25,
        boundary = tag + '-' + platform.generateString(size, BOUNDARY_ALPHABET)
      } = options || {};

      if(!utils$1.isFormData(form)) {
        throw TypeError('FormData instance required');
      }

      if (boundary.length < 1 || boundary.length > 70) {
        throw Error('boundary must be 10-70 characters long')
      }

      const boundaryBytes = textEncoder.encode('--' + boundary + CRLF);
      const footerBytes = textEncoder.encode('--' + boundary + '--' + CRLF);
      let contentLength = footerBytes.byteLength;

      const parts = Array.from(form.entries()).map(([name, value]) => {
        const part = new FormDataPart(name, value);
        contentLength += part.size;
        return part;
      });

      contentLength += boundaryBytes.byteLength * parts.length;

      contentLength = utils$1.toFiniteNumber(contentLength);

      const computedHeaders = {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      };

      if (Number.isFinite(contentLength)) {
        computedHeaders['Content-Length'] = contentLength;
      }

      headersHandler && headersHandler(computedHeaders);

      return stream.Readable.from((async function *() {
        for(const part of parts) {
          yield boundaryBytes;
          yield* part.encode();
        }

        yield footerBytes;
      })());
    };

    class ZlibHeaderTransformStream extends stream.Transform {
      __transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }

      _transform(chunk, encoding, callback) {
        if (chunk.length !== 0) {
          this._transform = this.__transform;

          // Add Default Compression headers if no zlib headers are present
          if (chunk[0] !== 120) { // Hex: 78
            const header = Buffer.alloc(2);
            header[0] = 120; // Hex: 78
            header[1] = 156; // Hex: 9C 
            this.push(header, encoding);
          }
        }

        this.__transform(chunk, encoding, callback);
      }
    }

    const callbackify = (fn, reducer) => {
      return utils$1.isAsyncFn(fn) ? function (...args) {
        const cb = args.pop();
        fn.apply(this, args).then((value) => {
          try {
            reducer ? cb(null, ...reducer(value)) : cb(null, value);
          } catch (err) {
            cb(err);
          }
        }, cb);
      } : fn;
    };

    /**
     * Calculate data maxRate
     * @param {Number} [samplesCount= 10]
     * @param {Number} [min= 1000]
     * @returns {Function}
     */
    function speedometer(samplesCount, min) {
      samplesCount = samplesCount || 10;
      const bytes = new Array(samplesCount);
      const timestamps = new Array(samplesCount);
      let head = 0;
      let tail = 0;
      let firstSampleTS;

      min = min !== undefined ? min : 1000;

      return function push(chunkLength) {
        const now = Date.now();

        const startedAt = timestamps[tail];

        if (!firstSampleTS) {
          firstSampleTS = now;
        }

        bytes[head] = chunkLength;
        timestamps[head] = now;

        let i = tail;
        let bytesCount = 0;

        while (i !== head) {
          bytesCount += bytes[i++];
          i = i % samplesCount;
        }

        head = (head + 1) % samplesCount;

        if (head === tail) {
          tail = (tail + 1) % samplesCount;
        }

        if (now - firstSampleTS < min) {
          return;
        }

        const passed = startedAt && now - startedAt;

        return passed ? Math.round(bytesCount * 1000 / passed) : undefined;
      };
    }

    /**
     * Throttle decorator
     * @param {Function} fn
     * @param {Number} freq
     * @return {Function}
     */
    function throttle(fn, freq) {
      let timestamp = 0;
      let threshold = 1000 / freq;
      let lastArgs;
      let timer;

      const invoke = (args, now = Date.now()) => {
        timestamp = now;
        lastArgs = null;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        fn(...args);
      };

      const throttled = (...args) => {
        const now = Date.now();
        const passed = now - timestamp;
        if ( passed >= threshold) {
          invoke(args, now);
        } else {
          lastArgs = args;
          if (!timer) {
            timer = setTimeout(() => {
              timer = null;
              invoke(lastArgs);
            }, threshold - passed);
          }
        }
      };

      const flush = () => lastArgs && invoke(lastArgs);

      return [throttled, flush];
    }

    const progressEventReducer = (listener, isDownloadStream, freq = 3) => {
      let bytesNotified = 0;
      const _speedometer = speedometer(50, 250);

      return throttle(e => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : undefined;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;

        bytesNotified = loaded;

        const data = {
          loaded,
          total,
          progress: total ? (loaded / total) : undefined,
          bytes: progressBytes,
          rate: rate ? rate : undefined,
          estimated: rate && total && inRange ? (total - loaded) / rate : undefined,
          event: e,
          lengthComputable: total != null,
          [isDownloadStream ? 'download' : 'upload']: true
        };

        listener(data);
      }, freq);
    };

    const progressEventDecorator = (total, throttled) => {
      const lengthComputable = total != null;

      return [(loaded) => throttled[0]({
        lengthComputable,
        total,
        loaded
      }), throttled[1]];
    };

    const asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));

    const zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH
    };

    const brotliOptions = {
      flush: zlib.constants.BROTLI_OPERATION_FLUSH,
      finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
    };

    const isBrotliSupported = utils$1.isFunction(zlib.createBrotliDecompress);

    const {http: httpFollow, https: httpsFollow} = followRedirects;

    const isHttps = /https:?/;

    const supportedProtocols = platform.protocols.map(protocol => {
      return protocol + ':';
    });

    const flushOnFinish = (stream, [throttled, flush]) => {
      stream
        .on('end', flush)
        .on('error', flush);

      return throttled;
    };

    /**
     * If the proxy or config beforeRedirects functions are defined, call them with the options
     * object.
     *
     * @param {Object<string, any>} options - The options object that was passed to the request.
     *
     * @returns {Object<string, any>}
     */
    function dispatchBeforeRedirect(options, responseDetails) {
      if (options.beforeRedirects.proxy) {
        options.beforeRedirects.proxy(options);
      }
      if (options.beforeRedirects.config) {
        options.beforeRedirects.config(options, responseDetails);
      }
    }

    /**
     * If the proxy or config afterRedirects functions are defined, call them with the options
     *
     * @param {http.ClientRequestArgs} options
     * @param {AxiosProxyConfig} configProxy configuration from Axios options object
     * @param {string} location
     *
     * @returns {http.ClientRequestArgs}
     */
    function setProxy(options, configProxy, location) {
      let proxy = configProxy;
      if (!proxy && proxy !== false) {
        const proxyUrl = proxyFromEnv.getProxyForUrl(location);
        if (proxyUrl) {
          proxy = new URL(proxyUrl);
        }
      }
      if (proxy) {
        // Basic proxy authorization
        if (proxy.username) {
          proxy.auth = (proxy.username || '') + ':' + (proxy.password || '');
        }

        if (proxy.auth) {
          // Support proxy auth object form
          if (proxy.auth.username || proxy.auth.password) {
            proxy.auth = (proxy.auth.username || '') + ':' + (proxy.auth.password || '');
          }
          const base64 = Buffer
            .from(proxy.auth, 'utf8')
            .toString('base64');
          options.headers['Proxy-Authorization'] = 'Basic ' + base64;
        }

        options.headers.host = options.hostname + (options.port ? ':' + options.port : '');
        const proxyHost = proxy.hostname || proxy.host;
        options.hostname = proxyHost;
        // Replace 'host' since options is not a URL object
        options.host = proxyHost;
        options.port = proxy.port;
        options.path = location;
        if (proxy.protocol) {
          options.protocol = proxy.protocol.includes(':') ? proxy.protocol : `${proxy.protocol}:`;
        }
      }

      options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
        // Configure proxy for redirected request, passing the original config proxy to apply
        // the exact same logic as if the redirected request was performed by axios directly.
        setProxy(redirectOptions, configProxy, redirectOptions.href);
      };
    }

    const isHttpAdapterSupported = typeof process !== 'undefined' && utils$1.kindOf(process) === 'process';

    // temporary hotfix

    const wrapAsync = (asyncExecutor) => {
      return new Promise((resolve, reject) => {
        let onDone;
        let isDone;

        const done = (value, isRejected) => {
          if (isDone) return;
          isDone = true;
          onDone && onDone(value, isRejected);
        };

        const _resolve = (value) => {
          done(value);
          resolve(value);
        };

        const _reject = (reason) => {
          done(reason, true);
          reject(reason);
        };

        asyncExecutor(_resolve, _reject, (onDoneHandler) => (onDone = onDoneHandler)).catch(_reject);
      })
    };

    const resolveFamily = ({address, family}) => {
      if (!utils$1.isString(address)) {
        throw TypeError('address must be a string');
      }
      return ({
        address,
        family: family || (address.indexOf('.') < 0 ? 6 : 4)
      });
    };

    const buildAddressEntry = (address, family) => resolveFamily(utils$1.isObject(address) ? address : {address, family});

    /*eslint consistent-return:0*/
    var httpAdapter = isHttpAdapterSupported && function httpAdapter(config) {
      return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
        let {data, lookup, family} = config;
        const {responseType, responseEncoding} = config;
        const method = config.method.toUpperCase();
        let isDone;
        let rejected = false;
        let req;

        if (lookup) {
          const _lookup = callbackify(lookup, (value) => utils$1.isArray(value) ? value : [value]);
          // hotfix to support opt.all option which is required for node 20.x
          lookup = (hostname, opt, cb) => {
            _lookup(hostname, opt, (err, arg0, arg1) => {
              if (err) {
                return cb(err);
              }

              const addresses = utils$1.isArray(arg0) ? arg0.map(addr => buildAddressEntry(addr)) : [buildAddressEntry(arg0, arg1)];

              opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
            });
          };
        }

        // temporary internal emitter until the AxiosRequest class will be implemented
        const emitter = new events$1.EventEmitter();

        const onFinished = () => {
          if (config.cancelToken) {
            config.cancelToken.unsubscribe(abort);
          }

          if (config.signal) {
            config.signal.removeEventListener('abort', abort);
          }

          emitter.removeAllListeners();
        };

        onDone((value, isRejected) => {
          isDone = true;
          if (isRejected) {
            rejected = true;
            onFinished();
          }
        });

        function abort(reason) {
          emitter.emit('abort', !reason || reason.type ? new CanceledError$1(null, config, req) : reason);
        }

        emitter.once('abort', reject);

        if (config.cancelToken || config.signal) {
          config.cancelToken && config.cancelToken.subscribe(abort);
          if (config.signal) {
            config.signal.aborted ? abort() : config.signal.addEventListener('abort', abort);
          }
        }

        // Parse url
        const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
        const parsed = new URL(fullPath, platform.hasBrowserEnv ? platform.origin : undefined);
        const protocol = parsed.protocol || supportedProtocols[0];

        if (protocol === 'data:') {
          let convertedData;

          if (method !== 'GET') {
            return settle(resolve, reject, {
              status: 405,
              statusText: 'method not allowed',
              headers: {},
              config
            });
          }

          try {
            convertedData = fromDataURI(config.url, responseType === 'blob', {
              Blob: config.env && config.env.Blob
            });
          } catch (err) {
            throw AxiosError$1.from(err, AxiosError$1.ERR_BAD_REQUEST, config);
          }

          if (responseType === 'text') {
            convertedData = convertedData.toString(responseEncoding);

            if (!responseEncoding || responseEncoding === 'utf8') {
              convertedData = utils$1.stripBOM(convertedData);
            }
          } else if (responseType === 'stream') {
            convertedData = stream.Readable.from(convertedData);
          }

          return settle(resolve, reject, {
            data: convertedData,
            status: 200,
            statusText: 'OK',
            headers: new AxiosHeaders$1(),
            config
          });
        }

        if (supportedProtocols.indexOf(protocol) === -1) {
          return reject(new AxiosError$1(
            'Unsupported protocol ' + protocol,
            AxiosError$1.ERR_BAD_REQUEST,
            config
          ));
        }

        const headers = AxiosHeaders$1.from(config.headers).normalize();

        // Set User-Agent (required by some servers)
        // See https://github.com/axios/axios/issues/69
        // User-Agent is specified; handle case where no UA header is desired
        // Only set header if it hasn't been set in config
        headers.set('User-Agent', 'axios/' + VERSION$1, false);

        const {onUploadProgress, onDownloadProgress} = config;
        const maxRate = config.maxRate;
        let maxUploadRate = undefined;
        let maxDownloadRate = undefined;

        // support for spec compliant FormData objects
        if (utils$1.isSpecCompliantForm(data)) {
          const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);

          data = formDataToStream(data, (formHeaders) => {
            headers.set(formHeaders);
          }, {
            tag: `axios-${VERSION$1}-boundary`,
            boundary: userBoundary && userBoundary[1] || undefined
          });
          // support for https://www.npmjs.com/package/form-data api
        } else if (utils$1.isFormData(data) && utils$1.isFunction(data.getHeaders)) {
          headers.set(data.getHeaders());

          if (!headers.hasContentLength()) {
            try {
              const knownLength = await require$$1.promisify(data.getLength).call(data);
              Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
              /*eslint no-empty:0*/
            } catch (e) {
            }
          }
        } else if (utils$1.isBlob(data) || utils$1.isFile(data)) {
          data.size && headers.setContentType(data.type || 'application/octet-stream');
          headers.setContentLength(data.size || 0);
          data = stream.Readable.from(readBlob(data));
        } else if (data && !utils$1.isStream(data)) {
          if (Buffer.isBuffer(data)) ; else if (utils$1.isArrayBuffer(data)) {
            data = Buffer.from(new Uint8Array(data));
          } else if (utils$1.isString(data)) {
            data = Buffer.from(data, 'utf-8');
          } else {
            return reject(new AxiosError$1(
              'Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream',
              AxiosError$1.ERR_BAD_REQUEST,
              config
            ));
          }

          // Add Content-Length header if data exists
          headers.setContentLength(data.length, false);

          if (config.maxBodyLength > -1 && data.length > config.maxBodyLength) {
            return reject(new AxiosError$1(
              'Request body larger than maxBodyLength limit',
              AxiosError$1.ERR_BAD_REQUEST,
              config
            ));
          }
        }

        const contentLength = utils$1.toFiniteNumber(headers.getContentLength());

        if (utils$1.isArray(maxRate)) {
          maxUploadRate = maxRate[0];
          maxDownloadRate = maxRate[1];
        } else {
          maxUploadRate = maxDownloadRate = maxRate;
        }

        if (data && (onUploadProgress || maxUploadRate)) {
          if (!utils$1.isStream(data)) {
            data = stream.Readable.from(data, {objectMode: false});
          }

          data = stream.pipeline([data, new AxiosTransformStream({
            maxRate: utils$1.toFiniteNumber(maxUploadRate)
          })], utils$1.noop);

          onUploadProgress && data.on('progress', flushOnFinish(
            data,
            progressEventDecorator(
              contentLength,
              progressEventReducer(asyncDecorator(onUploadProgress), false, 3)
            )
          ));
        }

        // HTTP basic authentication
        let auth = undefined;
        if (config.auth) {
          const username = config.auth.username || '';
          const password = config.auth.password || '';
          auth = username + ':' + password;
        }

        if (!auth && parsed.username) {
          const urlUsername = parsed.username;
          const urlPassword = parsed.password;
          auth = urlUsername + ':' + urlPassword;
        }

        auth && headers.delete('authorization');

        let path;

        try {
          path = buildURL(
            parsed.pathname + parsed.search,
            config.params,
            config.paramsSerializer
          ).replace(/^\?/, '');
        } catch (err) {
          const customErr = new Error(err.message);
          customErr.config = config;
          customErr.url = config.url;
          customErr.exists = true;
          return reject(customErr);
        }

        headers.set(
          'Accept-Encoding',
          'gzip, compress, deflate' + (isBrotliSupported ? ', br' : ''), false
          );

        const options = {
          path,
          method: method,
          headers: headers.toJSON(),
          agents: { http: config.httpAgent, https: config.httpsAgent },
          auth,
          protocol,
          family,
          beforeRedirect: dispatchBeforeRedirect,
          beforeRedirects: {}
        };

        // cacheable-lookup integration hotfix
        !utils$1.isUndefined(lookup) && (options.lookup = lookup);

        if (config.socketPath) {
          options.socketPath = config.socketPath;
        } else {
          options.hostname = parsed.hostname.startsWith("[") ? parsed.hostname.slice(1, -1) : parsed.hostname;
          options.port = parsed.port;
          setProxy(options, config.proxy, protocol + '//' + parsed.hostname + (parsed.port ? ':' + parsed.port : '') + options.path);
        }

        let transport;
        const isHttpsRequest = isHttps.test(options.protocol);
        options.agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
        if (config.transport) {
          transport = config.transport;
        } else if (config.maxRedirects === 0) {
          transport = isHttpsRequest ? require$$4 : require$$3;
        } else {
          if (config.maxRedirects) {
            options.maxRedirects = config.maxRedirects;
          }
          if (config.beforeRedirect) {
            options.beforeRedirects.config = config.beforeRedirect;
          }
          transport = isHttpsRequest ? httpsFollow : httpFollow;
        }

        if (config.maxBodyLength > -1) {
          options.maxBodyLength = config.maxBodyLength;
        } else {
          // follow-redirects does not skip comparison, so it should always succeed for axios -1 unlimited
          options.maxBodyLength = Infinity;
        }

        if (config.insecureHTTPParser) {
          options.insecureHTTPParser = config.insecureHTTPParser;
        }

        // Create the request
        req = transport.request(options, function handleResponse(res) {
          if (req.destroyed) return;

          const streams = [res];

          const responseLength = +res.headers['content-length'];

          if (onDownloadProgress || maxDownloadRate) {
            const transformStream = new AxiosTransformStream({
              maxRate: utils$1.toFiniteNumber(maxDownloadRate)
            });

            onDownloadProgress && transformStream.on('progress', flushOnFinish(
              transformStream,
              progressEventDecorator(
                responseLength,
                progressEventReducer(asyncDecorator(onDownloadProgress), true, 3)
              )
            ));

            streams.push(transformStream);
          }

          // decompress the response body transparently if required
          let responseStream = res;

          // return the last request in case of redirects
          const lastRequest = res.req || req;

          // if decompress disabled we should not decompress
          if (config.decompress !== false && res.headers['content-encoding']) {
            // if no content, but headers still say that it is encoded,
            // remove the header not confuse downstream operations
            if (method === 'HEAD' || res.statusCode === 204) {
              delete res.headers['content-encoding'];
            }

            switch ((res.headers['content-encoding'] || '').toLowerCase()) {
            /*eslint default-case:0*/
            case 'gzip':
            case 'x-gzip':
            case 'compress':
            case 'x-compress':
              // add the unzipper to the body stream processing pipeline
              streams.push(zlib.createUnzip(zlibOptions));

              // remove the content-encoding in order to not confuse downstream operations
              delete res.headers['content-encoding'];
              break;
            case 'deflate':
              streams.push(new ZlibHeaderTransformStream());

              // add the unzipper to the body stream processing pipeline
              streams.push(zlib.createUnzip(zlibOptions));

              // remove the content-encoding in order to not confuse downstream operations
              delete res.headers['content-encoding'];
              break;
            case 'br':
              if (isBrotliSupported) {
                streams.push(zlib.createBrotliDecompress(brotliOptions));
                delete res.headers['content-encoding'];
              }
            }
          }

          responseStream = streams.length > 1 ? stream.pipeline(streams, utils$1.noop) : streams[0];

          const offListeners = stream.finished(responseStream, () => {
            offListeners();
            onFinished();
          });

          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new AxiosHeaders$1(res.headers),
            config,
            request: lastRequest
          };

          if (responseType === 'stream') {
            response.data = responseStream;
            settle(resolve, reject, response);
          } else {
            const responseBuffer = [];
            let totalResponseBytes = 0;

            responseStream.on('data', function handleStreamData(chunk) {
              responseBuffer.push(chunk);
              totalResponseBytes += chunk.length;

              // make sure the content length is not over the maxContentLength if specified
              if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
                // stream.destroy() emit aborted event before calling reject() on Node.js v16
                rejected = true;
                responseStream.destroy();
                reject(new AxiosError$1('maxContentLength size of ' + config.maxContentLength + ' exceeded',
                  AxiosError$1.ERR_BAD_RESPONSE, config, lastRequest));
              }
            });

            responseStream.on('aborted', function handlerStreamAborted() {
              if (rejected) {
                return;
              }

              const err = new AxiosError$1(
                'stream has been aborted',
                AxiosError$1.ERR_BAD_RESPONSE,
                config,
                lastRequest
              );
              responseStream.destroy(err);
              reject(err);
            });

            responseStream.on('error', function handleStreamError(err) {
              if (req.destroyed) return;
              reject(AxiosError$1.from(err, null, config, lastRequest));
            });

            responseStream.on('end', function handleStreamEnd() {
              try {
                let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
                if (responseType !== 'arraybuffer') {
                  responseData = responseData.toString(responseEncoding);
                  if (!responseEncoding || responseEncoding === 'utf8') {
                    responseData = utils$1.stripBOM(responseData);
                  }
                }
                response.data = responseData;
              } catch (err) {
                return reject(AxiosError$1.from(err, null, config, response.request, response));
              }
              settle(resolve, reject, response);
            });
          }

          emitter.once('abort', err => {
            if (!responseStream.destroyed) {
              responseStream.emit('error', err);
              responseStream.destroy();
            }
          });
        });

        emitter.once('abort', err => {
          reject(err);
          req.destroy(err);
        });

        // Handle errors
        req.on('error', function handleRequestError(err) {
          // @todo remove
          // if (req.aborted && err.code !== AxiosError.ERR_FR_TOO_MANY_REDIRECTS) return;
          reject(AxiosError$1.from(err, null, config, req));
        });

        // set tcp keep alive to prevent drop connection by peer
        req.on('socket', function handleRequestSocket(socket) {
          // default interval of sending ack packet is 1 minute
          socket.setKeepAlive(true, 1000 * 60);
        });

        // Handle request timeout
        if (config.timeout) {
          // This is forcing a int timeout to avoid problems if the `req` interface doesn't handle other types.
          const timeout = parseInt(config.timeout, 10);

          if (Number.isNaN(timeout)) {
            reject(new AxiosError$1(
              'error trying to parse `config.timeout` to int',
              AxiosError$1.ERR_BAD_OPTION_VALUE,
              config,
              req
            ));

            return;
          }

          // Sometime, the response will be very slow, and does not respond, the connect event will be block by event loop system.
          // And timer callback will be fired, and abort() will be invoked before connection, then get "socket hang up" and code ECONNRESET.
          // At this time, if we have a large number of request, nodejs will hang up some socket on background. and the number will up and up.
          // And then these socket which be hang up will devouring CPU little by little.
          // ClientRequest.setTimeout will be fired on the specify milliseconds, and can make sure that abort() will be fired after connect.
          req.setTimeout(timeout, function handleRequestTimeout() {
            if (isDone) return;
            let timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
            const transitional = config.transitional || transitionalDefaults;
            if (config.timeoutErrorMessage) {
              timeoutErrorMessage = config.timeoutErrorMessage;
            }
            reject(new AxiosError$1(
              timeoutErrorMessage,
              transitional.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
              config,
              req
            ));
            abort();
          });
        }


        // Send the request
        if (utils$1.isStream(data)) {
          let ended = false;
          let errored = false;

          data.on('end', () => {
            ended = true;
          });

          data.once('error', err => {
            errored = true;
            req.destroy(err);
          });

          data.on('close', () => {
            if (!ended && !errored) {
              abort(new CanceledError$1('Request stream has been aborted', config, req));
            }
          });

          data.pipe(req);
        } else {
          req.end(data);
        }
      });
    };

    var isURLSameOrigin = platform.hasStandardBrowserEnv ? ((origin, isMSIE) => (url) => {
      url = new URL(url, platform.origin);

      return (
        origin.protocol === url.protocol &&
        origin.host === url.host &&
        (isMSIE || origin.port === url.port)
      );
    })(
      new URL(platform.origin),
      platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)
    ) : () => true;

    var cookies = platform.hasStandardBrowserEnv ?

      // Standard browser envs support document.cookie
      {
        write(name, value, expires, path, domain, secure) {
          const cookie = [name + '=' + encodeURIComponent(value)];

          utils$1.isNumber(expires) && cookie.push('expires=' + new Date(expires).toGMTString());

          utils$1.isString(path) && cookie.push('path=' + path);

          utils$1.isString(domain) && cookie.push('domain=' + domain);

          secure === true && cookie.push('secure');

          document.cookie = cookie.join('; ');
        },

        read(name) {
          const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      }

      :

      // Non-standard browser env (web workers, react-native) lack needed support.
      {
        write() {},
        read() {
          return null;
        },
        remove() {}
      };

    const headersToObject = (thing) => thing instanceof AxiosHeaders$1 ? { ...thing } : thing;

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     *
     * @returns {Object} New object resulting from merging config2 to config1
     */
    function mergeConfig$1(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      const config = {};

      function getMergedValue(target, source, prop, caseless) {
        if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
          return utils$1.merge.call({caseless}, target, source);
        } else if (utils$1.isPlainObject(source)) {
          return utils$1.merge({}, source);
        } else if (utils$1.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      // eslint-disable-next-line consistent-return
      function mergeDeepProperties(a, b, prop , caseless) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(a, b, prop , caseless);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a, prop , caseless);
        }
      }

      // eslint-disable-next-line consistent-return
      function valueFromConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        }
      }

      // eslint-disable-next-line consistent-return
      function defaultToConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(undefined, b);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(undefined, a);
        }
      }

      // eslint-disable-next-line consistent-return
      function mergeDirectKeys(a, b, prop) {
        if (prop in config2) {
          return getMergedValue(a, b);
        } else if (prop in config1) {
          return getMergedValue(undefined, a);
        }
      }

      const mergeMap = {
        url: valueFromConfig2,
        method: valueFromConfig2,
        data: valueFromConfig2,
        baseURL: defaultToConfig2,
        transformRequest: defaultToConfig2,
        transformResponse: defaultToConfig2,
        paramsSerializer: defaultToConfig2,
        timeout: defaultToConfig2,
        timeoutMessage: defaultToConfig2,
        withCredentials: defaultToConfig2,
        withXSRFToken: defaultToConfig2,
        adapter: defaultToConfig2,
        responseType: defaultToConfig2,
        xsrfCookieName: defaultToConfig2,
        xsrfHeaderName: defaultToConfig2,
        onUploadProgress: defaultToConfig2,
        onDownloadProgress: defaultToConfig2,
        decompress: defaultToConfig2,
        maxContentLength: defaultToConfig2,
        maxBodyLength: defaultToConfig2,
        beforeRedirect: defaultToConfig2,
        transport: defaultToConfig2,
        httpAgent: defaultToConfig2,
        httpsAgent: defaultToConfig2,
        cancelToken: defaultToConfig2,
        socketPath: defaultToConfig2,
        responseEncoding: defaultToConfig2,
        validateStatus: mergeDirectKeys,
        headers: (a, b , prop) => mergeDeepProperties(headersToObject(a), headersToObject(b),prop, true)
      };

      utils$1.forEach(Object.keys({...config1, ...config2}), function computeConfigValue(prop) {
        const merge = mergeMap[prop] || mergeDeepProperties;
        const configValue = merge(config1[prop], config2[prop], prop);
        (utils$1.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
      });

      return config;
    }

    var resolveConfig = (config) => {
      const newConfig = mergeConfig$1({}, config);

      let {data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth} = newConfig;

      newConfig.headers = headers = AxiosHeaders$1.from(headers);

      newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);

      // HTTP basic authentication
      if (auth) {
        headers.set('Authorization', 'Basic ' +
          btoa((auth.username || '') + ':' + (auth.password ? unescape(encodeURIComponent(auth.password)) : ''))
        );
      }

      let contentType;

      if (utils$1.isFormData(data)) {
        if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
          headers.setContentType(undefined); // Let the browser set it
        } else if ((contentType = headers.getContentType()) !== false) {
          // fix semicolon duplication issue for ReactNative FormData implementation
          const [type, ...tokens] = contentType ? contentType.split(';').map(token => token.trim()).filter(Boolean) : [];
          headers.setContentType([type || 'multipart/form-data', ...tokens].join('; '));
        }
      }

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.

      if (platform.hasStandardBrowserEnv) {
        withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));

        if (withXSRFToken || (withXSRFToken !== false && isURLSameOrigin(newConfig.url))) {
          // Add xsrf header
          const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);

          if (xsrfValue) {
            headers.set(xsrfHeaderName, xsrfValue);
          }
        }
      }

      return newConfig;
    };

    const isXHRAdapterSupported = typeof XMLHttpRequest !== 'undefined';

    var xhrAdapter = isXHRAdapterSupported && function (config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        const _config = resolveConfig(config);
        let requestData = _config.data;
        const requestHeaders = AxiosHeaders$1.from(_config.headers).normalize();
        let {responseType, onUploadProgress, onDownloadProgress} = _config;
        let onCanceled;
        let uploadThrottled, downloadThrottled;
        let flushUpload, flushDownload;

        function done() {
          flushUpload && flushUpload(); // flush events
          flushDownload && flushDownload(); // flush events

          _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);

          _config.signal && _config.signal.removeEventListener('abort', onCanceled);
        }

        let request = new XMLHttpRequest();

        request.open(_config.method.toUpperCase(), _config.url, true);

        // Set the request timeout in MS
        request.timeout = _config.timeout;

        function onloadend() {
          if (!request) {
            return;
          }
          // Prepare the response
          const responseHeaders = AxiosHeaders$1.from(
            'getAllResponseHeaders' in request && request.getAllResponseHeaders()
          );
          const responseData = !responseType || responseType === 'text' || responseType === 'json' ?
            request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };

          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);

          // Clean up request
          request = null;
        }

        if ('onloadend' in request) {
          // Use onloadend if available
          request.onloadend = onloadend;
        } else {
          // Listen for ready state to emulate onloadend
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }

            // The request errored out and we didn't get a response, this will be
            // handled by onerror instead
            // With one exception: request that using file: protocol, most browsers
            // will return status as 0 even though it's a successful request
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
              return;
            }
            // readystate handler is calling before onerror or ontimeout handlers,
            // so we should call onloadend on the next 'tick'
            setTimeout(onloadend);
          };
        }

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(new AxiosError$1('Request aborted', AxiosError$1.ECONNABORTED, config, request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(new AxiosError$1('Network Error', AxiosError$1.ERR_NETWORK, config, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = _config.timeout ? 'timeout of ' + _config.timeout + 'ms exceeded' : 'timeout exceeded';
          const transitional = _config.transitional || transitionalDefaults;
          if (_config.timeoutErrorMessage) {
            timeoutErrorMessage = _config.timeoutErrorMessage;
          }
          reject(new AxiosError$1(
            timeoutErrorMessage,
            transitional.clarifyTimeoutError ? AxiosError$1.ETIMEDOUT : AxiosError$1.ECONNABORTED,
            config,
            request));

          // Clean up request
          request = null;
        };

        // Remove Content-Type if data is undefined
        requestData === undefined && requestHeaders.setContentType(null);

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }

        // Add withCredentials to request if needed
        if (!utils$1.isUndefined(_config.withCredentials)) {
          request.withCredentials = !!_config.withCredentials;
        }

        // Add responseType to request if needed
        if (responseType && responseType !== 'json') {
          request.responseType = _config.responseType;
        }

        // Handle progress if needed
        if (onDownloadProgress) {
          ([downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true));
          request.addEventListener('progress', downloadThrottled);
        }

        // Not all browsers support upload events
        if (onUploadProgress && request.upload) {
          ([uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress));

          request.upload.addEventListener('progress', uploadThrottled);

          request.upload.addEventListener('loadend', flushUpload);
        }

        if (_config.cancelToken || _config.signal) {
          // Handle cancellation
          // eslint-disable-next-line func-names
          onCanceled = cancel => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError$1(null, config, request) : cancel);
            request.abort();
            request = null;
          };

          _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
          if (_config.signal) {
            _config.signal.aborted ? onCanceled() : _config.signal.addEventListener('abort', onCanceled);
          }
        }

        const protocol = parseProtocol(_config.url);

        if (protocol && platform.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError$1('Unsupported protocol ' + protocol + ':', AxiosError$1.ERR_BAD_REQUEST, config));
          return;
        }


        // Send the request
        request.send(requestData || null);
      });
    };

    const composeSignals = (signals, timeout) => {
      const {length} = (signals = signals ? signals.filter(Boolean) : []);

      if (timeout || length) {
        let controller = new AbortController();

        let aborted;

        const onabort = function (reason) {
          if (!aborted) {
            aborted = true;
            unsubscribe();
            const err = reason instanceof Error ? reason : this.reason;
            controller.abort(err instanceof AxiosError$1 ? err : new CanceledError$1(err instanceof Error ? err.message : err));
          }
        };

        let timer = timeout && setTimeout(() => {
          timer = null;
          onabort(new AxiosError$1(`timeout ${timeout} of ms exceeded`, AxiosError$1.ETIMEDOUT));
        }, timeout);

        const unsubscribe = () => {
          if (signals) {
            timer && clearTimeout(timer);
            timer = null;
            signals.forEach(signal => {
              signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
            });
            signals = null;
          }
        };

        signals.forEach((signal) => signal.addEventListener('abort', onabort));

        const {signal} = controller;

        signal.unsubscribe = () => utils$1.asap(unsubscribe);

        return signal;
      }
    };

    const streamChunk = function* (chunk, chunkSize) {
      let len = chunk.byteLength;

      if (len < chunkSize) {
        yield chunk;
        return;
      }

      let pos = 0;
      let end;

      while (pos < len) {
        end = pos + chunkSize;
        yield chunk.slice(pos, end);
        pos = end;
      }
    };

    const readBytes = async function* (iterable, chunkSize) {
      for await (const chunk of readStream(iterable)) {
        yield* streamChunk(chunk, chunkSize);
      }
    };

    const readStream = async function* (stream) {
      if (stream[Symbol.asyncIterator]) {
        yield* stream;
        return;
      }

      const reader = stream.getReader();
      try {
        for (;;) {
          const {done, value} = await reader.read();
          if (done) {
            break;
          }
          yield value;
        }
      } finally {
        await reader.cancel();
      }
    };

    const trackStream = (stream, chunkSize, onProgress, onFinish) => {
      const iterator = readBytes(stream, chunkSize);

      let bytes = 0;
      let done;
      let _onFinish = (e) => {
        if (!done) {
          done = true;
          onFinish && onFinish(e);
        }
      };

      return new ReadableStream({
        async pull(controller) {
          try {
            const {done, value} = await iterator.next();

            if (done) {
             _onFinish();
              controller.close();
              return;
            }

            let len = value.byteLength;
            if (onProgress) {
              let loadedBytes = bytes += len;
              onProgress(loadedBytes);
            }
            controller.enqueue(new Uint8Array(value));
          } catch (err) {
            _onFinish(err);
            throw err;
          }
        },
        cancel(reason) {
          _onFinish(reason);
          return iterator.return();
        }
      }, {
        highWaterMark: 2
      })
    };

    const isFetchSupported = typeof fetch === 'function' && typeof Request === 'function' && typeof Response === 'function';
    const isReadableStreamSupported = isFetchSupported && typeof ReadableStream === 'function';

    // used only inside the fetch adapter
    const encodeText = isFetchSupported && (typeof TextEncoder === 'function' ?
        ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) :
        async (str) => new Uint8Array(await new Response(str).arrayBuffer())
    );

    const test = (fn, ...args) => {
      try {
        return !!fn(...args);
      } catch (e) {
        return false
      }
    };

    const supportsRequestStream = isReadableStreamSupported && test(() => {
      let duplexAccessed = false;

      const hasContentType = new Request(platform.origin, {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
          duplexAccessed = true;
          return 'half';
        },
      }).headers.has('Content-Type');

      return duplexAccessed && !hasContentType;
    });

    const DEFAULT_CHUNK_SIZE = 64 * 1024;

    const supportsResponseStream = isReadableStreamSupported &&
      test(() => utils$1.isReadableStream(new Response('').body));


    const resolvers = {
      stream: supportsResponseStream && ((res) => res.body)
    };

    isFetchSupported && (((res) => {
      ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach(type => {
        !resolvers[type] && (resolvers[type] = utils$1.isFunction(res[type]) ? (res) => res[type]() :
          (_, config) => {
            throw new AxiosError$1(`Response type '${type}' is not supported`, AxiosError$1.ERR_NOT_SUPPORT, config);
          });
      });
    })(new Response));

    const getBodyLength = async (body) => {
      if (body == null) {
        return 0;
      }

      if(utils$1.isBlob(body)) {
        return body.size;
      }

      if(utils$1.isSpecCompliantForm(body)) {
        const _request = new Request(platform.origin, {
          method: 'POST',
          body,
        });
        return (await _request.arrayBuffer()).byteLength;
      }

      if(utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
        return body.byteLength;
      }

      if(utils$1.isURLSearchParams(body)) {
        body = body + '';
      }

      if(utils$1.isString(body)) {
        return (await encodeText(body)).byteLength;
      }
    };

    const resolveBodyLength = async (headers, body) => {
      const length = utils$1.toFiniteNumber(headers.getContentLength());

      return length == null ? getBodyLength(body) : length;
    };

    var fetchAdapter = isFetchSupported && (async (config) => {
      let {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        onDownloadProgress,
        onUploadProgress,
        responseType,
        headers,
        withCredentials = 'same-origin',
        fetchOptions
      } = resolveConfig(config);

      responseType = responseType ? (responseType + '').toLowerCase() : 'text';

      let composedSignal = composeSignals([signal, cancelToken && cancelToken.toAbortSignal()], timeout);

      let request;

      const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
          composedSignal.unsubscribe();
      });

      let requestContentLength;

      try {
        if (
          onUploadProgress && supportsRequestStream && method !== 'get' && method !== 'head' &&
          (requestContentLength = await resolveBodyLength(headers, data)) !== 0
        ) {
          let _request = new Request(url, {
            method: 'POST',
            body: data,
            duplex: "half"
          });

          let contentTypeHeader;

          if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get('content-type'))) {
            headers.setContentType(contentTypeHeader);
          }

          if (_request.body) {
            const [onProgress, flush] = progressEventDecorator(
              requestContentLength,
              progressEventReducer(asyncDecorator(onUploadProgress))
            );

            data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
          }
        }

        if (!utils$1.isString(withCredentials)) {
          withCredentials = withCredentials ? 'include' : 'omit';
        }

        // Cloudflare Workers throws when credentials are defined
        // see https://github.com/cloudflare/workerd/issues/902
        const isCredentialsSupported = "credentials" in Request.prototype;
        request = new Request(url, {
          ...fetchOptions,
          signal: composedSignal,
          method: method.toUpperCase(),
          headers: headers.normalize().toJSON(),
          body: data,
          duplex: "half",
          credentials: isCredentialsSupported ? withCredentials : undefined
        });

        let response = await fetch(request, fetchOptions);

        const isStreamResponse = supportsResponseStream && (responseType === 'stream' || responseType === 'response');

        if (supportsResponseStream && (onDownloadProgress || (isStreamResponse && unsubscribe))) {
          const options = {};

          ['status', 'statusText', 'headers'].forEach(prop => {
            options[prop] = response[prop];
          });

          const responseContentLength = utils$1.toFiniteNumber(response.headers.get('content-length'));

          const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
            responseContentLength,
            progressEventReducer(asyncDecorator(onDownloadProgress), true)
          ) || [];

          response = new Response(
            trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
              flush && flush();
              unsubscribe && unsubscribe();
            }),
            options
          );
        }

        responseType = responseType || 'text';

        let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || 'text'](response, config);

        !isStreamResponse && unsubscribe && unsubscribe();

        return await new Promise((resolve, reject) => {
          settle(resolve, reject, {
            data: responseData,
            headers: AxiosHeaders$1.from(response.headers),
            status: response.status,
            statusText: response.statusText,
            config,
            request
          });
        })
      } catch (err) {
        unsubscribe && unsubscribe();

        if (err && err.name === 'TypeError' && /Load failed|fetch/i.test(err.message)) {
          throw Object.assign(
            new AxiosError$1('Network Error', AxiosError$1.ERR_NETWORK, config, request),
            {
              cause: err.cause || err
            }
          )
        }

        throw AxiosError$1.from(err, err && err.code, config, request);
      }
    });

    const knownAdapters = {
      http: httpAdapter,
      xhr: xhrAdapter,
      fetch: fetchAdapter
    };

    utils$1.forEach(knownAdapters, (fn, value) => {
      if (fn) {
        try {
          Object.defineProperty(fn, 'name', {value});
        } catch (e) {
          // eslint-disable-next-line no-empty
        }
        Object.defineProperty(fn, 'adapterName', {value});
      }
    });

    const renderReason = (reason) => `- ${reason}`;

    const isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;

    var adapters = {
      getAdapter: (adapters) => {
        adapters = utils$1.isArray(adapters) ? adapters : [adapters];

        const {length} = adapters;
        let nameOrAdapter;
        let adapter;

        const rejectedReasons = {};

        for (let i = 0; i < length; i++) {
          nameOrAdapter = adapters[i];
          let id;

          adapter = nameOrAdapter;

          if (!isResolvedHandle(nameOrAdapter)) {
            adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];

            if (adapter === undefined) {
              throw new AxiosError$1(`Unknown adapter '${id}'`);
            }
          }

          if (adapter) {
            break;
          }

          rejectedReasons[id || '#' + i] = adapter;
        }

        if (!adapter) {

          const reasons = Object.entries(rejectedReasons)
            .map(([id, state]) => `adapter ${id} ` +
              (state === false ? 'is not supported by the environment' : 'is not available in the build')
            );

          let s = length ?
            (reasons.length > 1 ? 'since :\n' + reasons.map(renderReason).join('\n') : ' ' + renderReason(reasons[0])) :
            'as no adapter specified';

          throw new AxiosError$1(
            `There is no suitable adapter to dispatch the request ` + s,
            'ERR_NOT_SUPPORT'
          );
        }

        return adapter;
      },
      adapters: knownAdapters
    };

    /**
     * Throws a `CanceledError` if cancellation has been requested.
     *
     * @param {Object} config The config that is to be used for the request
     *
     * @returns {void}
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }

      if (config.signal && config.signal.aborted) {
        throw new CanceledError$1(null, config);
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     *
     * @returns {Promise} The Promise to be fulfilled
     */
    function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      config.headers = AxiosHeaders$1.from(config.headers);

      // Transform request data
      config.data = transformData.call(
        config,
        config.transformRequest
      );

      if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
        config.headers.setContentType('application/x-www-form-urlencoded', false);
      }

      const adapter = adapters.getAdapter(config.adapter || defaults.adapter);

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData.call(
          config,
          config.transformResponse,
          response
        );

        response.headers = AxiosHeaders$1.from(response.headers);

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel$1(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData.call(
              config,
              config.transformResponse,
              reason.response
            );
            reason.response.headers = AxiosHeaders$1.from(reason.response.headers);
          }
        }

        return Promise.reject(reason);
      });
    }

    const validators$1 = {};

    // eslint-disable-next-line func-names
    ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((type, i) => {
      validators$1[type] = function validator(thing) {
        return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
      };
    });

    const deprecatedWarnings = {};

    /**
     * Transitional option validator
     *
     * @param {function|boolean?} validator - set to false if the transitional option has been removed
     * @param {string?} version - deprecated version / removed since version
     * @param {string?} message - some message with additional info
     *
     * @returns {function}
     */
    validators$1.transitional = function transitional(validator, version, message) {
      function formatMessage(opt, desc) {
        return '[Axios v' + VERSION$1 + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
      }

      // eslint-disable-next-line func-names
      return (value, opt, opts) => {
        if (validator === false) {
          throw new AxiosError$1(
            formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')),
            AxiosError$1.ERR_DEPRECATED
          );
        }

        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          // eslint-disable-next-line no-console
          console.warn(
            formatMessage(
              opt,
              ' has been deprecated since v' + version + ' and will be removed in the near future'
            )
          );
        }

        return validator ? validator(value, opt, opts) : true;
      };
    };

    validators$1.spelling = function spelling(correctSpelling) {
      return (value, opt) => {
        // eslint-disable-next-line no-console
        console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
        return true;
      }
    };

    /**
     * Assert object's properties type
     *
     * @param {object} options
     * @param {object} schema
     * @param {boolean?} allowUnknown
     *
     * @returns {object}
     */

    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== 'object') {
        throw new AxiosError$1('options must be an object', AxiosError$1.ERR_BAD_OPTION_VALUE);
      }
      const keys = Object.keys(options);
      let i = keys.length;
      while (i-- > 0) {
        const opt = keys[i];
        const validator = schema[opt];
        if (validator) {
          const value = options[opt];
          const result = value === undefined || validator(value, opt, options);
          if (result !== true) {
            throw new AxiosError$1('option ' + opt + ' must be ' + result, AxiosError$1.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError$1('Unknown option ' + opt, AxiosError$1.ERR_BAD_OPTION);
        }
      }
    }

    var validator = {
      assertOptions,
      validators: validators$1
    };

    const validators = validator.validators;

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     *
     * @return {Axios} A new instance of Axios
     */
    let Axios$1 = class Axios {
      constructor(instanceConfig) {
        this.defaults = instanceConfig || {};
        this.interceptors = {
          request: new InterceptorManager(),
          response: new InterceptorManager()
        };
      }

      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      async request(configOrUrl, config) {
        try {
          return await this._request(configOrUrl, config);
        } catch (err) {
          if (err instanceof Error) {
            let dummy = {};

            Error.captureStackTrace ? Error.captureStackTrace(dummy) : (dummy = new Error());

            // slice off the Error: ... line
            const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, '') : '';
            try {
              if (!err.stack) {
                err.stack = stack;
                // match without the 2 top stack lines
              } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ''))) {
                err.stack += '\n' + stack;
              }
            } catch (e) {
              // ignore the case where "stack" is an un-writable property
            }
          }

          throw err;
        }
      }

      _request(configOrUrl, config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof configOrUrl === 'string') {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }

        config = mergeConfig$1(this.defaults, config);

        const {transitional, paramsSerializer, headers} = config;

        if (transitional !== undefined) {
          validator.assertOptions(transitional, {
            silentJSONParsing: validators.transitional(validators.boolean),
            forcedJSONParsing: validators.transitional(validators.boolean),
            clarifyTimeoutError: validators.transitional(validators.boolean)
          }, false);
        }

        if (paramsSerializer != null) {
          if (utils$1.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator.assertOptions(paramsSerializer, {
              encode: validators.function,
              serialize: validators.function
            }, true);
          }
        }

        // Set config.allowAbsoluteUrls
        if (config.allowAbsoluteUrls !== undefined) ; else if (this.defaults.allowAbsoluteUrls !== undefined) {
          config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
        } else {
          config.allowAbsoluteUrls = true;
        }

        validator.assertOptions(config, {
          baseUrl: validators.spelling('baseURL'),
          withXsrfToken: validators.spelling('withXSRFToken')
        }, true);

        // Set config.method
        config.method = (config.method || this.defaults.method || 'get').toLowerCase();

        // Flatten headers
        let contextHeaders = headers && utils$1.merge(
          headers.common,
          headers[config.method]
        );

        headers && utils$1.forEach(
          ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
          (method) => {
            delete headers[method];
          }
        );

        config.headers = AxiosHeaders$1.concat(contextHeaders, headers);

        // filter out skipped interceptors
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
            return;
          }

          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

          requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });

        let promise;
        let i = 0;
        let len;

        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), undefined];
          chain.unshift(...requestInterceptorChain);
          chain.push(...responseInterceptorChain);
          len = chain.length;

          promise = Promise.resolve(config);

          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }

          return promise;
        }

        len = requestInterceptorChain.length;

        let newConfig = config;

        i = 0;

        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }

        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }

        i = 0;
        len = responseInterceptorChain.length;

        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }

        return promise;
      }

      getUri(config) {
        config = mergeConfig$1(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    };

    // Provide aliases for supported request methods
    utils$1.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios$1.prototype[method] = function(url, config) {
        return this.request(mergeConfig$1(config || {}, {
          method,
          url,
          data: (config || {}).data
        }));
      };
    });

    utils$1.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/

      function generateHTTPMethod(isForm) {
        return function httpMethod(url, data, config) {
          return this.request(mergeConfig$1(config || {}, {
            method,
            headers: isForm ? {
              'Content-Type': 'multipart/form-data'
            } : {},
            url,
            data
          }));
        };
      }

      Axios$1.prototype[method] = generateHTTPMethod();

      Axios$1.prototype[method + 'Form'] = generateHTTPMethod(true);
    });

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @param {Function} executor The executor function.
     *
     * @returns {CancelToken}
     */
    let CancelToken$1 = class CancelToken {
      constructor(executor) {
        if (typeof executor !== 'function') {
          throw new TypeError('executor must be a function.');
        }

        let resolvePromise;

        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        const token = this;

        // eslint-disable-next-line func-names
        this.promise.then(cancel => {
          if (!token._listeners) return;

          let i = token._listeners.length;

          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });

        // eslint-disable-next-line func-names
        this.promise.then = onfulfilled => {
          let _resolve;
          // eslint-disable-next-line func-names
          const promise = new Promise(resolve => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);

          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };

          return promise;
        };

        executor(function cancel(message, config, request) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new CanceledError$1(message, config, request);
          resolvePromise(token.reason);
        });
      }

      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }

      /**
       * Subscribe to the cancel signal
       */

      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }

        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }

      /**
       * Unsubscribe from the cancel signal
       */

      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }

      toAbortSignal() {
        const controller = new AbortController();

        const abort = (err) => {
          controller.abort(err);
        };

        this.subscribe(abort);

        controller.signal.unsubscribe = () => this.unsubscribe(abort);

        return controller.signal;
      }

      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    };

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     *
     * @returns {Function}
     */
    function spread$1(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    }

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     *
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    function isAxiosError$1(payload) {
      return utils$1.isObject(payload) && (payload.isAxiosError === true);
    }

    const HttpStatusCode$1 = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511,
    };

    Object.entries(HttpStatusCode$1).forEach(([key, value]) => {
      HttpStatusCode$1[value] = key;
    });

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     *
     * @returns {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      const context = new Axios$1(defaultConfig);
      const instance = bind$2(Axios$1.prototype.request, context);

      // Copy axios.prototype to instance
      utils$1.extend(instance, Axios$1.prototype, context, {allOwnKeys: true});

      // Copy context to instance
      utils$1.extend(instance, context, null, {allOwnKeys: true});

      // Factory for creating new instances
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig$1(defaultConfig, instanceConfig));
      };

      return instance;
    }

    // Create the default instance to be exported
    const axios = createInstance(defaults);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios$1;

    // Expose Cancel & CancelToken
    axios.CanceledError = CanceledError$1;
    axios.CancelToken = CancelToken$1;
    axios.isCancel = isCancel$1;
    axios.VERSION = VERSION$1;
    axios.toFormData = toFormData$1;

    // Expose AxiosError class
    axios.AxiosError = AxiosError$1;

    // alias for CanceledError for backward compatibility
    axios.Cancel = axios.CanceledError;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };

    axios.spread = spread$1;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError$1;

    // Expose mergeConfig
    axios.mergeConfig = mergeConfig$1;

    axios.AxiosHeaders = AxiosHeaders$1;

    axios.formToJSON = thing => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);

    axios.getAdapter = adapters.getAdapter;

    axios.HttpStatusCode = HttpStatusCode$1;

    axios.default = axios;

    // This module is intended to unwrap Axios default export as named.
    // Keep top-level export same with static properties
    // so that it can keep same with es module or cjs
    const {
      Axios,
      AxiosError,
      CanceledError,
      isCancel,
      CancelToken,
      VERSION,
      all,
      Cancel,
      isAxiosError,
      spread,
      toFormData,
      AxiosHeaders,
      HttpStatusCode,
      formToJSON,
      getAdapter,
      mergeConfig
    } = axios;

    /**
     * Axios适配器
     * 基于Axios库实现HTTP请求
     */
    class AxiosAdapter {
        constructor(axiosConfig) {
            Object.defineProperty(this, "axiosInstance", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "cancelTokenSources", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            this.axiosInstance = axios.create(axiosConfig);
        }
        /**
         * 发送请求
         */
        async request(config) {
            try {
                const axiosConfig = this.transformRequestConfig(config);
                const response = await this.axiosInstance.request(axiosConfig);
                return this.transformResponse(response, config);
            }
            catch (error) {
                throw this.transformError(error, config);
            }
        }
        /**
         * 取消请求
         */
        cancel(requestId) {
            if (requestId) {
                const source = this.cancelTokenSources.get(requestId);
                if (source) {
                    source.cancel('Request cancelled');
                    this.cancelTokenSources.delete(requestId);
                }
            }
            else {
                // 取消所有请求
                this.cancelTokenSources.forEach(source => source.cancel('Request cancelled'));
                this.cancelTokenSources.clear();
            }
        }
        /**
         * 获取适配器名称
         */
        getName() {
            return 'axios';
        }
        /**
         * 获取Axios实例
         */
        getAxiosInstance() {
            return this.axiosInstance;
        }
        /**
         * 转换请求配置
         */
        transformRequestConfig(config) {
            const axiosConfig = {
                url: config.url,
                method: (config.method || HttpMethod.GET).toLowerCase(),
                headers: config.headers,
                params: config.params,
                data: config.data,
                timeout: config.timeout,
                baseURL: config.baseURL,
                responseType: this.transformResponseType(config.responseType),
                withCredentials: config.withCredentials,
            };
            // 创建取消令牌
            const requestId = this.generateRequestId();
            const cancelTokenSource = axios.CancelToken.source();
            this.cancelTokenSources.set(requestId, cancelTokenSource);
            axiosConfig.cancelToken = cancelTokenSource.token;
            // 处理上传进度
            if (config.onUploadProgress) {
                axiosConfig.onUploadProgress = (progressEvent) => {
                    const progress = {
                        loaded: progressEvent.loaded,
                        total: progressEvent.total || 0,
                        percentage: progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
                    };
                    config.onUploadProgress(progress);
                };
            }
            // 处理下载进度
            if (config.onDownloadProgress) {
                axiosConfig.onDownloadProgress = (progressEvent) => {
                    const progress = {
                        loaded: progressEvent.loaded,
                        total: progressEvent.total || 0,
                        percentage: progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0,
                    };
                    config.onDownloadProgress(progress);
                };
            }
            // 复制其他自定义配置
            Object.keys(config).forEach((key) => {
                if (!axiosConfig.hasOwnProperty(key)
                    && key !== 'onUploadProgress'
                    && key !== 'onDownloadProgress') {
                    axiosConfig[key] = config[key];
                }
            });
            return axiosConfig;
        }
        /**
         * 转换响应类型
         */
        transformResponseType(responseType) {
            switch (responseType) {
                case 'json':
                    return 'json';
                case 'text':
                    return 'text';
                case 'blob':
                    return 'blob';
                case 'arrayBuffer':
                    return 'arraybuffer';
                case 'stream':
                    return 'stream';
                default:
                    return 'json';
            }
        }
        /**
         * 转换响应
         */
        transformResponse(response, config) {
            return {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: this.transformResponseHeaders(response.headers),
                config,
                raw: response,
            };
        }
        /**
         * 转换响应头
         */
        transformResponseHeaders(headers) {
            const result = {};
            if (headers) {
                Object.keys(headers).forEach((key) => {
                    result[key.toLowerCase()] = String(headers[key]);
                });
            }
            return result;
        }
        /**
         * 转换错误
         */
        transformError(error, config) {
            const httpError = new Error(error.message || 'Request failed');
            httpError.config = config;
            httpError.code = error.code;
            if (axios.isCancel(error)) {
                httpError.isCancelError = true;
                httpError.code = 'CANCELLED';
                httpError.message = 'Request was cancelled';
            }
            else if (error.response) {
                // 服务器响应了错误状态码
                httpError.response = this.transformResponse(error.response, config);
                httpError.code = `HTTP_${error.response.status}`;
            }
            else if (error.request) {
                // 请求已发出但没有收到响应
                httpError.isNetworkError = true;
                httpError.code = 'NETWORK_ERROR';
                httpError.message = 'Network error occurred';
            }
            else {
                // 其他错误
                httpError.isNetworkError = true;
            }
            // 检查是否为超时错误
            if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
                httpError.isTimeoutError = true;
                httpError.code = 'TIMEOUT';
                httpError.message = 'Request timeout';
            }
            return httpError;
        }
        /**
         * 生成请求ID
         */
        generateRequestId() {
            return `axios_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    /**
     * 创建Axios适配器实例
     */
    function createAxiosAdapter(config) {
        return new AxiosAdapter(config);
    }
    /**
     * 检查是否支持Axios
     */
    function isAxiosSupported() {
        try {
            return typeof axios !== 'undefined';
        }
        catch {
            return false;
        }
    }

    /**
      * @alova/shared 1.3.1 (https://alova.js.org)
      * Document https://alova.js.org
      * Copyright 2025 Scott Hu. All Rights Reserved
      * Licensed under MIT (https://github.com/alovajs/alova/blob/main/LICENSE)
    */

    const undefStr = 'undefined';
    // The following unified processing functions or variables added to reduce the amount of compiled code
    const PromiseCls = Promise;
    const promiseReject = (value) => PromiseCls.reject(value);
    const ObjectCls = Object;
    const RegExpCls = RegExp;
    const undefinedValue = undefined;
    const nullValue = null;
    const trueValue = true;
    const falseValue = false;
    const promiseThen = (promise, onFulfilled, onrejected) => promise.then(onFulfilled, onrejected);
    const promiseCatch = (promise, onrejected) => promise.catch(onrejected);
    const promiseFinally = (promise, onfinally) => promise.finally(onfinally);
    const JSONStringify = (value, replacer, space) => JSON.stringify(value, replacer, space);
    const JSONParse = (value) => JSON.parse(value);
    const objectKeys = (obj) => ObjectCls.keys(obj);
    const forEach = (ary, fn) => ary.forEach(fn);
    const pushItem = (ary, ...item) => ary.push(...item);
    const mapItem = (ary, callbackfn) => ary.map(callbackfn);
    const filterItem = (ary, predicate) => ary.filter(predicate);
    const len = (data) => data.length;
    const isArray = (arg) => Array.isArray(arg);
    const deleteAttr = (arg, attr) => delete arg[attr];
    const typeOf = (arg) => typeof arg;
    // Whether it is running on the server side, node and bun are judged by process, and deno is judged by Deno.
    // Some frameworks (such as Alipay and uniapp) will inject the process object as a global variable which `browser` is true
    const isSSR = typeof window === undefStr && (typeof process !== undefStr ? !process.browser : typeof Deno !== undefStr);
    /** cache mode */
    // only cache in memory, it's default option
    const MEMORY = 'memory';
    // persistent cache, and will be read to memory when page is refreshed, it means that the memory cache always exist until cache is expired.
    const STORAGE_RESTORE = 'restore';

    /**
     * Empty function for compatibility processing
     */
    const noop = () => { };
    /**
     * A function that returns the parameter itself, used for compatibility processing
     * Since some systems use self as a reserved word, $self is used to distinguish it.
     * @param arg any parameter
     * @returns return parameter itself
     */
    const $self = (arg) => arg;
    /**
     * Determine whether the parameter is a function any parameter
     * @returns Whether the parameter is a function
     */
    const isFn = (arg) => typeOf(arg) === 'function';
    /**
     * Determine whether the parameter is a number any parameter
     * @returns Whether the parameter is a number
     */
    const isNumber = (arg) => typeOf(arg) === 'number' && !Number.isNaN(arg);
    /**
     * Determine whether the parameter is a string any parameter
     * @returns Whether the parameter is a string
     */
    const isString = (arg) => typeOf(arg) === 'string';
    /**
     * Global toString any parameter stringified parameters
     */
    const globalToString = (arg) => ObjectCls.prototype.toString.call(arg);
    /**
     * Determine whether it is a normal object any parameter
     * @returns Judgment result
     */
    const isPlainObject = (arg) => globalToString(arg) === '[object Object]';
    /**
     * Determine whether it is an instance of a certain class any parameter
     * @returns Judgment result
     */
    const instanceOf = (arg, cls) => arg instanceof cls;
    /**
     * Unified timestamp acquisition function
     * @returns Timestamp
     */
    const getTime = (date) => (date ? date.getTime() : Date.now());
    /**
     * Get the alova instance through the method instance alova example
     */
    const getContext = (methodInstance) => methodInstance.context;
    /**
     * Get method instance configuration data
     * @returns Configuration object
     */
    const getConfig = (methodInstance) => methodInstance.config;
    /**
     * Get alova configuration data alova configuration object
     */
    const getContextOptions = (alovaInstance) => alovaInstance.options;
    /**
     * Get alova configuration data through method instance alova configuration object
     */
    const getOptions = (methodInstance) => getContextOptions(getContext(methodInstance));
    /**
     * Get the key value of the request method
     * @returns The key value of this request method
     */
    const key = (methodInstance) => {
        const { params, headers } = getConfig(methodInstance);
        return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
    };
    /**
     * Get the key value of the method instance method instance
     * @returns The key value of this method instance
     */
    const getMethodInternalKey = (methodInstance) => methodInstance.key;
    /**
     * Is it special data
     * @param data Submit data
     * @returns Judgment result
     */
    const isSpecialRequestBody = (data) => {
        const dataTypeString = globalToString(data);
        return (/^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(dataTypeString) || instanceOf(data, ArrayBuffer));
    };
    const objAssign = (target, ...sources) => ObjectCls.assign(target, ...sources);
    /**
     * Get cached configuration parameters, fixedly returning an object in the format { e: function, c: any, f: any, m: number, s: boolean, t: string } e is the abbreviation of expire, which returns the cache expiration time point (timestamp) in milliseconds.
     * c is controlled, indicating whether it is a controlled cache
     * f is the original value of cacheFor, which is used to call to obtain cached data when c is true.
     * m is the abbreviation of mode, storage mode
     * s is the abbreviation of storage, whether to store it locally
     * t is the abbreviation of tag, which stores tags persistently.
     * @param methodInstance method instance
     * @returns Unified cache parameter object
     */
    const getLocalCacheConfigParam = (methodInstance) => {
        const { cacheFor } = getConfig(methodInstance);
        const getCacheExpireTs = (cacheExpire) => isNumber(cacheExpire) ? getTime() + cacheExpire : getTime(cacheExpire || undefinedValue);
        let cacheMode = MEMORY;
        let expire = () => 0;
        let store = falseValue;
        let tag = undefinedValue;
        const controlled = isFn(cacheFor);
        if (!controlled) {
            let expireColumn = cacheFor;
            if (isPlainObject(cacheFor)) {
                const { mode = MEMORY, expire, tag: configTag } = cacheFor || {};
                cacheMode = mode;
                store = mode === STORAGE_RESTORE;
                tag = configTag ? configTag.toString() : undefinedValue;
                expireColumn = expire;
            }
            expire = (mode) => getCacheExpireTs(isFn(expireColumn) ? expireColumn({ method: methodInstance, mode }) : expireColumn);
        }
        return {
            f: cacheFor,
            c: controlled,
            e: expire,
            m: cacheMode,
            s: store,
            t: tag
        };
    };
    /**
     * Create class instance
     * @param Cls Constructor
     * @param args Constructor parameters class instance
     */
    const newInstance = (Cls, ...args) => new Cls(...args);
    const sloughFunction = (arg, defaultFn) => isFn(arg) ? arg : ![falseValue, nullValue].includes(arg) ? defaultFn : noop;
    const cacheKeyPrefix = '$a.';
    /**
     * build common cache key.
     */
    const buildNamespacedCacheKey = (namespace, key) => cacheKeyPrefix + namespace + key;
    /**
     * Build the complete url baseURL path url parameters complete url
     */
    const buildCompletedURL = (baseURL, url, params) => {
        // Check if the URL starts with http/https
        const startsWithPrefix = /^https?:\/\//i.test(url);
        if (!startsWithPrefix) {
            // If the Base url ends with /, remove /
            baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            // If it does not start with /or http protocol, you need to add /
            // Compatible with some RESTful usage fix: https://github.com/alovajs/alova/issues/382
            if (url !== '') {
                // Since absolute URLs (http/https) are handled above,
                // we only need to ensure relative URLs start with a forward slash
                url = url.startsWith('/') ? url : `/${url}`;
            }
        }
        // fix: https://github.com/alovajs/alova/issues/653
        const completeURL = startsWithPrefix ? url : baseURL + url;
        // Convert params object to get string
        // Filter out those whose value is undefined
        const paramsStr = isString(params)
            ? params
            : mapItem(filterItem(objectKeys(params), key => params[key] !== undefinedValue), key => `${key}=${params[key]}`).join('&');
        // Splice the get parameters behind the url. Note that the url may already have parameters.
        return paramsStr
            ? +completeURL.includes('?')
                ? `${completeURL}&${paramsStr}`
                : `${completeURL}?${paramsStr}`
            : completeURL;
    };
    /**
     * Deep clone an object.
     *
     * @param obj The object to be cloned.
     * @returns The cloned object.
     */
    const deepClone = (obj) => {
        if (isArray(obj)) {
            return mapItem(obj, deepClone);
        }
        if (isPlainObject(obj) && obj.constructor === ObjectCls) {
            const clone = {};
            forEach(objectKeys(obj), key => {
                clone[key] = deepClone(obj[key]);
            });
            return clone;
        }
        return obj;
    };

    /**
     * alova error class
     */
    class AlovaError extends Error {
        constructor(prefix, message, errorCode) {
            super(message + (errorCode ? `\n\nFor detailed: https://alova.js.org/error#${errorCode}` : ''));
            this.name = `[alova${prefix ? `/${prefix}` : ''}]`;
        }
    }
    /**
     * Custom assertion function that throws an error when the expression is false
     * When errorCode is passed in, a link to the error document will be provided to guide the user to correct it.
     * @param expression Judgment expression, true or false
     * @param message Assert message
     */
    const createAssert = (prefix = '') => (expression, message, errorCode) => {
        if (!expression) {
            throw newInstance(AlovaError, prefix, message, errorCode);
        }
    };

    const createEventManager = () => {
        const eventMap = {};
        return {
            eventMap,
            on(type, handler) {
                const eventTypeItem = (eventMap[type] = eventMap[type] || []);
                pushItem(eventTypeItem, handler);
                // return the off function
                return () => {
                    eventMap[type] = filterItem(eventTypeItem, item => item !== handler);
                };
            },
            off(type, handler) {
                const handlers = eventMap[type];
                if (!handlers) {
                    return;
                }
                if (handler) {
                    const index = handlers.indexOf(handler);
                    index > -1 && handlers.splice(index, 1);
                }
                else {
                    delete eventMap[type];
                }
            },
            emit(type, event) {
                const handlers = eventMap[type] || [];
                return mapItem(handlers, handler => handler(event));
            }
        };
    };

    /**
      * alova 3.3.4 (https://alova.js.org)
      * Document https://alova.js.org
      * Copyright 2025 Scott Hu. All Rights Reserved
      * Licensed under MIT (https://github.com/alovajs/alova/blob/main/LICENSE)
    */


    let globalConfigMap = {
        autoHitCache: 'global',
        ssr: isSSR
    };

    const titleStyle = 'color: black; font-size: 12px; font-weight: bolder';
    /**
     * Default cacheLogger function
     */
    var defaultCacheLogger = (response, methodInstance, cacheMode, tag) => {
        const cole = console;
        // eslint-disable-next-line
        const log = (...args) => console.log(...args);
        const { url } = methodInstance;
        const isRestoreMode = cacheMode === STORAGE_RESTORE;
        const hdStyle = '\x1B[42m%s\x1B[49m';
        const labelStyle = '\x1B[32m%s\x1B[39m';
        const startSep = ` [HitCache]${url} `;
        const endSepFn = () => Array(len(startSep) + 1).join('^');
        if (globalConfigMap.ssr) {
            log(hdStyle, startSep);
            log(labelStyle, ' Cache ', response);
            log(labelStyle, ' Mode  ', cacheMode);
            isRestoreMode && log(labelStyle, ' Tag   ', tag);
            log(labelStyle, endSepFn());
        }
        else {
            cole.groupCollapsed
                ? cole.groupCollapsed('%cHitCache', 'padding: 2px 6px; background: #c4fcd3; color: #53b56d;', url)
                : log(hdStyle, startSep);
            log('%c[Cache]', titleStyle, response);
            log('%c[Mode]', titleStyle, cacheMode);
            isRestoreMode && log('%c[Tag]', titleStyle, tag);
            log('%c[Method]', titleStyle, methodInstance);
            cole.groupEnd ? cole.groupEnd() : log(labelStyle, endSepFn());
        }
    };

    const hitSourceStringCacheKey = (key) => `hss.${key}`;
    const hitSourceRegexpPrefix = 'hsr.';
    const hitSourceRegexpCacheKey = (regexpStr) => hitSourceRegexpPrefix + regexpStr;
    const unifiedHitSourceRegexpCacheKey = '$$hsrs';
    const regexpSourceFlagSeparator = '__$<>$__';
    const addItem = (obj, item) => {
        obj[item] = 0;
    };
    /**
     * set or update cache
     * @param namespace namespace
     * @param key stored key
     * @param response Stored response content
     * @param expireTimestamp Timestamp representation of expiration time point
     * @param storage storage object
     * @param tag Storage tags, used to distinguish different storage tags
     */
    const setWithCacheAdapter = async (namespace, key, data, expireTimestamp, cacheAdapter, hitSource, tag) => {
        // not to cache if expireTimestamp is less than current timestamp
        if (expireTimestamp > getTime() && data) {
            const methodCacheKey = buildNamespacedCacheKey(namespace, key);
            await cacheAdapter.set(methodCacheKey, filterItem([data, expireTimestamp === Infinity ? undefinedValue : expireTimestamp, tag], Boolean));
            // save the relationship between this method and its hitSources.
            // cache structure is like this:
            /*
              {
                "$a.[namespace][methodKey]": [cache data],
                ...
                "hss.[sourceMethodKey]": "{
                  [targetMethodKey1]: 0,
                  [targetMethodKey2]: 0,
                  ...
                }",
                "hss.[sourceMethodName]": "{
                  [targetMethodKey3]: 0,
                  [targetMethodKey4]: 0,
                  ...
                }",
                "hsr.[sourceMethodNameRegexpSource]": "{
                  [targetMethodKey5]: 0,
                  [targetMethodKey6]: 0,
                  ...
                }",
                "hsr.regexp1": ["hss.key1", "hss.key2"],
                "hsr.regexp2": ["hss.key1", "hss.key2"]
              }
            */
            if (hitSource) {
                // filter repeat items and categorize the regexp, to prevent unnecessary cost of IO
                const hitSourceKeys = {};
                const hitSourceRegexpSources = [];
                forEach(hitSource, sourceItem => {
                    const isRegexp = instanceOf(sourceItem, RegExpCls);
                    const targetHitSourceKey = isRegexp
                        ? sourceItem.source + (sourceItem.flags ? regexpSourceFlagSeparator + sourceItem.flags : '')
                        : sourceItem;
                    if (targetHitSourceKey) {
                        if (isRegexp && !hitSourceKeys[targetHitSourceKey]) {
                            pushItem(hitSourceRegexpSources, targetHitSourceKey);
                        }
                        addItem(hitSourceKeys, isRegexp ? hitSourceRegexpCacheKey(targetHitSourceKey) : hitSourceStringCacheKey(targetHitSourceKey));
                    }
                });
                // save the relationship. Minimize IO as much as possible
                const promises = mapItem(objectKeys(hitSourceKeys), async (hitSourceKey) => {
                    // filter the empty strings.
                    const targetMethodKeys = (await cacheAdapter.get(hitSourceKey)) || {};
                    addItem(targetMethodKeys, methodCacheKey);
                    await cacheAdapter.set(hitSourceKey, targetMethodKeys);
                });
                const saveRegexp = async () => {
                    // save the regexp source if regexp exists.
                    if (len(hitSourceRegexpSources)) {
                        const regexpList = (await cacheAdapter.get(unifiedHitSourceRegexpCacheKey)) || [];
                        // TODO: hitSourceRegexpSources needs to be deduplicated
                        pushItem(regexpList, ...hitSourceRegexpSources);
                        await cacheAdapter.set(unifiedHitSourceRegexpCacheKey, regexpList);
                    }
                };
                // parallel executing all async tasks.
                await PromiseCls.all([...promises, saveRegexp()]);
            }
        }
    };
    /**
     * Delete stored response data
     * @param namespace namespace
     * @param key stored key
     * @param storage storage object
     */
    const removeWithCacheAdapter = async (namespace, key, cacheAdapter) => {
        const methodStoreKey = buildNamespacedCacheKey(namespace, key);
        await cacheAdapter.remove(methodStoreKey);
    };
    /**
     * Get stored response data
     * @param namespace namespace
     * @param key stored key
     * @param storage storage object
     * @param tag Store tags. If the tag changes, the data will become invalid.
     */
    const getRawWithCacheAdapter = async (namespace, key, cacheAdapter, tag) => {
        const storagedData = await cacheAdapter.get(buildNamespacedCacheKey(namespace, key));
        if (storagedData) {
            // Eslint disable next line
            const [dataUnused, expireTimestamp, storedTag] = storagedData;
            // If there is no expiration time, it means that the data will never expire. Otherwise, you need to determine whether it has expired.
            if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
                return storagedData;
            }
            // If expired, delete cache
            await removeWithCacheAdapter(namespace, key, cacheAdapter);
        }
    };
    /**
     * Get stored response data
     * @param namespace namespace
     * @param key stored key
     * @param storage storage object
     * @param tag Store tags. If the tag changes, the data will become invalid.
     */
    const getWithCacheAdapter = async (namespace, key, cacheAdapter, tag) => {
        const rawData = await getRawWithCacheAdapter(namespace, key, cacheAdapter, tag);
        return rawData ? rawData[0] : undefinedValue;
    };
    /**
     * query and delete target cache with key and name of source method instance.
     * @param sourceKey source method instance key
     * @param sourceName source method instance name
     * @param cacheAdapter cache adapter
     */
    const hitTargetCacheWithCacheAdapter = async (sourceKey, sourceName, cacheAdapter) => {
        const sourceNameStr = `${sourceName}`;
        // map that recording the source key and target method keys.
        const sourceTargetKeyMap = {};
        // get hit key by method key.
        const hitSourceKey = hitSourceStringCacheKey(sourceKey);
        sourceTargetKeyMap[hitSourceKey] = await cacheAdapter.get(hitSourceKey);
        let unifiedHitSourceRegexpChannel;
        if (sourceName) {
            const hitSourceName = hitSourceStringCacheKey(sourceNameStr);
            // get hit key by method name if it is exists.
            sourceTargetKeyMap[hitSourceName] = await cacheAdapter.get(hitSourceName);
            // match regexped key by source method name and get hit key by method name.
            unifiedHitSourceRegexpChannel = await cacheAdapter.get(unifiedHitSourceRegexpCacheKey);
            const matchedRegexpStrings = [];
            if (unifiedHitSourceRegexpChannel && len(unifiedHitSourceRegexpChannel)) {
                forEach(unifiedHitSourceRegexpChannel, regexpStr => {
                    const [source, flag] = regexpStr.split(regexpSourceFlagSeparator);
                    if (newInstance(RegExpCls, source, flag).test(sourceNameStr)) {
                        pushItem(matchedRegexpStrings, regexpStr);
                    }
                });
                // parallel get hit key by matched regexps.
                await PromiseCls.all(mapItem(matchedRegexpStrings, async (regexpString) => {
                    const hitSourceRegexpString = hitSourceRegexpCacheKey(regexpString);
                    sourceTargetKeyMap[hitSourceRegexpString] = await cacheAdapter.get(hitSourceRegexpString);
                }));
            }
        }
        const removeWithTargetKey = async (targetKey) => {
            try {
                await cacheAdapter.remove(targetKey);
                // loop sourceTargetKeyMap and remove this key to prevent unnecessary cost of IO.
                for (const sourceKey in sourceTargetKeyMap) {
                    const targetKeys = sourceTargetKeyMap[sourceKey];
                    if (targetKeys) {
                        deleteAttr(targetKeys, targetKey);
                    }
                }
            }
            catch (_a) {
                // the try-catch is used to prevent throwing error, cause throwing error in `Promise.all` below.
            }
        };
        // now let's start to delete target caches.
        // and filter the finished keys.
        const accessedKeys = {};
        await PromiseCls.all(mapItem(objectKeys(sourceTargetKeyMap), async (sourceKey) => {
            const targetKeys = sourceTargetKeyMap[sourceKey];
            if (targetKeys) {
                const removingPromises = [];
                for (const key in targetKeys) {
                    if (!accessedKeys[key]) {
                        addItem(accessedKeys, key);
                        pushItem(removingPromises, removeWithTargetKey(key));
                    }
                }
                await PromiseCls.all(removingPromises);
            }
        }));
        // update source key if there is still has keys.
        // remove source key if its keys is empty.
        const unifiedHitSourceRegexpChannelLen = len(unifiedHitSourceRegexpChannel || []);
        await PromiseCls.all(mapItem(objectKeys(sourceTargetKeyMap), async (sourceKey) => {
            const targetKeys = sourceTargetKeyMap[sourceKey];
            if (targetKeys) {
                if (len(objectKeys(targetKeys))) {
                    await cacheAdapter.set(sourceKey, targetKeys);
                }
                else {
                    await cacheAdapter.remove(sourceKey);
                    // if this is a regexped key, need to remove it from unified regexp channel.
                    if (sourceKey.includes(hitSourceRegexpPrefix) && unifiedHitSourceRegexpChannel) {
                        unifiedHitSourceRegexpChannel = filterItem(unifiedHitSourceRegexpChannel, rawRegexpStr => hitSourceRegexpCacheKey(rawRegexpStr) !== sourceKey);
                    }
                }
            }
        }));
        // update unified hit source regexp channel if its length was changed.
        if (unifiedHitSourceRegexpChannelLen !== len(unifiedHitSourceRegexpChannel || [])) {
            await cacheAdapter.set(unifiedHitSourceRegexpCacheKey, unifiedHitSourceRegexpChannel);
        }
    };

    var cloneMethod = (methodInstance) => {
        const { data, config } = methodInstance;
        const newConfig = { ...config };
        const { headers = {}, params = {} } = newConfig;
        const ctx = getContext(methodInstance);
        newConfig.headers = { ...headers };
        newConfig.params = isString(params) ? params : { ...params };
        const newMethod = newInstance((Method), methodInstance.type, ctx, methodInstance.url, newConfig, data);
        return objAssign(newMethod, {
            ...methodInstance,
            config: newConfig
        });
    };
    /**
     * hit(invalidate) target caches by source method
     * this is the implementation of auto invalidate cache
     * @param sourceMethod source method instance
     */
    const hitCacheBySource = async (sourceMethod) => {
        // Find the hit target cache and invalidate its cache
        // Control the automatic cache invalidation range through global configuration `autoHitCache`
        const { autoHitCache } = globalConfigMap;
        const { l1Cache, l2Cache } = getContext(sourceMethod);
        const sourceKey = getMethodInternalKey(sourceMethod);
        const { name: sourceName } = getConfig(sourceMethod);
        const cacheAdaptersInvolved = {
            global: [...usingL1CacheAdapters, ...usingL2CacheAdapters],
            self: [l1Cache, l2Cache],
            close: []
        }[autoHitCache];
        if (cacheAdaptersInvolved && len(cacheAdaptersInvolved)) {
            await PromiseCls.all(mapItem(cacheAdaptersInvolved, involvedCacheAdapter => hitTargetCacheWithCacheAdapter(sourceKey, sourceName, involvedCacheAdapter)));
        }
    };

    const adapterReturnMap = {};
    /**
     * actual request function
     * @param method request method object
     * @param forceRequest Ignore cache
     * @returns response data
     */
    function sendRequest(methodInstance, forceRequest) {
        let fromCache = trueValue;
        let requestAdapterCtrlsPromiseResolveFn;
        const requestAdapterCtrlsPromise = newInstance(PromiseCls, resolve => {
            requestAdapterCtrlsPromiseResolveFn = resolve;
        });
        const response = async () => {
            const { beforeRequest = noop, responded, requestAdapter, cacheLogger } = getOptions(methodInstance);
            const methodKey = getMethodInternalKey(methodInstance);
            const { s: toStorage, t: tag, m: cacheMode, e: expireMilliseconds } = getLocalCacheConfigParam(methodInstance);
            const { id, l1Cache, l2Cache, snapshots } = getContext(methodInstance);
            // Get controlled cache or uncontrolled cache
            const { cacheFor } = getConfig(methodInstance);
            const { hitSource: methodHitSource } = methodInstance;
            // If the current method sets a controlled cache, check whether there is custom data
            let cachedResponse = await (isFn(cacheFor)
                ? cacheFor()
                : // If it is a forced request, skip the step of getting it from the cache
                    // Otherwise, determine whether to use cached data
                    forceRequest
                        ? undefinedValue
                        : getWithCacheAdapter(id, methodKey, l1Cache));
            // If it is storage restore mode and there is no data in the cache, the persistent data needs to be restored to the cache, and the cached expiration time must be used.
            if (cacheMode === STORAGE_RESTORE && !cachedResponse && !forceRequest) {
                const rawL2CacheData = await getRawWithCacheAdapter(id, methodKey, l2Cache, tag);
                if (rawL2CacheData) {
                    const [l2Response, l2ExpireMilliseconds] = rawL2CacheData;
                    await setWithCacheAdapter(id, methodKey, l2Response, l2ExpireMilliseconds, l1Cache, methodHitSource);
                    cachedResponse = l2Response;
                }
            }
            // Clone the method as a parameter and pass it to beforeRequest to prevent side effects when using the original method instance request multiple times.
            // Place it after `let cachedResponse = await...` to solve the problem of first assigning promise to the method instance in method.send, otherwise the promise will be undefined in clonedMethod.
            const clonedMethod = cloneMethod(methodInstance);
            // Call the hook function before sending the request
            // beforeRequest supports synchronous functions and asynchronous functions
            await beforeRequest(clonedMethod);
            const { baseURL, url: newUrl, type, data } = clonedMethod;
            const { params = {}, headers = {}, transform = $self, shareRequest } = getConfig(clonedMethod);
            const namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {});
            const requestBody = clonedMethod.data;
            const requestBodyIsSpecial = isSpecialRequestBody(requestBody);
            // Will not share the request when requestBody is special data
            let requestAdapterCtrls = requestBodyIsSpecial ? undefinedValue : namespacedAdapterReturnMap[methodKey];
            let responseSuccessHandler = $self;
            let responseErrorHandler = undefinedValue;
            let responseCompleteHandler = noop;
            // uniform handler of onSuccess, onError, onComplete
            if (isFn(responded)) {
                responseSuccessHandler = responded;
            }
            else if (isPlainObject(responded)) {
                const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responded;
                responseSuccessHandler = isFn(successHandler) ? successHandler : responseSuccessHandler;
                responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
                responseCompleteHandler = isFn(completeHandler) ? completeHandler : responseCompleteHandler;
            }
            // If there is no cache, make a request
            if (cachedResponse !== undefinedValue) {
                requestAdapterCtrlsPromiseResolveFn(); // Ctrls will not be passed in when cache is encountered
                // Print cache log
                clonedMethod.fromCache = trueValue;
                sloughFunction(cacheLogger, defaultCacheLogger)(cachedResponse, clonedMethod, cacheMode, tag);
                responseCompleteHandler(clonedMethod);
                return cachedResponse;
            }
            fromCache = falseValue;
            if (!shareRequest || !requestAdapterCtrls) {
                // Request data
                const ctrls = requestAdapter({
                    url: buildCompletedURL(baseURL, newUrl, params),
                    type,
                    data,
                    headers
                }, clonedMethod);
                requestAdapterCtrls = namespacedAdapterReturnMap[methodKey] = ctrls;
            }
            // Pass request adapter ctrls to promise for use in on download, on upload and abort
            requestAdapterCtrlsPromiseResolveFn(requestAdapterCtrls);
            /**
             * Process response tasks and do not cache data on failure
             * @param responsePromise Respond to promise instances
             * @param responseHeaders Request header
             * @param callInSuccess Whether to call in success callback
             * @returns Processed response
             */
            const handleResponseTask = async (handlerReturns, responseHeaders, callInSuccess = trueValue) => {
                const responseData = await handlerReturns;
                const transformedData = await transform(responseData, responseHeaders || {});
                snapshots.save(methodInstance);
                // Even if the cache operation fails, the response structure will be returned normally to avoid request errors caused by cache operation problems.
                // The cache operation results can be obtained through `cacheAdapter.emitter.on('success' | 'fail', event => {})`
                try {
                    // Automatic cache invalidation
                    await hitCacheBySource(clonedMethod);
                }
                catch (_a) { }
                // Do not save cache when requestBody is special data
                // Reason 1: Special data is generally submitted and requires interaction with the server.
                // Reason 2: Special data is not convenient for generating cache keys
                const toCache = !requestBody || !requestBodyIsSpecial;
                // Use the latest expiration time after the response to cache data to avoid the problem of expiration time loss due to too long response time
                if (toCache && callInSuccess) {
                    try {
                        await PromiseCls.all([
                            setWithCacheAdapter(id, methodKey, transformedData, expireMilliseconds(MEMORY), l1Cache, methodHitSource),
                            toStorage &&
                                setWithCacheAdapter(id, methodKey, transformedData, expireMilliseconds(STORAGE_RESTORE), l2Cache, methodHitSource, tag)
                        ]);
                    }
                    catch (_b) { }
                }
                // Deep clone the transformed data before returning to avoid reference issues
                // the `deepClone` will only clone array and plain object
                return deepClone(transformedData);
            };
            return promiseFinally(promiseThen(PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()]), ([rawResponse, rawHeaders]) => {
                // Regardless of whether the request succeeds or fails, the shared request needs to be removed first
                deleteAttr(namespacedAdapterReturnMap, methodKey);
                return handleResponseTask(responseSuccessHandler(rawResponse, clonedMethod), rawHeaders);
            }, (error) => {
                // Regardless of whether the request succeeds or fails, the shared request needs to be removed first
                deleteAttr(namespacedAdapterReturnMap, methodKey);
                return isFn(responseErrorHandler)
                    ? // When responding to an error, if no error is thrown, the successful response process will be processed, but the data will not be cached.
                        handleResponseTask(responseErrorHandler(error, clonedMethod), undefinedValue, falseValue)
                    : promiseReject(error);
            }), () => {
                responseCompleteHandler(clonedMethod);
            });
        };
        return {
            // request interrupt function
            abort: () => {
                promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.abort());
            },
            onDownload: (handler) => {
                promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onDownload && requestAdapterCtrls.onDownload(handler));
            },
            onUpload: (handler) => {
                promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onUpload && requestAdapterCtrls.onUpload(handler));
            },
            response,
            fromCache: () => fromCache
        };
    }

    const offEventCallback = (offHandler, handlers) => () => {
        const index = handlers.indexOf(offHandler);
        index >= 0 && handlers.splice(index, 1);
    };
    class Method {
        constructor(type, context, url, config, data) {
            this.dhs = [];
            this.uhs = [];
            this.fromCache = undefinedValue;
            const abortRequest = () => {
                abortRequest.a();
            };
            abortRequest.a = noop;
            type = type.toUpperCase();
            const instance = this;
            const contextOptions = getContextOptions(context);
            instance.abort = abortRequest;
            instance.baseURL = contextOptions.baseURL || '';
            instance.url = url;
            instance.type = type;
            instance.context = context;
            // Merge request-related global configuration into the method object
            const contextConcatConfig = {};
            const mergedLocalCacheKey = 'cacheFor';
            const globalLocalCache = isPlainObject(contextOptions[mergedLocalCacheKey])
                ? contextOptions[mergedLocalCacheKey][type]
                : undefinedValue;
            const hitSource = config && config.hitSource;
            // Merge parameters
            forEach(['timeout', 'shareRequest'], mergedKey => {
                if (contextOptions[mergedKey] !== undefinedValue) {
                    contextConcatConfig[mergedKey] = contextOptions[mergedKey];
                }
            });
            // Merge local cache
            if (globalLocalCache !== undefinedValue) {
                contextConcatConfig[mergedLocalCacheKey] = globalLocalCache;
            }
            // Unify hit sources into arrays and convert them into method keys when there are method instances
            if (hitSource) {
                instance.hitSource = mapItem(isArray(hitSource) ? hitSource : [hitSource], sourceItem => instanceOf(sourceItem, Method) ? getMethodInternalKey(sourceItem) : sourceItem);
                deleteAttr(config, 'hitSource');
            }
            instance.config = {
                ...contextConcatConfig,
                headers: {},
                params: {},
                ...(config || {})
            };
            instance.data = data;
            instance.meta = config ? config.meta : instance.meta;
            // The original key needs to be used externally instead of generating the key in real time.
            // The reason is that the parameters of the method may pass in reference type values, but when the reference type value changes externally, the key generated in real time also changes, so it is more accurate to use the initial key.
            instance.key = instance.generateKey();
        }
        /**
         * Bind download progress callback function
         * @param progressHandler Download progress callback function
         * @version 2.17.0
         * @return unbind function
         */
        onDownload(downloadHandler) {
            pushItem(this.dhs, downloadHandler);
            return offEventCallback(downloadHandler, this.dhs);
        }
        /**
         * Bind upload progress callback function
         * @param progressHandler Upload progress callback function
         * @version 2.17.0
         * @return unbind function
         */
        onUpload(uploadHandler) {
            pushItem(this.uhs, uploadHandler);
            return offEventCallback(uploadHandler, this.uhs);
        }
        /**
         * Send a request through a method instance and return a promise object
         */
        send(forceRequest = falseValue) {
            const instance = this;
            const { response, onDownload, onUpload, abort, fromCache } = sendRequest(instance, forceRequest);
            len(instance.dhs) > 0 &&
                onDownload((loaded, total) => forEach(instance.dhs, handler => handler({ loaded, total })));
            len(instance.uhs) > 0 && onUpload((loaded, total) => forEach(instance.uhs, handler => handler({ loaded, total })));
            // The interrupt function is bound to the method instance for each request. The user can also interrupt the current request through method instance.abort()
            instance.abort.a = abort;
            instance.fromCache = undefinedValue;
            instance.promise = promiseThen(response(), r => {
                instance.fromCache = fromCache();
                return r;
            });
            return instance.promise;
        }
        /**
         * Set the method name, if there is already a name it will be overwritten
         * @param name method name
         */
        setName(name) {
            getConfig(this).name = name;
        }
        generateKey() {
            return key(this);
        }
        /**
         * Bind callbacks for resolve and/or reject Promise
         * @param onfulfilled The callback to be executed when resolving the Promise
         * @param onrejected The callback to be executed when the Promise is rejected
         * @returns Returns a Promise for executing any callbacks
         */
        then(onfulfilled, onrejected) {
            return promiseThen(this.send(), onfulfilled, onrejected);
        }
        /**
         * Bind a callback only for reject Promise
         * @param onrejected The callback to be executed when the Promise is rejected
         * @returns Returns a Promise that completes the callback
         */
        catch(onrejected) {
            return promiseCatch(this.send(), onrejected);
        }
        /**
         * Bind a callback that is called when the Promise is resolved (resolve or reject)
         * @param onfinally Callback executed when Promise is resolved (resolve or reject).
         * @return Returns a Promise that completes the callback.
         */
        finally(onfinally) {
            return promiseFinally(this.send(), onfinally);
        }
    }

    /**
     * Custom assertion function, throws an error when the expression is false
     * @param expression Judgment expression, true or false
     * @param msg assert message
     */
    const myAssert = createAssert();

    // local storage will not fail the operation.
    const EVENT_SUCCESS_KEY = 'success';
    const memoryAdapter = () => {
        let l1Cache = {};
        const l1CacheEmitter = createEventManager();
        const adapter = {
            set(key, value) {
                l1Cache[key] = value;
                l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'set', key, value, container: l1Cache });
            },
            get: key => {
                const value = l1Cache[key];
                l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'get', key, value, container: l1Cache });
                return value;
            },
            remove(key) {
                deleteAttr(l1Cache, key);
                l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'remove', key, container: l1Cache });
            },
            clear: () => {
                l1Cache = {};
                l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'clear', key: '', container: l1Cache });
            },
            emitter: l1CacheEmitter
        };
        return adapter;
    };
    const localStorageAdapter = () => {
        const l2CacheEmitter = createEventManager();
        const instance = localStorage;
        const adapter = {
            set: (key, value) => {
                instance.setItem(key, JSONStringify(value));
                l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'set', key, value, container: instance });
            },
            get: key => {
                const data = instance.getItem(key);
                const value = data ? JSONParse(data) : data;
                l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'get', key, value, container: instance });
                return value;
            },
            remove: key => {
                instance.removeItem(key);
                l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'remove', key, container: instance });
            },
            clear: () => {
                instance.clear();
                l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'clear', key: '', container: instance });
            },
            emitter: l2CacheEmitter
        };
        return adapter;
    };
    const placeholderAdapter = () => {
        const l2CacheNotDefinedAssert = () => {
            myAssert(falseValue, 'l2Cache is not defined.');
        };
        return {
            set: () => {
                l2CacheNotDefinedAssert();
            },
            get: () => {
                l2CacheNotDefinedAssert();
                return undefinedValue;
            },
            remove: () => {
                l2CacheNotDefinedAssert();
            },
            clear: () => { }
        };
    };

    const SetCls = Set;
    class MethodSnapshotContainer {
        constructor(capacity) {
            /**
             * Method instance snapshot collection, method instances that have sent requests will be saved
             */
            this.records = {};
            this.occupy = 0;
            myAssert(capacity >= 0, 'expected snapshots limit to be >= 0');
            this.capacity = capacity;
        }
        /**
         * Save method instance snapshot
         * @param methodInstance method instance
         */
        save(methodInstance) {
            const { name } = getConfig(methodInstance);
            const { records, occupy, capacity } = this;
            if (name && occupy < capacity) {
                // Using the name of the method as the key, save the method instance to the snapshot
                const targetSnapshots = (records[name] = records[name] || newInstance(SetCls));
                targetSnapshots.add(methodInstance);
                // Statistical quantity
                this.occupy += 1;
            }
        }
        /**
         * Get a Method instance snapshot, which will filter out the corresponding Method instance based on the matcher
         * @param matcher Matching snapshot name, which can be a string or regular expression, or an object with a filter function
         * @returns Array of matched Method instance snapshots
         */
        match(matcher, matchAll = true) {
            // Unify the filter parameters into name matcher and match handler
            let nameString;
            let nameReg;
            let matchHandler;
            let nameMatcher = matcher;
            if (isPlainObject(matcher)) {
                nameMatcher = matcher.name;
                matchHandler = matcher.filter;
            }
            if (instanceOf(nameMatcher, RegExpCls)) {
                nameReg = nameMatcher;
            }
            else if (isString(nameMatcher)) {
                nameString = nameMatcher;
            }
            const { records } = this;
            // Get the corresponding method instance snapshot through the deconstructed name matcher and filter handler
            let matches = newInstance((SetCls));
            // If the namespace parameter is provided, it will only be searched in this namespace, otherwise it will be searched in all cached data.
            if (nameString) {
                matches = records[nameString] || matches;
            }
            else if (nameReg) {
                forEach(filterItem(objectKeys(records), methodName => nameReg.test(methodName)), methodName => {
                    records[methodName].forEach(method => matches.add(method));
                });
            }
            const fromMatchesArray = isFn(matchHandler) ? filterItem([...matches], matchHandler) : [...matches];
            return (matchAll ? fromMatchesArray : fromMatchesArray[0]);
        }
    }

    const typeGet = 'GET';
    const typeHead = 'HEAD';
    const typePost = 'POST';
    const typePut = 'PUT';
    const typePatch = 'PATCH';
    const typeDelete = 'DELETE';
    const typeOptions = 'OPTIONS';
    const defaultAlovaOptions = {
        /**
         * GET requests are cached for 5 minutes (300000 milliseconds) by default, and other requests are not cached by default.
         */
        cacheFor: {
            [typeGet]: 300000
        },
        /**
         * Share requests default to true
         */
        shareRequest: trueValue,
        /**
         * Number of method snapshots, default is 1000
         */
        snapshots: 1000
    };
    let idCount = 0;
    class Alova {
        constructor(options) {
            var _a, _b;
            const instance = this;
            instance.id = (options.id || (idCount += 1)).toString();
            // If storage is not specified, local storage is used by default.
            instance.l1Cache = options.l1Cache || memoryAdapter();
            instance.l2Cache =
                options.l2Cache || (typeof localStorage !== 'undefined' ? localStorageAdapter() : placeholderAdapter());
            // Merge default options
            instance.options = {
                ...defaultAlovaOptions,
                ...options
            };
            instance.snapshots = newInstance((MethodSnapshotContainer), (_b = (_a = options.snapshots) !== null && _a !== void 0 ? _a : defaultAlovaOptions.snapshots) !== null && _b !== void 0 ? _b : 0);
        }
        Request(config) {
            return newInstance((Method), config.method || typeGet, this, config.url, config, config.data);
        }
        Get(url, config) {
            return newInstance((Method), typeGet, this, url, config);
        }
        Post(url, data, config) {
            return newInstance((Method), typePost, this, url, config, data);
        }
        Delete(url, data, config) {
            return newInstance((Method), typeDelete, this, url, config, data);
        }
        Put(url, data, config) {
            return newInstance((Method), typePut, this, url, config, data);
        }
        Head(url, config) {
            return newInstance((Method), typeHead, this, url, config);
        }
        Patch(url, data, config) {
            return newInstance((Method), typePatch, this, url, config, data);
        }
        Options(url, config) {
            return newInstance((Method), typeOptions, this, url, config);
        }
    }
    let boundStatesHook = undefinedValue;
    const usingL1CacheAdapters = [];
    const usingL2CacheAdapters = [];
    /**
     * create an alova instance.
     * @param options alova configuration.
     * @returns alova instance.
     */
    const createAlova = (options) => {
        const alovaInstance = newInstance((Alova), options);
        const newStatesHook = alovaInstance.options.statesHook;
        if (boundStatesHook && newStatesHook) {
            myAssert(boundStatesHook.name === newStatesHook.name, 'expected to use the same `statesHook`');
        }
        boundStatesHook = newStatesHook;
        const { l1Cache, l2Cache } = alovaInstance;
        !usingL1CacheAdapters.includes(l1Cache) && pushItem(usingL1CacheAdapters, l1Cache);
        !usingL2CacheAdapters.includes(l2Cache) && pushItem(usingL2CacheAdapters, l2Cache);
        return alovaInstance;
    };

    /**
     * Alova适配器
     * 基于Alova库实现HTTP请求
     */
    class AlovaAdapter {
        constructor(alovaConfig) {
            Object.defineProperty(this, "alovaInstance", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "cancelTokens", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
            this.alovaInstance = createAlova({
                baseURL: '',
                timeout: 10000,
                ...alovaConfig,
            });
        }
        /**
         * 发送请求
         */
        async request(config) {
            try {
                const methodInstance = this.createMethodInstance(config);
                const response = await methodInstance.send();
                return this.transformResponse(response, config);
            }
            catch (error) {
                throw this.transformError(error, config);
            }
        }
        /**
         * 取消请求
         */
        cancel(requestId) {
            if (requestId) {
                const cancelFn = this.cancelTokens.get(requestId);
                if (cancelFn) {
                    cancelFn();
                    this.cancelTokens.delete(requestId);
                }
            }
            else {
                // 取消所有请求
                this.cancelTokens.forEach(cancelFn => cancelFn());
                this.cancelTokens.clear();
            }
        }
        /**
         * 获取适配器名称
         */
        getName() {
            return 'alova';
        }
        /**
         * 获取Alova实例
         */
        getAlovaInstance() {
            return this.alovaInstance;
        }
        /**
         * 创建方法实例
         */
        createMethodInstance(config) {
            const url = this.buildURL(config);
            const method = config.method || HttpMethod.GET;
            let methodInstance;
            switch (method.toUpperCase()) {
                case HttpMethod.GET:
                    methodInstance = this.alovaInstance.Get(url, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.POST:
                    methodInstance = this.alovaInstance.Post(url, config.data, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.PUT:
                    methodInstance = this.alovaInstance.Put(url, config.data, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.DELETE:
                    methodInstance = this.alovaInstance.Delete(url, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.PATCH:
                    methodInstance = this.alovaInstance.Patch(url, config.data, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.HEAD:
                    methodInstance = this.alovaInstance.Head(url, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                case HttpMethod.OPTIONS:
                    methodInstance = this.alovaInstance.Options(url, {
                        params: config.params,
                        headers: config.headers,
                        timeout: config.timeout,
                        ...this.extractAlovaConfig(config),
                    });
                    break;
                default:
                    throw new Error(`Unsupported HTTP method: ${method}`);
            }
            // 设置取消令牌
            const requestId = this.generateRequestId();
            this.cancelTokens.set(requestId, () => {
                if (methodInstance && typeof methodInstance.abort === 'function') {
                    methodInstance.abort();
                }
            });
            return methodInstance;
        }
        /**
         * 构建完整URL
         */
        buildURL(config) {
            let url = config.url;
            // 如果配置了baseURL且当前URL不是绝对URL，则组合URL
            if (config.baseURL && !this.isAbsoluteURL(url)) {
                url = this.combineURLs(config.baseURL, url);
            }
            return url;
        }
        /**
         * 提取Alova特定配置
         */
        extractAlovaConfig(config) {
            const alovaConfig = {};
            // 处理响应类型
            if (config.responseType) {
                alovaConfig.responseType = config.responseType;
            }
            // 处理凭证
            if (config.withCredentials !== undefined) {
                alovaConfig.withCredentials = config.withCredentials;
            }
            // 处理进度回调
            if (config.onUploadProgress) {
                alovaConfig.onUpload = (progress) => {
                    const progressData = {
                        loaded: progress.loaded,
                        total: progress.total || 0,
                        percentage: progress.total ? Math.round((progress.loaded * 100) / progress.total) : 0,
                    };
                    config.onUploadProgress(progressData);
                };
            }
            if (config.onDownloadProgress) {
                alovaConfig.onDownload = (progress) => {
                    const progressData = {
                        loaded: progress.loaded,
                        total: progress.total || 0,
                        percentage: progress.total ? Math.round((progress.loaded * 100) / progress.total) : 0,
                    };
                    config.onDownloadProgress(progressData);
                };
            }
            // 复制其他自定义配置
            Object.keys(config).forEach((key) => {
                if (!['url', 'method', 'headers', 'params', 'data', 'timeout', 'baseURL', 'responseType', 'withCredentials', 'onUploadProgress', 'onDownloadProgress'].includes(key)) {
                    alovaConfig[key] = config[key];
                }
            });
            return alovaConfig;
        }
        /**
         * 转换响应
         */
        transformResponse(response, config) {
            // Alova的响应格式可能因适配器而异，这里提供通用转换
            const httpResponse = {
                data: response.data || response,
                status: response.status || 200,
                statusText: response.statusText || 'OK',
                headers: this.transformResponseHeaders(response.headers || {}),
                config,
                raw: response,
            };
            return httpResponse;
        }
        /**
         * 转换响应头
         */
        transformResponseHeaders(headers) {
            const result = {};
            if (headers) {
                if (typeof headers.forEach === 'function') {
                    // Headers对象
                    headers.forEach((value, key) => {
                        result[key.toLowerCase()] = value;
                    });
                }
                else if (typeof headers === 'object') {
                    // 普通对象
                    Object.keys(headers).forEach((key) => {
                        result[key.toLowerCase()] = String(headers[key]);
                    });
                }
            }
            return result;
        }
        /**
         * 转换错误
         */
        transformError(error, config) {
            const httpError = new Error(error.message || 'Request failed');
            httpError.config = config;
            httpError.code = error.code;
            // 检查错误类型
            if (error.name === 'AbortError' || error.code === 'ABORT_ERR') {
                httpError.isCancelError = true;
                httpError.code = 'CANCELLED';
                httpError.message = 'Request was cancelled';
            }
            else if (error.response) {
                // 服务器响应了错误状态码
                httpError.response = this.transformResponse(error.response, config);
                httpError.code = `HTTP_${error.response.status}`;
            }
            else if (error.request || error.name === 'NetworkError') {
                // 网络错误
                httpError.isNetworkError = true;
                httpError.code = 'NETWORK_ERROR';
                httpError.message = 'Network error occurred';
            }
            else if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
                // 超时错误
                httpError.isTimeoutError = true;
                httpError.code = 'TIMEOUT';
                httpError.message = 'Request timeout';
            }
            return httpError;
        }
        /**
         * 检查是否为绝对URL
         */
        isAbsoluteURL(url) {
            return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
        }
        /**
         * 组合URL
         */
        combineURLs(baseURL, relativeURL) {
            return relativeURL
                ? `${baseURL.replace(/\/+$/, '')}/${relativeURL.replace(/^\/+/, '')}`
                : baseURL;
        }
        /**
         * 生成请求ID
         */
        generateRequestId() {
            return `alova_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    /**
     * 创建Alova适配器实例
     */
    function createAlovaAdapter(config) {
        return new AlovaAdapter(config);
    }
    /**
     * 检查是否支持Alova
     */
    function isAlovaSupported() {
        try {
            return typeof createAlova !== 'undefined';
        }
        catch {
            return false;
        }
    }

    /**
     * HTTP客户端具体实现
     * 支持多种适配器的HTTP客户端
     */
    /**
     * 适配器工厂实现
     */
    class HttpAdapterFactory {
        constructor(adapterType, config) {
            Object.defineProperty(this, "adapterType", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: adapterType
            });
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: config
            });
        }
        create(config) {
            switch (this.adapterType) {
                case 'fetch':
                    return createFetchAdapter();
                case 'axios':
                    return createAxiosAdapter(config);
                case 'alova':
                    return createAlovaAdapter(config);
                default:
                    throw new Error(`Unsupported adapter type: ${this.adapterType}`);
            }
        }
        getName() {
            return this.adapterType;
        }
        isSupported() {
            switch (this.adapterType) {
                case 'fetch':
                    return isFetchSupported$1();
                case 'axios':
                    return isAxiosSupported();
                case 'alova':
                    return isAlovaSupported();
                default:
                    return false;
            }
        }
    }
    /**
     * HTTP客户端实现类
     */
    class HttpClient extends BaseHttpClient {
        constructor(config = {}) {
            super(config);
        }
        /**
         * 创建适配器实例
         */
        createAdapter() {
            // 如果提供了自定义适配器，直接使用
            if (this.config.customAdapter) {
                return this.config.customAdapter;
            }
            const adapterType = this.config.adapter || 'fetch';
            const factory = new HttpAdapterFactory(adapterType, this.config);
            // 检查适配器是否支持
            if (!factory.isSupported()) {
                // 如果指定的适配器不支持，尝试使用备用适配器
                const fallbackAdapters = ['fetch', 'axios', 'alova'];
                for (const fallback of fallbackAdapters) {
                    if (fallback !== adapterType) {
                        const fallbackFactory = new HttpAdapterFactory(fallback, this.config);
                        if (fallbackFactory.isSupported()) {
                            console.warn(`Adapter '${adapterType}' is not supported, falling back to '${fallback}'`);
                            return fallbackFactory.create(this.config);
                        }
                    }
                }
                throw new Error(`No supported HTTP adapter found. Please ensure at least one of fetch, axios, or alova is available.`);
            }
            return factory.create(this.config);
        }
        /**
         * 切换适配器
         */
        switchAdapter(adapterType) {
            if (typeof adapterType === 'string') {
                const factory = new HttpAdapterFactory(adapterType, this.config);
                if (!factory.isSupported()) {
                    throw new Error(`Adapter '${adapterType}' is not supported`);
                }
                this.adapter = factory.create(this.config);
                this.config.adapter = adapterType;
            }
            else {
                this.adapter = adapterType;
                this.config.customAdapter = adapterType;
            }
        }
        /**
         * 获取当前适配器信息
         */
        getAdapterInfo() {
            return {
                name: this.adapter.getName(),
                isCustom: !!this.config.customAdapter,
            };
        }
        /**
         * 检查适配器是否支持
         */
        static isAdapterSupported(adapterType) {
            switch (adapterType) {
                case 'fetch':
                    return isFetchSupported$1();
                case 'axios':
                    return isAxiosSupported();
                case 'alova':
                    return isAlovaSupported();
                default:
                    return false;
            }
        }
        /**
         * 获取所有支持的适配器
         */
        static getSupportedAdapters() {
            const adapters = [];
            if (isFetchSupported$1())
                adapters.push('fetch');
            if (isAxiosSupported())
                adapters.push('axios');
            if (isAlovaSupported())
                adapters.push('alova');
            return adapters;
        }
        /**
         * 创建新的HTTP客户端实例
         */
        static create(config = {}) {
            return new HttpClient(config);
        }
        /**
         * 创建带有指定适配器的HTTP客户端实例
         */
        static createWithAdapter(adapterType, config = {}) {
            return new HttpClient({
                ...config,
                adapter: adapterType,
            });
        }
        /**
         * 创建带有自定义适配器的HTTP客户端实例
         */
        static createWithCustomAdapter(adapter, config = {}) {
            return new HttpClient({
                ...config,
                customAdapter: adapter,
            });
        }
    }
    /**
     * 创建默认的HTTP客户端实例
     */
    function createHttpClient$1(config = {}) {
        return HttpClient.create(config);
    }
    /**
     * 创建Fetch HTTP客户端实例
     */
    function createFetchHttpClient(config = {}) {
        return HttpClient.createWithAdapter('fetch', config);
    }
    /**
     * 创建Axios HTTP客户端实例
     */
    function createAxiosHttpClient(config = {}) {
        return HttpClient.createWithAdapter('axios', config);
    }
    /**
     * 创建Alova HTTP客户端实例
     */
    function createAlovaHttpClient(config = {}) {
        return HttpClient.createWithAdapter('alova', config);
    }

    /**
     * 缓存插件
     * 提供请求缓存功能
     */
    /**
     * 内存缓存存储
     */
    class MemoryCacheStorage {
        constructor() {
            Object.defineProperty(this, "cache", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: new Map()
            });
        }
        async get(key) {
            const item = this.cache.get(key);
            if (!item)
                return null;
            if (Date.now() > item.expiry) {
                this.cache.delete(key);
                return null;
            }
            return item.value;
        }
        async set(key, value, ttl = 5 * 60 * 1000) {
            const expiry = Date.now() + ttl;
            this.cache.set(key, { value, expiry });
        }
        async delete(key) {
            this.cache.delete(key);
        }
        async clear() {
            this.cache.clear();
        }
        /**
         * 获取缓存大小
         */
        size() {
            return this.cache.size;
        }
        /**
         * 清理过期缓存
         */
        cleanup() {
            const now = Date.now();
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiry) {
                    this.cache.delete(key);
                }
            }
        }
    }
    /**
     * LocalStorage缓存存储
     */
    class LocalStorageCacheStorage {
        constructor(prefix = 'http_cache_') {
            Object.defineProperty(this, "prefix", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.prefix = prefix;
        }
        async get(key) {
            try {
                const item = localStorage.getItem(this.prefix + key);
                if (!item)
                    return null;
                const parsed = JSON.parse(item);
                if (Date.now() > parsed.expiry) {
                    localStorage.removeItem(this.prefix + key);
                    return null;
                }
                return parsed.value;
            }
            catch {
                return null;
            }
        }
        async set(key, value, ttl = 5 * 60 * 1000) {
            try {
                const expiry = Date.now() + ttl;
                const item = { value, expiry };
                localStorage.setItem(this.prefix + key, JSON.stringify(item));
            }
            catch (error) {
                console.warn('Failed to set cache in localStorage:', error);
            }
        }
        async delete(key) {
            localStorage.removeItem(this.prefix + key);
        }
        async clear() {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
    /**
     * SessionStorage缓存存储
     */
    class SessionStorageCacheStorage {
        constructor(prefix = 'http_cache_') {
            Object.defineProperty(this, "prefix", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.prefix = prefix;
        }
        async get(key) {
            try {
                const item = sessionStorage.getItem(this.prefix + key);
                if (!item)
                    return null;
                const parsed = JSON.parse(item);
                if (Date.now() > parsed.expiry) {
                    sessionStorage.removeItem(this.prefix + key);
                    return null;
                }
                return parsed.value;
            }
            catch {
                return null;
            }
        }
        async set(key, value, ttl = 5 * 60 * 1000) {
            try {
                const expiry = Date.now() + ttl;
                const item = { value, expiry };
                sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
            }
            catch (error) {
                console.warn('Failed to set cache in sessionStorage:', error);
            }
        }
        async delete(key) {
            sessionStorage.removeItem(this.prefix + key);
        }
        async clear() {
            const keys = Object.keys(sessionStorage);
            keys.forEach((key) => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        }
    }
    /**
     * 缓存管理器
     */
    class CacheManager {
        constructor(config = {}) {
            Object.defineProperty(this, "storage", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.config = {
                enabled: true,
                ttl: 5 * 60 * 1000, // 5分钟
                keyGenerator: this.defaultKeyGenerator,
                storage: new MemoryCacheStorage(),
                ...config,
            };
            this.storage = this.config.storage;
        }
        /**
         * 默认缓存键生成器
         */
        defaultKeyGenerator(config) {
            const { url, method = 'GET', params, data } = config;
            const key = `${method.toUpperCase()}:${url}`;
            if (params && Object.keys(params).length > 0) {
                const sortedParams = Object.keys(params)
                    .sort()
                    .map(k => `${k}=${params[k]}`)
                    .join('&');
                return `${key}?${sortedParams}`;
            }
            if (data && method.toUpperCase() !== 'GET') {
                const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
                return `${key}:${this.hashCode(dataStr)}`;
            }
            return key;
        }
        /**
         * 简单哈希函数
         */
        hashCode(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // 转换为32位整数
            }
            return hash.toString(36);
        }
        /**
         * 获取缓存
         */
        async get(config) {
            if (!this.config.enabled)
                return null;
            const key = this.config.keyGenerator(config);
            return await this.storage.get(key);
        }
        /**
         * 设置缓存
         */
        async set(config, response) {
            if (!this.config.enabled)
                return;
            const key = this.config.keyGenerator(config);
            await this.storage.set(key, response, this.config.ttl);
        }
        /**
         * 删除缓存
         */
        async delete(config) {
            const key = this.config.keyGenerator(config);
            await this.storage.delete(key);
        }
        /**
         * 清空所有缓存
         */
        async clear() {
            await this.storage.clear();
        }
        /**
         * 更新配置
         */
        updateConfig(config) {
            this.config = { ...this.config, ...config };
            if (config.storage) {
                this.storage = config.storage;
            }
        }
        /**
         * 获取配置
         */
        getConfig() {
            return { ...this.config };
        }
    }
    /**
     * 缓存插件
     */
    function createCachePlugin$1(config = {}) {
        return {
            name: 'cache',
            install(client) {
                const cacheManager = new CacheManager(config);
                // 添加请求拦截器检查缓存
                client.addRequestInterceptor({
                    onFulfilled: async (requestConfig) => {
                        // 只缓存GET请求
                        if (requestConfig.method?.toUpperCase() === 'GET') {
                            const cached = await cacheManager.get(requestConfig);
                            if (cached) {
                                // 直接返回缓存的响应
                                throw { __cached: true, response: cached };
                            }
                        }
                        return requestConfig;
                    },
                });
                // 添加响应拦截器设置缓存
                client.addResponseInterceptor({
                    onFulfilled: async (response) => {
                        // 只缓存成功的GET请求
                        if (response.config.method?.toUpperCase() === 'GET' && response.status >= 200 && response.status < 300) {
                            await cacheManager.set(response.config, response);
                        }
                        return response;
                    },
                    onRejected: (error) => {
                        // 处理缓存命中的情况
                        if (error.__cached) {
                            return Promise.resolve(error.response);
                        }
                        return Promise.reject(error);
                    },
                });
                client.cache = {
                    clear: () => cacheManager.clear(),
                    delete: (config) => cacheManager.delete(config),
                    updateConfig: (newConfig) => cacheManager.updateConfig(newConfig),
                    getConfig: () => cacheManager.getConfig(),
                };
            },
        };
    }
    /**
     * 创建内存缓存存储
     */
    function createMemoryCache() {
        return new MemoryCacheStorage();
    }
    /**
     * 创建LocalStorage缓存存储
     */
    function createLocalStorageCache(prefix) {
        return new LocalStorageCacheStorage(prefix);
    }
    /**
     * 创建SessionStorage缓存存储
     */
    function createSessionStorageCache(prefix) {
        return new SessionStorageCacheStorage(prefix);
    }

    /**
     * 重试插件
     * 提供请求重试功能
     */
    /**
     * 重试策略枚举
     */
    exports.RetryStrategy = void 0;
    (function (RetryStrategy) {
        /** 固定延迟 */
        RetryStrategy["FIXED"] = "fixed";
        /** 指数退避 */
        RetryStrategy["EXPONENTIAL"] = "exponential";
        /** 线性增长 */
        RetryStrategy["LINEAR"] = "linear";
        /** 自定义 */
        RetryStrategy["CUSTOM"] = "custom";
    })(exports.RetryStrategy || (exports.RetryStrategy = {}));
    /**
     * 重试管理器
     */
    class RetryManager {
        constructor(config = {}) {
            Object.defineProperty(this, "config", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.config = {
                retries: 3,
                retryDelay: 1000,
                strategy: exports.RetryStrategy.EXPONENTIAL,
                maxDelay: 30000,
                jitter: 0.1,
                retryCondition: this.defaultRetryCondition,
                retryDelayCalculator: this.createDelayCalculator(),
                onRetry: () => { },
                onRetryFailed: () => { },
                ...config,
            };
            // 如果没有提供自定义延迟计算器，根据策略创建
            if (!config.retryDelayCalculator) {
                this.config.retryDelayCalculator = this.createDelayCalculator();
            }
        }
        /**
         * 默认重试条件
         */
        defaultRetryCondition(error) {
            // 网络错误或5xx服务器错误才重试
            if (error.isNetworkError || error.isTimeoutError) {
                return true;
            }
            if (error.response) {
                const status = error.response.status;
                return status >= 500 && status < 600;
            }
            return false;
        }
        /**
         * 创建延迟计算器
         */
        createDelayCalculator() {
            return (retryCount, error) => {
                let delay;
                switch (this.config.strategy) {
                    case exports.RetryStrategy.FIXED:
                        delay = this.config.retryDelay;
                        break;
                    case exports.RetryStrategy.LINEAR:
                        delay = this.config.retryDelay * retryCount;
                        break;
                    case exports.RetryStrategy.EXPONENTIAL:
                        delay = this.config.retryDelay * 2 ** (retryCount - 1);
                        break;
                    default:
                        delay = this.config.retryDelay;
                }
                // 应用最大延迟限制
                delay = Math.min(delay, this.config.maxDelay);
                // 添加抖动
                if (this.config.jitter > 0) {
                    const jitterAmount = delay * this.config.jitter;
                    const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
                    delay += randomJitter;
                }
                return Math.max(0, Math.round(delay));
            };
        }
        /**
         * 执行重试
         */
        async executeWithRetry(requestFn, config) {
            let lastError;
            let retryCount = 0;
            while (retryCount <= this.config.retries) {
                try {
                    return await requestFn();
                }
                catch (error) {
                    lastError = error;
                    // 如果不满足重试条件或已达到最大重试次数，直接抛出错误
                    if (retryCount >= this.config.retries || !this.config.retryCondition(lastError)) {
                        if (retryCount > 0) {
                            this.config.onRetryFailed(lastError, retryCount);
                        }
                        throw lastError;
                    }
                    retryCount++;
                    // 触发重试回调
                    this.config.onRetry(lastError, retryCount);
                    // 计算延迟时间
                    const delay = this.config.retryDelayCalculator(retryCount, lastError);
                    // 等待延迟
                    if (delay > 0) {
                        await this.delay(delay);
                    }
                }
            }
            throw lastError;
        }
        /**
         * 延迟函数
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        /**
         * 更新配置
         */
        updateConfig(config) {
            this.config = { ...this.config, ...config };
            // 如果策略改变了，重新创建延迟计算器
            if (config.strategy && !config.retryDelayCalculator) {
                this.config.retryDelayCalculator = this.createDelayCalculator();
            }
        }
        /**
         * 获取配置
         */
        getConfig() {
            return { ...this.config };
        }
    }
    /**
     * 重试插件
     */
    function createRetryPlugin$1(config = {}) {
        return {
            name: 'retry',
            install(client) {
                const retryManager = new RetryManager(config);
                // 保存原始请求方法
                const originalRequest = client.request.bind(client);
                // 重写请求方法以支持重试
                client.request = async function (requestConfig) {
                    return retryManager.executeWithRetry(() => originalRequest(requestConfig), requestConfig);
                };
                client.retry = {
                    updateConfig: (newConfig) => retryManager.updateConfig(newConfig),
                    getConfig: () => retryManager.getConfig(),
                };
            },
        };
    }
    /**
     * 创建固定延迟重试配置
     */
    function createFixedRetryConfig(retries = 3, delay = 1000) {
        return {
            retries,
            retryDelay: delay,
            strategy: exports.RetryStrategy.FIXED,
        };
    }
    /**
     * 创建指数退避重试配置
     */
    function createExponentialRetryConfig(retries = 3, initialDelay = 1000, maxDelay = 30000) {
        return {
            retries,
            retryDelay: initialDelay,
            strategy: exports.RetryStrategy.EXPONENTIAL,
            maxDelay,
        };
    }
    /**
     * 创建线性增长重试配置
     */
    function createLinearRetryConfig(retries = 3, delay = 1000) {
        return {
            retries,
            retryDelay: delay,
            strategy: exports.RetryStrategy.LINEAR,
        };
    }
    /**
     * 创建自定义重试配置
     */
    function createCustomRetryConfig(retries, delayCalculator, retryCondition) {
        return {
            retries,
            strategy: exports.RetryStrategy.CUSTOM,
            retryDelayCalculator: delayCalculator,
            retryCondition,
        };
    }

    /**
     * 拦截器插件
     * 提供常用的请求和响应拦截器
     */
    /**
     * 创建认证拦截器
     */
    function createAuthInterceptor$1(config) {
        const { getToken, tokenType = 'Bearer', headerName = 'Authorization', urlPatterns = [], } = config;
        return {
            onFulfilled: async (requestConfig) => {
                // 检查是否需要认证
                if (urlPatterns.length > 0) {
                    const needsAuth = urlPatterns.some(pattern => pattern.test(requestConfig.url));
                    if (!needsAuth) {
                        return requestConfig;
                    }
                }
                try {
                    const token = await getToken();
                    if (token) {
                        requestConfig.headers = {
                            ...requestConfig.headers,
                            [headerName]: `${tokenType} ${token}`,
                        };
                    }
                }
                catch (error) {
                    console.warn('Failed to get auth token:', error);
                }
                return requestConfig;
            },
        };
    }
    /**
     * 创建token刷新拦截器
     */
    function createTokenRefreshInterceptor(config) {
        const { refreshToken, getToken, tokenType = 'Bearer', headerName = 'Authorization' } = config;
        return {
            onRejected: async (error) => {
                const originalRequest = error.config;
                // 检查是否是401错误且有刷新token的方法
                if (error.response?.status === 401 && refreshToken && originalRequest) {
                    try {
                        // 刷新token
                        const newToken = await refreshToken();
                        // 更新请求头
                        originalRequest.headers = {
                            ...originalRequest.headers,
                            [headerName]: `${tokenType} ${newToken}`,
                        };
                        // 重新发送请求（这里需要客户端实例，实际使用时需要传入）
                        // 这是一个简化版本，实际实现可能需要更复杂的逻辑
                        return Promise.reject(error); // 暂时还是拒绝，让上层处理
                    }
                    catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        return Promise.reject(error);
                    }
                }
                return Promise.reject(error);
            },
        };
    }
    /**
     * 创建日志拦截器
     */
    function createLogInterceptor$1(config = {}) {
        const { logRequests = true, logResponses = true, logErrors = true, logger = console, } = config;
        const requestInterceptor = {
            onFulfilled: (requestConfig) => {
                if (logRequests) {
                    logger.info(`🚀 HTTP Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`, {
                        headers: requestConfig.headers,
                        params: requestConfig.params,
                        data: requestConfig.data,
                    });
                }
                return requestConfig;
            },
            onRejected: (error) => {
                if (logErrors) {
                    logger.error('❌ Request Error:', error);
                }
                return Promise.reject(error);
            },
        };
        const responseInterceptor = {
            onFulfilled: (response) => {
                if (logResponses) {
                    logger.info(`✅ HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        data: response.data,
                    });
                }
                return response;
            },
            onRejected: (error) => {
                if (logErrors) {
                    logger.error(`❌ HTTP Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                        message: error.message,
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                    });
                }
                return Promise.reject(error);
            },
        };
        return {
            request: requestInterceptor,
            response: responseInterceptor,
        };
    }
    /**
     * 创建基础URL拦截器
     */
    function createBaseURLInterceptor(baseURL) {
        return {
            onFulfilled: (requestConfig) => {
                if (!requestConfig.baseURL && !isAbsoluteURL(requestConfig.url)) {
                    requestConfig.baseURL = baseURL;
                }
                return requestConfig;
            },
        };
    }
    /**
     * 创建超时拦截器
     */
    function createTimeoutInterceptor(timeout) {
        return {
            onFulfilled: (requestConfig) => {
                if (!requestConfig.timeout) {
                    requestConfig.timeout = timeout;
                }
                return requestConfig;
            },
        };
    }
    /**
     * 创建内容类型拦截器
     */
    function createContentTypeInterceptor(contentType = 'application/json') {
        return {
            onFulfilled: (requestConfig) => {
                if (requestConfig.data && !requestConfig.headers?.['Content-Type'] && !requestConfig.headers?.['content-type']) {
                    requestConfig.headers = {
                        ...requestConfig.headers,
                        'Content-Type': contentType,
                    };
                }
                return requestConfig;
            },
        };
    }
    /**
     * 创建错误处理拦截器
     */
    function createErrorHandlerInterceptor(errorHandler) {
        return {
            onRejected: async (error) => {
                try {
                    await errorHandler(error);
                }
                catch (handlerError) {
                    console.error('Error in error handler:', handlerError);
                }
                return Promise.reject(error);
            },
        };
    }
    /**
     * 创建响应转换拦截器
     */
    function createResponseTransformInterceptor(transformer) {
        return {
            onFulfilled: (response) => {
                try {
                    response.data = transformer(response.data);
                }
                catch (error) {
                    console.error('Error in response transformer:', error);
                }
                return response;
            },
        };
    }
    /**
     * 创建请求ID拦截器
     */
    function createRequestIdInterceptor(headerName = 'X-Request-ID') {
        return {
            onFulfilled: (requestConfig) => {
                if (!requestConfig.headers?.[headerName]) {
                    requestConfig.headers = {
                        ...requestConfig.headers,
                        [headerName]: generateRequestId(),
                    };
                }
                return requestConfig;
            },
        };
    }
    /**
     * 拦截器插件
     */
    function createInterceptorsPlugin(interceptors) {
        return {
            name: 'interceptors',
            install(client) {
                // 添加请求拦截器
                if (interceptors.request) {
                    interceptors.request.forEach((interceptor) => {
                        client.addRequestInterceptor(interceptor);
                    });
                }
                // 添加响应拦截器
                if (interceptors.response) {
                    interceptors.response.forEach((interceptor) => {
                        client.addResponseInterceptor(interceptor);
                    });
                }
            },
        };
    }
    /**
     * 工具函数：检查是否为绝对URL
     */
    function isAbsoluteURL(url) {
        return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
    }
    /**
     * 工具函数：生成请求ID
     */
    function generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Vue3集成
     * 提供Vue3的组合式函数和插件
     */
    // 注入键
    const HTTP_CLIENT_KEY = Symbol('httpClient');
    /**
     * 创建HTTP插件
     */
    function createHttpPlugin(config = {}) {
        return {
            install(app, options = {}) {
                const mergedConfig = { ...config, ...options };
                const httpClient = createHttpClient$1(mergedConfig);
                // 提供HTTP客户端实例
                app.provide(HTTP_CLIENT_KEY, httpClient);
                // 全局属性
                app.config.globalProperties.$http = httpClient;
            },
        };
    }
    /**
     * 使用HTTP客户端
     */
    function useHttp() {
        const httpClient = vue.inject(HTTP_CLIENT_KEY);
        if (!httpClient) {
            throw new Error('HTTP client not found. Please install the HTTP plugin first.');
        }
        return httpClient;
    }
    /**
     * 使用请求
     */
    function useRequest(url, options = {}) {
        const httpClient = useHttp();
        const { immediate = true, initialData = null, onSuccess, onError, onFinally, resetOnExecute = true, ...requestConfig } = options;
        // 状态
        const data = vue.ref(initialData);
        const loading = vue.ref(false);
        const error = vue.ref(null);
        const finished = vue.ref(false);
        const cancelled = vue.ref(false);
        // 取消令牌
        let cancelToken = null;
        // 最后一次请求配置
        let lastConfig = null;
        /**
         * 执行请求
         */
        const execute = async (config = {}) => {
            const requestUrl = typeof url === 'function' ? url() : url;
            // 重置状态
            if (resetOnExecute) {
                error.value = null;
                cancelled.value = false;
            }
            loading.value = true;
            finished.value = false;
            // 取消之前的请求
            if (cancelToken) {
                cancelToken.cancel('New request initiated');
            }
            // 创建新的取消令牌
            cancelToken = httpClient.createCancelToken();
            // 合并配置
            const mergedConfig = {
                ...requestConfig,
                ...config,
                url: requestUrl,
                cancelToken,
            };
            lastConfig = mergedConfig;
            try {
                const response = await httpClient.request(mergedConfig);
                if (!cancelled.value) {
                    data.value = response.data;
                    error.value = null;
                    onSuccess?.(response.data, response);
                }
                return response;
            }
            catch (err) {
                if (!cancelled.value) {
                    const httpError = err;
                    error.value = httpError;
                    if (httpError.isCancelError) {
                        cancelled.value = true;
                    }
                    else {
                        onError?.(httpError);
                    }
                }
                throw err;
            }
            finally {
                if (!cancelled.value) {
                    loading.value = false;
                    finished.value = true;
                    onFinally?.();
                }
            }
        };
        /**
         * 取消请求
         */
        const cancel = () => {
            if (cancelToken) {
                cancelToken.cancel('Request cancelled by user');
                cancelled.value = true;
                loading.value = false;
                finished.value = true;
            }
        };
        /**
         * 重置状态
         */
        const reset = () => {
            data.value = initialData;
            loading.value = false;
            error.value = null;
            finished.value = false;
            cancelled.value = false;
            cancelToken = null;
            lastConfig = null;
        };
        /**
         * 刷新（重新执行上次请求）
         */
        const refresh = async () => {
            if (!lastConfig) {
                throw new Error('No previous request to refresh');
            }
            return execute(lastConfig);
        };
        // 组件卸载时取消请求
        vue.onUnmounted(() => {
            cancel();
        });
        // 立即执行
        if (immediate) {
            execute();
        }
        return {
            data,
            loading,
            error,
            finished,
            cancelled,
            execute,
            cancel,
            reset,
            refresh,
        };
    }
    /**
     * 使用GET请求
     */
    function useGet(url, options = {}) {
        return useRequest(url, { ...options, method: 'GET' });
    }
    /**
     * 使用POST请求
     */
    function usePost(url, options = {}) {
        return useRequest(url, { ...options, method: 'POST', immediate: false });
    }
    /**
     * 使用PUT请求
     */
    function usePut(url, options = {}) {
        return useRequest(url, { ...options, method: 'PUT', immediate: false });
    }
    /**
     * 使用DELETE请求
     */
    function useDelete(url, options = {}) {
        return useRequest(url, { ...options, method: 'DELETE', immediate: false });
    }

    /**
     * @ldesign/http - 功能强大的HTTP请求库
     * 支持多种适配器：原生fetch、axios、alova
     * 支持Vue3集成，可扩展到其他框架
     */
    // 核心类和函数
    // 默认实例
    const defaultClient = createHttpClient();
    /**
     * 默认HTTP客户端实例的便捷方法
     */
    const http = {
        // HTTP方法
        get: defaultClient.get.bind(defaultClient),
        post: defaultClient.post.bind(defaultClient),
        put: defaultClient.put.bind(defaultClient),
        delete: defaultClient.delete.bind(defaultClient),
        patch: defaultClient.patch.bind(defaultClient),
        head: defaultClient.head.bind(defaultClient),
        options: defaultClient.options.bind(defaultClient),
        request: defaultClient.request.bind(defaultClient),
        // 拦截器
        addRequestInterceptor: defaultClient.addRequestInterceptor.bind(defaultClient),
        addResponseInterceptor: defaultClient.addResponseInterceptor.bind(defaultClient),
        removeInterceptor: defaultClient.removeInterceptor.bind(defaultClient),
        // 配置
        getDefaults: defaultClient.getDefaults.bind(defaultClient),
        setDefaults: defaultClient.setDefaults.bind(defaultClient),
        // 取消令牌
        createCancelToken: defaultClient.createCancelToken.bind(defaultClient),
        // 事件
        on: defaultClient.on.bind(defaultClient),
        off: defaultClient.off.bind(defaultClient),
        emit: defaultClient.emit.bind(defaultClient),
        once: defaultClient.once.bind(defaultClient),
        // 获取客户端实例
        getInstance: () => defaultClient,
    };
    /**
     * 创建新的HTTP客户端实例
     */
    function create(config) {
        return createHttpClient(config);
    }
    /**
     * 快速创建带有常用配置的HTTP客户端
     */
    function createQuickClient(options) {
        const { baseURL, timeout = 10000, adapter = 'fetch', enableCache = false, enableRetry = false, enableLog = false, authToken, } = options;
        const config = {
            baseURL,
            timeout,
            adapter,
        };
        const client = createHttpClient(config);
        // 启用缓存
        if (enableCache) {
            const cachePlugin = createCachePlugin({
                enabled: true,
                ttl: 5 * 60 * 1000, // 5分钟
            });
            cachePlugin.install(client);
        }
        // 启用重试
        if (enableRetry) {
            const retryPlugin = createRetryPlugin({
                retries: 3,
                retryDelay: 1000,
                strategy: RetryStrategy.EXPONENTIAL,
            });
            retryPlugin.install(client);
        }
        // 启用日志
        if (enableLog) {
            const logInterceptors = createLogInterceptor({
                logRequests: true,
                logResponses: true,
                logErrors: true,
            });
            client.addRequestInterceptor(logInterceptors.request);
            client.addResponseInterceptor(logInterceptors.response);
        }
        // 添加认证
        if (authToken) {
            const authInterceptor = createAuthInterceptor({
                getToken: typeof authToken === 'string' ? () => authToken : authToken,
            });
            client.addRequestInterceptor(authInterceptor);
        }
        return client;
    }

    exports.AlovaAdapter = AlovaAdapter;
    exports.AxiosAdapter = AxiosAdapter;
    exports.BaseHttpClient = BaseHttpClient;
    exports.CacheManager = CacheManager;
    exports.FetchAdapter = FetchAdapter;
    exports.HTTP_CLIENT_KEY = HTTP_CLIENT_KEY;
    exports.HttpClient = HttpClient;
    exports.LocalStorageCacheStorage = LocalStorageCacheStorage;
    exports.MemoryCacheStorage = MemoryCacheStorage;
    exports.RetryManager = RetryManager;
    exports.SessionStorageCacheStorage = SessionStorageCacheStorage;
    exports.create = create;
    exports.createAlovaAdapter = createAlovaAdapter;
    exports.createAlovaHttpClient = createAlovaHttpClient;
    exports.createAuthInterceptor = createAuthInterceptor$1;
    exports.createAxiosAdapter = createAxiosAdapter;
    exports.createAxiosHttpClient = createAxiosHttpClient;
    exports.createBaseURLInterceptor = createBaseURLInterceptor;
    exports.createCachePlugin = createCachePlugin$1;
    exports.createContentTypeInterceptor = createContentTypeInterceptor;
    exports.createCustomRetryConfig = createCustomRetryConfig;
    exports.createErrorHandlerInterceptor = createErrorHandlerInterceptor;
    exports.createExponentialRetryConfig = createExponentialRetryConfig;
    exports.createFetchAdapter = createFetchAdapter;
    exports.createFetchHttpClient = createFetchHttpClient;
    exports.createFixedRetryConfig = createFixedRetryConfig;
    exports.createHttpClient = createHttpClient$1;
    exports.createHttpPlugin = createHttpPlugin;
    exports.createInterceptorsPlugin = createInterceptorsPlugin;
    exports.createLinearRetryConfig = createLinearRetryConfig;
    exports.createLocalStorageCache = createLocalStorageCache;
    exports.createLogInterceptor = createLogInterceptor$1;
    exports.createMemoryCache = createMemoryCache;
    exports.createQuickClient = createQuickClient;
    exports.createRequestIdInterceptor = createRequestIdInterceptor;
    exports.createResponseTransformInterceptor = createResponseTransformInterceptor;
    exports.createRetryPlugin = createRetryPlugin$1;
    exports.createSessionStorageCache = createSessionStorageCache;
    exports.createTimeoutInterceptor = createTimeoutInterceptor;
    exports.createTokenRefreshInterceptor = createTokenRefreshInterceptor;
    exports.default = http;
    exports.http = http;
    exports.isAlovaSupported = isAlovaSupported;
    exports.isAxiosSupported = isAxiosSupported;
    exports.isFetchSupported = isFetchSupported$1;
    exports.useDelete = useDelete;
    exports.useGet = useGet;
    exports.useHttp = useHttp;
    exports.usePost = usePost;
    exports.usePut = usePut;
    exports.useRequest = useRequest;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.js.map
