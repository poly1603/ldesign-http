/**
 * 批量构建所有子包的脚本
 */

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packagesDir = path.join(__dirname, '..', 'packages')

// 获取所有包目录
const packages = fs.readdirSync(packagesDir).filter((dir) => {
  const packagePath = path.join(packagesDir, dir)
  return fs.statSync(packagePath).isDirectory()
    && fs.existsSync(path.join(packagePath, 'package.json'))
})

console.log(`Found ${packages.length} packages to build:\n`)
packages.forEach(pkg => console.log(`  - ${pkg}`))
console.log()

// 按依赖顺序排序（core必须先构建）
const sortedPackages = ['core', ...packages.filter(p => p !== 'core')]

let successCount = 0
let failCount = 0

for (const pkg of sortedPackages) {
  const packagePath = path.join(packagesDir, pkg)
  console.log(`\n📦 Building @ldesign/http-${pkg}...`)

  try {
    // 切换到包目录并执行构建
    process.chdir(packagePath)
    execSync('pnpm build', {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    })
    console.log(`✓ @ldesign/http-${pkg} built successfully`)
    successCount++
  }
  catch (error) {
    console.error(`✗ Failed to build @ldesign/http-${pkg}`)
    failCount++
  }
}

console.log('\n' + '='.repeat(60))
console.log(`\nBuild Summary:`)
console.log(`  ✓ Success: ${successCount}`)
console.log(`  ✗ Failed: ${failCount}`)
console.log(`  Total: ${sortedPackages.length}`)
console.log('\n' + '='.repeat(60))

process.exit(failCount > 0 ? 1 : 0)
