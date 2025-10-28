import { describe, it, expect } from 'vitest'
import {
  extractPlaceholders,
  validatePlaceholders,
  validateHtmlTags,
  protectPlaceholders,
  restorePlaceholders,
} from '../utils/pattern-matcher.js'

describe('占位符提取', () => {
  it('应该提取花括号占位符', () => {
    const text = '你好，{name}！今天是{date}'
    const result = extractPlaceholders(text)

    expect(result.type).toBe('curly')
    expect(result.placeholders).toContain('{name}')
    expect(result.placeholders).toContain('{date}')
    expect(result.placeholders).toHaveLength(2)
  })

  it('应该提取百分号占位符', () => {
    const text = 'Hello %s, you have %d messages'
    const result = extractPlaceholders(text)

    expect(result.type).toBe('percent')
    expect(result.placeholders).toContain('%s')
    expect(result.placeholders).toContain('%d')
  })

  it('应该提取美元符占位符', () => {
    const text = 'Hello $name, your balance is ${balance}'
    const result = extractPlaceholders(text)

    expect(result.type).toBe('dollar')
    expect(result.placeholders.length).toBeGreaterThan(0)
  })

  it('应该处理没有占位符的文本', () => {
    const text = '这是一段普通文本'
    const result = extractPlaceholders(text)

    expect(result.type).toBe('none')
    expect(result.placeholders).toHaveLength(0)
  })
})

describe('占位符验证', () => {
  it('应该验证占位符完整性', () => {
    const source = '你好，{name}！'
    const translation = 'Hello, {name}!'

    const result = validatePlaceholders(source, translation)

    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
    expect(result.extra).toHaveLength(0)
  })

  it('应该检测缺失的占位符', () => {
    const source = '你好，{name}！今天是{date}'
    const translation = 'Hello, {name}!'

    const result = validatePlaceholders(source, translation)

    expect(result.valid).toBe(false)
    expect(result.missing).toContain('{date}')
  })

  it('应该检测额外的占位符', () => {
    const source = '你好，{name}！'
    const translation = 'Hello, {name}! Today is {date}'

    const result = validatePlaceholders(source, translation)

    expect(result.valid).toBe(false)
    expect(result.extra).toContain('{date}')
  })
})

describe('HTML 标签验证', () => {
  it('应该验证 HTML 标签完整性', () => {
    const source = '这是<strong>重要</strong>内容'
    const translation = 'This is <strong>important</strong> content'

    const result = validateHtmlTags(source, translation)

    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
    expect(result.extra).toHaveLength(0)
  })

  it('应该检测缺失的标签', () => {
    const source = '这是<strong>重要</strong>内容'
    const translation = 'This is important content'

    const result = validateHtmlTags(source, translation)

    expect(result.valid).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
  })

  it('应该检测额外的标签', () => {
    const source = '这是重要内容'
    const translation = 'This is <strong>important</strong> content'

    const result = validateHtmlTags(source, translation)

    expect(result.valid).toBe(false)
    expect(result.extra.length).toBeGreaterThan(0)
  })
})

describe('占位符保护和恢复', () => {
  it('应该保护占位符', () => {
    const text = '你好，{name}！今天是{date}'
    const result = protectPlaceholders(text)

    expect(result.protected).not.toContain('{name}')
    expect(result.protected).not.toContain('{date}')
    expect(result.protected).toContain('__PLACEHOLDER_')
    expect(result.placeholders.size).toBe(2)
  })

  it('应该恢复占位符', () => {
    const text = '你好，{name}！今天是{date}'
    const { protected: protectedText, placeholders } = protectPlaceholders(text)

    const restored = restorePlaceholders(protectedText, placeholders)

    expect(restored).toBe(text)
  })

  it('应该正确处理翻译流程', () => {
    const original = '欢迎{name}，你有{count}条消息'

    // 保护占位符
    const { protected: protectedText, placeholders } = protectPlaceholders(original)

    // 模拟翻译（占位符被保护）
    const translatedWithMarkers = protectedText
      .replace('欢迎', 'Welcome')
      .replace('你有', 'you have')
      .replace('条消息', 'messages')

    // 恢复占位符
    const final = restorePlaceholders(translatedWithMarkers, placeholders)

    expect(final).toContain('{name}')
    expect(final).toContain('{count}')
    expect(final).toContain('Welcome')
  })
})
