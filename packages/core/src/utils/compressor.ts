/**
 * 轻量级数据压缩工具
 * 
 * 使用简单的压缩算法减少缓存数据的内存占用
 * 适用于浏览器环境，不依赖第三方库
 */

/**
 * 压缩接口
 */
export interface Compressor {
  /**
   * 压缩数据
   */
  compress(data: unknown): Promise<string> | string

  /**
   * 解压数据
   */
  decompress(compressed: string): Promise<unknown> | unknown

  /**
   * 估算压缩率
   */
  estimateRatio(data: unknown): number
}

/**
 * LZ-String 简化版压缩器
 * 
 * 基于 LZ 算法的轻量级压缩实现
 * 适合压缩 JSON 数据
 */
export class SimpleLZCompressor implements Compressor {
  /**
   * 压缩字符串
   */
  compress(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return this.compressString(str)
  }

  /**
   * 解压字符串
   */
  decompress(compressed: string): unknown {
    try {
      const str = this.decompressString(compressed)
      // 尝试解析为 JSON
      try {
        return JSON.parse(str)
      }
      catch {
        // 如果不是 JSON，返回原字符串
        return str
      }
    }
    catch {
      return null
    }
  }

  /**
   * 估算压缩率
   */
  estimateRatio(data: unknown): number {
    const original = typeof data === 'string' ? data : JSON.stringify(data)
    const compressed = this.compress(data)
    return compressed.length / original.length
  }

  /**
   * 压缩字符串（简化的 LZ 算法）
   */
  private compressString(str: string): string {
    if (!str || str.length === 0) {
      return ''
    }

    const dict = new Map<string, number>()
    let dictSize = 256
    let w = ''
    const result: number[] = []

    for (let i = 0; i < str.length; i++) {
      const c = str[i]!
      const wc = w + c

      if (dict.has(wc)) {
        w = wc
      }
      else {
        // 输出 w 的编码
        if (w.length === 0) {
          result.push(c.charCodeAt(0))
        }
        else if (dict.has(w)) {
          result.push(dict.get(w)!)
        }
        else {
          result.push(w.charCodeAt(0))
        }

        // 添加到字典
        if (dictSize < 65536) {
          dict.set(wc, dictSize++)
        }

        w = c
      }
    }

    // 输出最后的 w
    if (w.length > 0) {
      if (dict.has(w)) {
        result.push(dict.get(w)!)
      }
      else {
        result.push(w.charCodeAt(0))
      }
    }

    // 将数字数组转换为字符串
    return this.arrayToString(result)
  }

  /**
   * 解压字符串
   */
  private decompressString(compressed: string): string {
    if (!compressed || compressed.length === 0) {
      return ''
    }

    const codes = this.stringToArray(compressed)
    const dict = new Map<number, string>()
    let dictSize = 256

    const result: string[] = []
    let w = String.fromCharCode(codes[0]!)
    result.push(w)

    for (let i = 1; i < codes.length; i++) {
      const k = codes[i]!
      let entry: string

      if (dict.has(k)) {
        entry = dict.get(k)!
      }
      else if (k === dictSize) {
        entry = w + w[0]!
      }
      else {
        entry = String.fromCharCode(k)
      }

      result.push(entry)

      // 添加到字典
      if (dictSize < 65536) {
        dict.set(dictSize++, w + entry[0]!)
      }

      w = entry
    }

    return result.join('')
  }

  /**
   * 数字数组转字符串（使用 Base64）
   */
  private arrayToString(arr: number[]): string {
    // 使用更紧凑的编码
    const chars: string[] = []
    for (let i = 0; i < arr.length; i++) {
      chars.push(String.fromCharCode(arr[i]!))
    }
    return btoa(chars.join(''))
  }

  /**
   * 字符串转数字数组
   */
  private stringToArray(str: string): number[] {
    const decoded = atob(str)
    const arr: number[] = []
    for (let i = 0; i < decoded.length; i++) {
      arr.push(decoded.charCodeAt(i))
    }
    return arr
  }
}

/**
 * 无压缩器（直接存储）
 */
export class NoCompressor implements Compressor {
  compress(data: unknown): string {
    return typeof data === 'string' ? data : JSON.stringify(data)
  }

  decompress(compressed: string): unknown {
    try {
      return JSON.parse(compressed)
    }
    catch {
      return compressed
    }
  }

  estimateRatio(_data: unknown): number {
    return 1.0 // 无压缩
  }
}

/**
 * 创建压缩器
 */
export function createCompressor(type: 'lz' | 'none' = 'lz'): Compressor {
  switch (type) {
    case 'lz':
      return new SimpleLZCompressor()
    case 'none':
      return new NoCompressor()
    default:
      return new NoCompressor()
  }
}

/**
 * 默认压缩器
 */
export const defaultCompressor = createCompressor('lz')

