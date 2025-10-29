/**
 * 批量构建所有子包的脚本
 */

import { execSync } from 'child_process'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const packagesDir = join(process.cwd(), 'packages')

console.log('🚀 开始构建所有子包...\n')

// 获取所有子包
const packages = readdirSync(packagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)

let successCount = 0
let failCount = 0

// 构建每个子包
for (const pkg of packages) {
  const pkgPath = join(packagesDir, pkg)
  const packageJsonPath = join(pkgPath, 'package.json')

  // 检查是否有 package.json
  if (!existsSync(packageJsonPath)) {
    console.log(`⏭️  跳过 ${pkg} (没有 package.json)\n`)
    continue
  }

  try {
    console.log(`📦 正在构建 @ldesign/${pkg}...`)
    execSync('pnpm build', {
      cwd: pkgPath,
      stdio: 'inherit',
    })
    console.log(`✅ @ldesign/${pkg} 构建成功!\n`)
    successCount++
  }
  catch (error) {
    console.error(`❌ @ldesign/${pkg} 构建失败!\n`)
    failCount++
  }
}

// 输出总结
console.log('='.repeat(50))
console.log(`\n📊 构建总结:`)
console.log(`   ✅ 成功: ${successCount} 个`)
console.log(`   ❌ 失败: ${failCount} 个`)
console.log(`   📦 总计: ${successCount + failCount} 个\n`)

if (failCount > 0) {
  process.exit(1)
}


