/**
 * 测试所有包的构建流程
 */

import { execSync } from 'child_process'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🏗️  开始测试构建流程...\n')

const packagesDir = join(process.cwd(), 'packages')
const packages = ['core', 'vue', 'react', 'solid', 'svelte']

let successCount = 0
let failCount = 0
const errors = []

for (const pkg of packages) {
  const pkgPath = join(packagesDir, pkg)

  if (!existsSync(pkgPath)) {
    console.log(`⏭️  跳过 ${pkg} (目录不存在)\n`)
    continue
  }

  try {
    console.log(`📦 正在构建 @ldesign/http-${pkg}...`)
    execSync('pnpm build', {
      cwd: pkgPath,
      stdio: 'pipe',
    })
    console.log(`✅ @ldesign/http-${pkg} 构建成功!\n`)
    successCount++
  }
  catch (error) {
    console.error(`❌ @ldesign/http-${pkg} 构建失败!`)
    console.error(`   错误: ${error.message}\n`)
    errors.push({ pkg, error: error.message })
    failCount++
  }
}

console.log('='.repeat(60))
console.log(`\n📊 构建总结:`)
console.log(`   ✅ 成功: ${successCount} 个`)
console.log(`   ❌ 失败: ${failCount} 个`)
console.log(`   📦 总计: ${successCount + failCount} 个\n`)

if (errors.length > 0) {
  console.log('❌ 构建失败的包:')
  errors.forEach(({ pkg, error }) => {
    console.log(`   - @ldesign/http-${pkg}`)
    console.log(`     ${error.split('\n')[0]}`)
  })
  console.log('')
  process.exit(1)
}
else {
  console.log('🎉 所有包构建成功!')
}

