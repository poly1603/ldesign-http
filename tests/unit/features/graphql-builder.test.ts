import { describe, it, expect } from 'vitest'
import {
  GraphQLQueryBuilder,
  FieldBuilder,
  query,
  mutation,
  subscription,
  field,
} from '../../../packages/core/src/features/graphql-builder'

describe('GraphQLQueryBuilder', () => {
  describe('基础功能', () => {
    it('应该创建一个简单的查询', () => {
      const builder = new GraphQLQueryBuilder('query')
      builder.field('users')
      
      const result = builder.build()
      expect(result).toContain('query')
      expect(result).toContain('users')
    })

    it('应该创建带名称的查询', () => {
      const builder = new GraphQLQueryBuilder('query')
      builder.name('GetUsers').field('users')
      
      const result = builder.build()
      expect(result).toContain('query GetUsers')
    })

    it('应该支持不同的操作类型', () => {
      const queryBuilder = new GraphQLQueryBuilder('query')
      const mutationBuilder = new GraphQLQueryBuilder('mutation')
      const subscriptionBuilder = new GraphQLQueryBuilder('subscription')

      expect(queryBuilder.build()).toContain('query')
      expect(mutationBuilder.build()).toContain('mutation')
      expect(subscriptionBuilder.build()).toContain('subscription')
    })
  })

  describe('变量处理', () => {
    it('应该添加单个变量', () => {
      const builder = query('GetUser')
        .variable('id', 'ID!')
        .field('user')

      const result = builder.build()
      expect(result).toContain('query GetUser($id: ID!)')
    })

    it('应该添加带默认值的变量', () => {
      const builder = query('GetUsers')
        .variable('limit', 'Int', 10)
        .field('users')

      const result = builder.build()
      expect(result).toContain('$limit: Int = 10')
    })

    it('应该批量添加变量', () => {
      const builder = query('GetUser')
        .variables({
          id: 'ID!',
          includeEmail: 'Boolean',
        })
        .field('user')

      const result = builder.build()
      expect(result).toContain('$id: ID!')
      expect(result).toContain('$includeEmail: Boolean')
    })

    it('应该处理复杂的默认值', () => {
      const builder = query('GetUsers')
        .variable('filter', 'UserFilter', { status: 'ACTIVE' })
        .field('users')

      const result = builder.build()
      expect(result).toContain('$filter: UserFilter = {status: ACTIVE}')
    })
  })

  describe('字段选择', () => {
    it('应该选择简单字段', () => {
      const builder = query()
        .field('id')
        .field('name')
        .field('email')

      const result = builder.build()
      expect(result).toContain('id')
      expect(result).toContain('name')
      expect(result).toContain('email')
    })

    it('应该选择带参数的字段', () => {
      const builder = query()
        .fieldWithArgs('user', { id: '$id' }, [
          { name: 'id' },
          { name: 'name' },
        ])

      const result = builder.build()
      expect(result).toContain('user(id: $id)')
    })

    it('应该选择带别名的字段', () => {
      const builder = query()
        .fieldWithAlias('currentUser', 'user', {
          arguments: { id: '$userId' },
        })

      const result = builder.build()
      expect(result).toContain('currentUser: user(id: $userId)')
    })

    it('应该支持嵌套字段', () => {
      const builder = query()
        .fieldWithNested('user', (f) => {
          f.select('id')
           .select('name')
           .selectNested('posts', (p) => {
             p.select('title')
              .select('content')
           })
        })

      const result = builder.build()
      expect(result).toContain('user')
      expect(result).toContain('id')
      expect(result).toContain('posts')
      expect(result).toContain('title')
    })

    it('应该处理复杂的参数类型', () => {
      const builder = query()
        .field('users', {
          arguments: {
            filter: { status: 'ACTIVE', role: 'ADMIN' },
            orderBy: ['name', 'createdAt'],
            limit: 10,
          },
        })

      const result = builder.build()
      expect(result).toContain('filter: {status: ACTIVE, role: ADMIN}')
      expect(result).toContain('orderBy: [name, createdAt]')
      expect(result).toContain('limit: 10')
    })
  })

  describe('Fragment 支持', () => {
    it('应该定义和使用 Fragment', () => {
      const builder = query('GetUser')
        .variable('id', 'ID!')
        .fragment('UserFields', 'User', (f) => {
          f.select('id')
           .select('name')
           .select('email')
        })
        .field('user', {
          arguments: { id: '$id' },
        })
        .useFragment('UserFields')

      const result = builder.build()
      expect(result).toContain('fragment UserFields on User')
      expect(result).toContain('...UserFields')
    })

    it('应该支持内联 Fragment', () => {
      const builder = query()
        .field('users')
        .inlineFragment('Admin', (f) => {
          f.select('role')
           .select('permissions')
        })

      const result = builder.build()
      expect(result).toContain('... on Admin')
      expect(result).toContain('role')
      expect(result).toContain('permissions')
    })

    it('应该支持多个 Fragment', () => {
      const builder = query()
        .fragment('BasicUser', 'User', (f) => {
          f.select('id').select('name')
        })
        .fragment('ExtendedUser', 'User', (f) => {
          f.select('email').select('phone')
        })
        .field('user')
        .useFragment('BasicUser')
        .useFragment('ExtendedUser')

      const result = builder.build()
      expect(result).toContain('fragment BasicUser on User')
      expect(result).toContain('fragment ExtendedUser on User')
      expect(result).toContain('...BasicUser')
      expect(result).toContain('...ExtendedUser')
    })
  })

  describe('指令支持', () => {
    it('应该添加查询级指令', () => {
      const builder = query()
        .directive('cached', { ttl: 3600 })
        .field('users')

      const result = builder.build()
      expect(result).toContain('@cached(ttl: 3600)')
    })

    it('应该添加字段级指令', () => {
      const builder = query()
        .field('email', {
          directives: [
            { name: 'include', arguments: { if: '$includeEmail' } },
          ],
        })

      const result = builder.build()
      expect(result).toContain('email @include(if: $includeEmail)')
    })

    it('应该支持多个指令', () => {
      const builder = query()
        .field('user', {
          directives: [
            { name: 'include', arguments: { if: '$includeUser' } },
            { name: 'skip', arguments: { if: '$skipUser' } },
          ],
        })

      const result = builder.build()
      expect(result).toContain('@include(if: $includeUser)')
      expect(result).toContain('@skip(if: $skipUser)')
    })
  })

  describe('值序列化', () => {
    it('应该正确序列化字符串', () => {
      const builder = query()
        .field('user', {
          arguments: { name: 'John' },
        })

      const result = builder.build()
      expect(result).toContain('name: "John"')
    })

    it('应该正确序列化数字和布尔值', () => {
      const builder = query()
        .field('users', {
          arguments: {
            limit: 10,
            active: true,
          },
        })

      const result = builder.build()
      expect(result).toContain('limit: 10')
      expect(result).toContain('active: true')
    })

    it('应该正确序列化变量引用', () => {
      const builder = query()
        .variable('userId', 'ID!')
        .field('user', {
          arguments: { id: '$userId' },
        })

      const result = builder.build()
      expect(result).toContain('id: $userId')
    })

    it('应该正确序列化枚举值', () => {
      const builder = query()
        .field('users', {
          arguments: {
            status: 'ACTIVE',
            role: 'Admin',
          },
        })

      const result = builder.build()
      expect(result).toContain('status: ACTIVE')
      expect(result).toContain('role: Admin')
    })

    it('应该正确序列化 null 值', () => {
      const builder = query()
        .field('user', {
          arguments: { email: null },
        })

      const result = builder.build()
      expect(result).toContain('email: null')
    })
  })

  describe('辅助函数', () => {
    it('query() 应该创建查询构建器', () => {
      const builder = query('GetUsers')
      expect(builder).toBeInstanceOf(GraphQLQueryBuilder)
      expect(builder.build()).toContain('query GetUsers')
    })

    it('mutation() 应该创建变更构建器', () => {
      const builder = mutation('CreateUser')
      expect(builder).toBeInstanceOf(GraphQLQueryBuilder)
      expect(builder.build()).toContain('mutation CreateUser')
    })

    it('subscription() 应该创建订阅构建器', () => {
      const builder = subscription('OnUserCreated')
      expect(builder).toBeInstanceOf(GraphQLQueryBuilder)
      expect(builder.build()).toContain('subscription OnUserCreated')
    })

    it('field() 应该创建字段构建器', () => {
      const builder = field('user')
      expect(builder).toBeInstanceOf(FieldBuilder)
    })
  })

  describe('FieldBuilder', () => {
    it('应该构建简单字段', () => {
      const builder = field('user')
        .select('id')
        .select('name')

      const result = builder.build()
      expect(result.name).toBe('user')
      expect(result.fields).toHaveLength(2)
    })

    it('应该设置字段别名', () => {
      const builder = field('user')
        .alias('currentUser')

      const result = builder.build()
      expect(result.alias).toBe('currentUser')
    })

    it('应该设置字段参数', () => {
      const builder = field('user')
        .args({ id: '$userId' })

      const result = builder.build()
      expect(result.arguments).toEqual({ id: '$userId' })
    })

    it('应该添加字段指令', () => {
      const builder = field('email')
        .directive('include', { if: '$includeEmail' })

      const result = builder.build()
      expect(result.directives).toHaveLength(1)
      expect(result.directives?.[0].name).toBe('include')
    })

    it('应该选择多个字段', () => {
      const builder = field('user')
        .selectMany('id', 'name', 'email')

      const result = builder.build()
      expect(result.fields).toHaveLength(3)
    })

    it('应该支持嵌套字段构建', () => {
      const builder = field('user')
        .selectNested('posts', (p) => {
          p.select('id')
           .select('title')
        })

      const result = builder.build()
      expect(result.fields?.[0].fields).toHaveLength(2)
    })

    it('应该使用 Fragment', () => {
      const builder = field('user')
        .useFragment('UserFields')

      const result = builder.build()
      expect(result.fields?.[0].name).toBe('...UserFields')
    })
  })

  describe('复杂场景', () => {
    it('应该构建完整的查询', () => {
      const builder = query('GetUserWithPosts')
        .variable('userId', 'ID!')
        .variable('postLimit', 'Int', 10)
        .fragment('PostFields', 'Post', (f) => {
          f.select('id')
           .select('title')
           .select('content')
           .select('createdAt')
        })
        .fieldWithNested('user', (f) => {
          f.args({ id: '$userId' })
           .select('id')
           .select('name')
           .select('email')
           .selectNested('posts', (p) => {
             p.args({ limit: '$postLimit' })
              .useFragment('PostFields')
           })
        })

      const result = builder.build()
      expect(result).toContain('query GetUserWithPosts')
      expect(result).toContain('$userId: ID!')
      expect(result).toContain('$postLimit: Int = 10')
      expect(result).toContain('fragment PostFields on Post')
      expect(result).toContain('user(id: $userId)')
      expect(result).toContain('posts(limit: $postLimit)')
      expect(result).toContain('...PostFields')
    })

    it('应该构建带条件的查询', () => {
      const builder = query('GetUserConditional')
        .variable('id', 'ID!')
        .variable('includeEmail', 'Boolean!')
        .variable('includePosts', 'Boolean!')
        .fieldWithNested('user', (f) => {
          f.args({ id: '$id' })
           .select('id')
           .select('name')
           .select('email', {
             directives: [
               { name: 'include', arguments: { if: '$includeEmail' } },
             ],
           })
           .select('posts', {
             directives: [
               { name: 'include', arguments: { if: '$includePosts' } },
             ],
           })
        })

      const result = builder.build()
      expect(result).toContain('@include(if: $includeEmail)')
      expect(result).toContain('@include(if: $includePosts)')
    })

    it('应该构建批量查询', () => {
      const builder = query('GetMultipleUsers')
        .variable('ids', '[ID!]!')
        .fragment('UserFields', 'User', (f) => {
          f.select('id')
           .select('name')
           .select('email')
        })
        .fieldWithNested('users', (f) => {
          f.args({ ids: '$ids' })
           .useFragment('UserFields')
        })

      const result = builder.build()
      expect(result).toContain('$ids: [ID!]!')
      expect(result).toContain('users(ids: $ids)')
      expect(result).toContain('fragment UserFields on User')
    })
  })

  describe('边界情况', () => {
    it('应该处理空字段列表', () => {
      const builder = query()
      const result = builder.build()
      expect(result).toBe('query')
    })

    it('应该处理空变量', () => {
      const builder = query('Test')
        .field('users')
      
      const result = builder.build()
      expect(result).not.toContain('$')
    })

    it('应该处理特殊字符', () => {
      const builder = query()
        .field('user', {
          arguments: {
            name: "O'Brien",
          },
        })

      const result = builder.build()
      expect(result).toContain('"O\'Brien"')
    })

    it('toString() 应该等同于 build()', () => {
      const builder = query('Test')
        .field('users')

      expect(builder.toString()).toBe(builder.build())
    })
  })

  describe('类型推断', () => {
    it('应该正确识别变量引用', () => {
      const builder = query()
        .field('user', {
          arguments: {
            id: '$userId',  // 变量引用
            name: 'John',   // 字符串
          },
        })

      const result = builder.build()
      expect(result).toContain('id: $userId')
      expect(result).toContain('name: "John"')
    })

    it('应该正确识别枚举值', () => {
      const builder = query()
        .field('users', {
          arguments: {
            status: 'ACTIVE',  // 枚举（全大写）
            role: 'Admin',     // 枚举（PascalCase）
            name: 'test',      // 字符串（小写）
          },
        })

      const result = builder.build()
      expect(result).toContain('status: ACTIVE')
      expect(result).toContain('role: Admin')
      expect(result).toContain('name: "test"')
    })
  })
})