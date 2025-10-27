import { describe, it, expect } from 'vitest'
import {
  hasChinese,
  extractChinese,
  generateKey,
  calculateSimilarity,
  isValidLanguageCode,
  normalizeLanguageCode,
  cleanText,
} from '../utils/pattern-matcher'

describe('pattern-matcher', () => {
  describe('hasChinese', () => {
    it('should detect Chinese characters', () => {
      expect(hasChinese('你好世界')).toBe(true)
      expect(hasChinese('Hello 世界')).toBe(true)
      expect(hasChinese('Hello World')).toBe(false)
      expect(hasChinese('123456')).toBe(false)
    })
  })

  describe('extractChinese', () => {
    it('should extract Chinese text', () => {
      const result = extractChinese('Hello 你好 World 世界')
      expect(result).toContain('你好')
      expect(result).toContain('世界')
      expect(result.length).toBe(2)
    })

    it('should return empty array for non-Chinese text', () => {
      const result = extractChinese('Hello World')
      expect(result).toEqual([])
    })
  })

  describe('generateKey', () => {
    it('should generate key from text', () => {
      const key = generateKey('你好世界')
      expect(key).toBeTruthy()
      expect(typeof key).toBe('string')
    })

    it('should include namespace if provided', () => {
      const key = generateKey('你好世界', 'common')
      expect(key).toContain('common.')
    })
  })

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const similarity = calculateSimilarity('你好', '你好')
      expect(similarity).toBe(1)
    })

    it('should return 0 for completely different strings', () => {
      const similarity = calculateSimilarity('你好', 'abcdefg')
      expect(similarity).toBeLessThan(0.5)
    })

    it('should return value between 0 and 1 for similar strings', () => {
      const similarity = calculateSimilarity('你好世界', '你好中国')
      expect(similarity).toBeGreaterThan(0)
      expect(similarity).toBeLessThan(1)
    })
  })

  describe('isValidLanguageCode', () => {
    it('should validate common language codes', () => {
      expect(isValidLanguageCode('en')).toBe(true)
      expect(isValidLanguageCode('zh-CN')).toBe(true)
      expect(isValidLanguageCode('ja')).toBe(true)
      expect(isValidLanguageCode('ko')).toBe(true)
    })

    it('should reject invalid codes', () => {
      expect(isValidLanguageCode('invalid')).toBe(false)
      expect(isValidLanguageCode('xyz')).toBe(false)
    })
  })

  describe('normalizeLanguageCode', () => {
    it('should normalize language codes', () => {
      expect(normalizeLanguageCode('zh-cn')).toBe('zh-CN')
      expect(normalizeLanguageCode('zh-tw')).toBe('zh-TW')
      expect(normalizeLanguageCode('chinese')).toBe('zh-CN')
      expect(normalizeLanguageCode('english')).toBe('en')
    })
  })

  describe('cleanText', () => {
    it('should clean text', () => {
      expect(cleanText('  你好  世界  ')).toBe('你好 世界')
      expect(cleanText('你好\n世界')).toBe('你好 世界')
      expect(cleanText('你好\t世界')).toBe('你好 世界')
    })
  })
})


