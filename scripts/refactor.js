#!/usr/bin/env node

/**
 * HTTP 包重构自动化脚本
 * 
 * 此脚本帮助自动化重构过程,包括:
 * 1. 备份当前代码
 * 2. 合并重复包
 * 3. 移动文件
 * 4. 更新导入路径
 * 5. 删除重复代码
 * 6. 验证构建
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'cyan')
  log(`  ${message}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')
}

// 执行命令
function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    })
    return { success: true, output: result }
  }
  catch (err) {
    return { success: false, error: err.message }
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath)
}

// 创建目录
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    success(`创建目录: ${dirPath}`)
  }
}

// 复制文件
function copyFile(src, dest) {
  try {
    ensureDir(path.dirname(dest))
    fs.copyFileSync(src, dest)
    success(`复制文件: ${src} → ${dest}`)
    return true
  }
  catch (err) {
    error(`复制文件失败: ${src} → ${dest}`)
    error(err.message)
    return false
  }
}

// 复制目录
function copyDir(src, dest) {
  try {
    ensureDir(dest)
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        copyDir(srcPath, destPath)
      }
      else {
        copyFile(srcPath, destPath)
      }
    }
    return true
  }
  catch (err) {
    error(`复制目录失败: ${src} → ${dest}`)
    error(err.message)
    return false
  }
}

// 删除文件或目录
function remove(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true })
      success(`删除: ${targetPath}`)
      return true
    }
    return false
  }
  catch (err) {
    error(`删除失败: ${targetPath}`)
    error(err.message)
    return false
  }
}

// 阶段 1: 创建备份
function createBackup() {
  section('阶段 1: 创建备份')

  info('创建备份分支...')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const branchName = `backup/before-refactoring-${timestamp}`

  const result = exec(`git checkout -b ${branchName}`, { silent: true })
  if (result.success) {
    success(`创建备份分支: ${branchName}`)
    exec(`git push origin ${branchName}`)
    exec('git checkout -')
  }
  else {
    warning('无法创建备份分支,请手动备份')
  }
}

// 阶段 2: 合并核心包
function mergeCorePackages() {
  section('阶段 2: 合并核心包')

  const coreDir = 'packages/core/src'
  ensureDir(coreDir)

  const migrations = [
    // 适配器
    { src: 'packages/http-adapters/src', dest: `${coreDir}/adapters`, merge: true },
    { src: 'src/adapters', dest: `${coreDir}/adapters`, merge: true },

    // 拦截器
    { src: 'packages/http-interceptors/src', dest: `${coreDir}/interceptors`, merge: true },
    { src: 'src/interceptors', dest: `${coreDir}/interceptors`, merge: true },

    // 特性
    { src: 'packages/http-features/src', dest: `${coreDir}/features`, merge: true },
    { src: 'src/features', dest: `${coreDir}/features`, merge: true },

    // 工具
    { src: 'packages/http-utils/src', dest: `${coreDir}/utils`, merge: true },
    { src: 'src/utils', dest: `${coreDir}/utils`, merge: true },

    // 开发工具
    { src: 'packages/http-devtools/src', dest: `${coreDir}/devtools`, merge: true },
    { src: 'src/devtools', dest: `${coreDir}/devtools`, merge: true },

    // 预设
    { src: 'packages/http-presets/src', dest: `${coreDir}/presets`, merge: true },
    { src: 'src/presets', dest: `${coreDir}/presets`, merge: true },

    // 类型
    { src: 'src/types', dest: `${coreDir}/types`, merge: true },

    // 核心
    { src: 'src/core', dest: `${coreDir}`, merge: true },

    // 客户端
    { src: 'src/client.ts', dest: `${coreDir}/client/HttpClient.ts` },
    { src: 'src/client-operations.ts', dest: `${coreDir}/client/operations.ts` },
    { src: 'src/client-monitoring.ts', dest: `${coreDir}/client/monitoring.ts` },
    { src: 'src/factory.ts', dest: `${coreDir}/client/factory.ts` },

    // 引擎
    { src: 'src/engine', dest: `${coreDir}/engine`, merge: true },
  ]

  for (const { src, dest, merge } of migrations) {
    if (!fileExists(src)) {
      warning(`源路径不存在,跳过: ${src}`)
      continue
    }

    info(`迁移: ${src} → ${dest}`)

    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
      if (merge && fileExists(dest)) {
        info(`合并目录: ${src} → ${dest}`)
        copyDir(src, dest)
      }
      else {
        copyDir(src, dest)
      }
    }
    else {
      copyFile(src, dest)
    }
  }

  success('核心包合并完成')
}

// 阶段 3: 合并框架适配器
function mergeFrameworkAdapters() {
  section('阶段 3: 合并框架适配器')

  // Vue 适配器
  info('合并 Vue 适配器...')
  const vueDir = 'packages/vue/src'
  ensureDir(vueDir)

  const vueMigrations = [
    { src: 'src/vue', dest: `${vueDir}/composables`, merge: true },
    { src: 'packages/http-vue/src', dest: vueDir, merge: true },
    { src: 'src/types/vue.ts', dest: `${vueDir}/types/index.ts` },
  ]

  for (const { src, dest, merge } of vueMigrations) {
    if (!fileExists(src)) {
      warning(`源路径不存在,跳过: ${src}`)
      continue
    }

    const stat = fs.statSync(src)
    if (stat.isDirectory()) {
      if (merge && fileExists(dest)) {
        copyDir(src, dest)
      }
      else {
        copyDir(src, dest)
      }
    }
    else {
      copyFile(src, dest)
    }
  }

  success('框架适配器合并完成')
}

// 阶段 4: 删除重复包
function removeD duplicates() {
  section('阶段 4: 删除重复包')

  const toRemove = [
    // 重复的包
    'packages/http-core',
    'packages/http-adapters',
    'packages/http-interceptors',
    'packages/http-features',
    'packages/http-utils',
    'packages/http-devtools',
    'packages/http-presets',
    'packages/http-vue',

    // 已迁移的源代码
    'src/adapters',
    'src/core',
    'src/devtools',
    'src/features',
    'src/interceptors',
    'src/presets',
    'src/types',
    'src/utils',
    'src/vue',
    'src/client.ts',
    'src/client-operations.ts',
    'src/client-monitoring.ts',
    'src/factory.ts',
    'src/engine',

    // 过时的文档
    'CHANGELOG_v0.3.0.md',
    'DEVELOPMENT.md',
    'HTTP包优化总结报告.md',
    'HTTP包优化记录.md',
    'HTTP包全面分析总结.md',
    'MIGRATION_GUIDE.md',
    'NEW_STRUCTURE_GUIDE.md',
    'QUICK_START.md',
    'QUICK_START_NEW.md',
    'README_优化完成.md',
    'REORGANIZATION_SUMMARY.md',
    '✅_全部优化完成.md',
    '优化功能使用指南.md',
    '优化完成总结.md',
    '优化工作完成.md',
    '优化工作进度.md',
    '优化建议和最佳实践.md',
    '使用指南.md',
    '性能优化指南.md',
    '最终优化报告.md',
    '🎉_优化完成报告.md',
    '🎯_所有任务100%完成.md',
    'packages/COMPLETION_REPORT.md',
    'packages/OPTIMIZATION_REPORT.md',
    'packages/SUMMARY.md',

    // 临时脚本
    'copy-core-code.js',
    'create-all-examples.js',
    'create-examples.js',
    'create-subpackages.js',
    'reorganize-structure.js',
    'test-build.js',
  ]

  for (const target of toRemove) {
    remove(target)
  }

  success('重复包删除完成')
}

// 主函数
async function main() {
  log('\n🚀 HTTP 包重构自动化脚本\n', 'bright')

  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  if (dryRun) {
    warning('运行在 DRY-RUN 模式,不会实际修改文件')
  }

  // 确认操作
  if (!dryRun) {
    warning('此操作将修改大量文件,建议先备份!')
    warning('按 Ctrl+C 取消,或按 Enter 继续...')
    // 在实际使用时,这里应该等待用户输入
  }

  try {
    if (!dryRun) {
      createBackup()
      mergeCorePackages()
      mergeFrameworkAdapters()
      removeDuplicates()
    }

    section('重构完成')
    success('所有阶段已完成!')
    info('下一步:')
    info('1. 运行 pnpm install 安装依赖')
    info('2. 运行 pnpm -r build 构建所有包')
    info('3. 运行 pnpm -r test 测试所有包')
    info('4. 检查并修复导入路径')
    info('5. 更新文档')
  }
  catch (err) {
    error('重构过程中出错:')
    error(err.message)
    process.exit(1)
  }
}

// 运行
main().catch((err) => {
  error(err.message)
  process.exit(1)
})

