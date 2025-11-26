# 测试修复计划

## 📊 当前状态

**测试通过率**: 71% (525/739 通过)
- ✅ 测试文件: 19/39 通过
- ✅ 测试用例: 525/739 通过
- ❌ 失败: 214个用例
- ⚠️ 未处理错误: 5个

## ✅ 已完成的工作

### 阶段1: 导入路径修复 (18个文件) ✅
所有测试文件的导入路径已从错误的 `../../src/` 修复为正确的 `../../packages/core/src/`

**修复效果**:
- 通过率从 55% 提升到 71%
- 提升了 16 个百分点
- 解决了模块找不到的根本问题

## 🔧 待修复问题清单

### 优先级 P0 - Vue组件渲染问题 (174个失败)

#### 问题描述
```
TypeError: Cannot read properties of null (reading 'ce')
at renderSlot
```

所有Vue组件测试都因为slot渲染上下文为null而失败。

#### 受影响的文件
1. `tests/unit/vue/components/HttpProvider.test.ts` - 13个失败
2. `tests/unit/vue/components/HttpError.test.ts` - 38个失败
3. `tests/unit/vue/components/HttpProgress.test.ts` - 62个失败
4. `tests/unit/vue/components/HttpRetry.test.ts` - 33个失败
5. `tests/unit/vue/components/HttpLoader.test.ts` - 28个失败

#### 根本原因
- Vitest的Vue测试环境配置不完整
- `@vue/test-utils` 的 mount 配置缺少全局属性
- 组件依赖注入(provide/inject)在测试中未正确设置

#### 解决方案
```typescript
// tests/setup.ts 需要添加
import { config } from '@vue/test-utils'

config.global.config.errorHandler = (err) => {
  console.error('Vue Error:', err)
}

config.global.config.warnHandler = (msg) => {
  console.warn('Vue Warning:', msg)
}

// 每个组件测试需要添加
const wrapper = mount(Component, {
  global: {
    stubs: {
      teleport: true
    },
    provide: {
      // 提供必要的依赖
    }
  },
  slots: {
    default: () => h('div', 'slot content')
  }
})
```

**预计工作量**: 2-3小时
**预计提升**: +174个用例通过，通过率提升到 94%

---

### 优先级 P1 - 格式化函数测试 (6个失败)

#### 问题1: formatFileSize 显示小数点
```typescript
// 期望: '500 B'
// 实际: '500.00 B'
```

**位置**: `packages/vue/src/components/HttpProgress/HttpProgress.vue`

**解决方案**:
```typescript
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  // 对于字节单位不显示小数
  if (i === 0) {
    return `${bytes} B`
  }
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}
```

#### 问题2: formatProgressTime 时间单位显示
```typescript
// 期望: '1分钟' 
// 实际: '1分0秒'

// 期望: '1小时'
// 实际: '1小时0分'

// 期望: '1天'
// 实际: '24小时0分'
```

**解决方案**: 优化时间格式化逻辑，隐藏为0的单位

**预计工作量**: 30分钟
**预计提升**: +6个用例通过

---

### 优先级 P2 - GraphQL Builder (3个失败)

#### 失败的测试
1. `应该处理复杂的参数类型`
2. `应该正确序列化字符串`
3. `应该正确识别变量引用`

#### 问题位置
`packages/core/src/features/graphql.ts` - GraphQLQueryBuilder类

#### 解决方案
需要检查和修复：
1. 参数序列化逻辑
2. 字符串转义处理
3. 变量引用的正则表达式

**预计工作量**: 1小时
**预计提升**: +3个用例通过

---

### 优先级 P3 - Interceptor Manager (2个失败)

#### 失败的测试
1. `should iterate over all interceptors`
2. `should skip ejected interceptors`

#### 问题位置
`packages/core/src/interceptors/manager.ts` - forEach实现

#### 解决方案
检查forEach方法的拦截器迭代逻辑，确保正确跳过已移除的拦截器。

**预计工作量**: 30分钟
**预计提升**: +2个用例通过

---

### 优先级 P4 - 未处理的Promise Rejection (5个错误)

#### 问题描述
```
Error: Replay queue cleared
at RequestReplayer.clearQueue
```

#### 问题位置
`packages/core/src/features/request-replay.ts:352`

#### 根本原因
测试中调用 `clearQueue(true)` 时，reject的Promise没有被catch处理。

#### 解决方案
```typescript
// tests/unit/features/request-replay.test.ts
it('应该正确统计重放结果', async () => {
  // ...
  try {
    await replayer.clearQueue(true)
  } catch (error) {
    // 预期的错误，忽略
  }
})
```

**预计工作量**: 15分钟
**预计提升**: 消除5个未处理错误

---

### 优先级 P5 - Circle Path 计算 (2个失败)

#### 失败的测试
1. `应该计算圆形路径`
2. `应该计算仪表盘路径`

#### 问题
```typescript
expect(result.perimeter).toBeGreaterThan(0)
// 实际返回: 0
```

#### 问题位置
`packages/vue/src/components/HttpProgress/HttpProgress.vue` - getCirclePath函数

#### 解决方案
检查SVG路径计算逻辑，确保perimeter正确计算。

**预计工作量**: 30分钟
**预计提升**: +2个用例通过

---

## 📈 修复优先级总结

| 优先级 | 问题 | 失败数 | 工作量 | 预计通过率 |
|--------|------|--------|--------|------------|
| 当前 | - | 214 | - | 71% |
| P0 | Vue组件渲染 | 174 | 2-3h | 94.4% |
| P1 | 格式化函数 | 6 | 30m | 95.2% |
| P2 | GraphQL | 3 | 1h | 95.6% |
| P3 | Interceptor | 2 | 30m | 95.9% |
| P4 | Promise Rejection | 5 errors | 15m | 95.9% |
| P5 | Circle Path | 2 | 30m | 96.2% |
| **目标** | **全部修复** | **0** | **~5h** | **~96%** |

## 🎯 执行计划

### 第一阶段: P0修复 (2-3小时)
修复所有Vue组件测试的渲染问题，这将带来最大的通过率提升。

### 第二阶段: P1-P3修复 (2小时)
修复格式化函数、GraphQL和拦截器的逻辑问题。

### 第三阶段: P4-P5清理 (1小时)
清理未处理错误和边界情况。

### 最终验证
- 运行完整测试套件
- 确认通过率达到 95%+
- 生成测试覆盖率报告

## 📝 注意事项

1. **每次修复后都要运行测试验证**
2. **保持向后兼容性**
3. **更新相关文档和注释**
4. **考虑添加回归测试**

## 🔗 相关文档

- [项目优化分析](./PROJECT_ANALYSIS_AND_OPTIMIZATION.md)
- [HTTP优化指南](./HTTP_OPTIMIZATION_GUIDE.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)