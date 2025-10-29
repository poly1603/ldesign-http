/**
 * 将旧的 http-core 代码复制到新的 packages/core
 */

import { cpSync, existsSync } from 'fs'
import { join } from 'path'

console.log('📦 开始复制核心代码...\n')

const filesToCopy = [
  // 类型定义
  { from: 'packages/http-core/src/types', to: 'packages/core/src/types' },
  // 适配器
  { from: 'packages/http-adapters/src', to: 'packages/core/src/adapters' },
  // 客户端
  { from: 'packages/http-core/src/client.ts', to: 'packages/core/src/client.ts' },
  { from: 'packages/http-core/src/factory.ts', to: 'packages/core/src/factory.ts' },
]

filesToCopy.forEach(({ from, to }) => {
  if (existsSync(from)) {
    try {
      cpSync(from, to, { recursive: true })
      console.log(`✅ 复制: ${from} -> ${to}`)
    }
    catch (error) {
      console.log(`⚠️  跳过: ${from} (${error.message})`)
    }
  }
  else {
    console.log(`⏭️  跳过: ${from} (不存在)`)
  }
})

console.log('\n🎉 代码复制完成!')

