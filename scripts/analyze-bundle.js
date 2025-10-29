/**
 * 分析打包产物大小的脚本
 */

import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const distDirs = ['es', 'lib', 'dist']

console.log('📊 分析打包产物大小...\n')

let totalSize = 0

for (const dir of distDirs) {
  if (!existsSync(dir)) {
    continue
  }

  console.log(`\n📁 ${dir}/`)
  console.log('='.repeat(50))

  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => {
      const filePath = join(dirent.path || dir, dirent.name)
      const stats = statSync(filePath)
      return {
        name: filePath.replace(dir + '/', ''),
        size: stats.size,
      }
    })
    .sort((a, b) => b.size - a.size)

  for (const file of files) {
    const sizeKB = (file.size / 1024).toFixed(2)
    console.log(`  ${file.name.padEnd(40)} ${sizeKB.padStart(8)} KB`)
    totalSize += file.size
  }

  const dirSize = files.reduce((sum, f) => sum + f.size, 0)
  console.log('='.repeat(50))
  console.log(`  总计: ${(dirSize / 1024).toFixed(2)} KB`)
}

console.log('\n' + '='.repeat(50))
console.log(`📦 整体大小: ${(totalSize / 1024).toFixed(2)} KB\n`)

function existsSync(path) {
  try {
    statSync(path)
    return true
  }
  catch {
    return false
  }
}


