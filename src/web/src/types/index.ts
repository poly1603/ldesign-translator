export interface TranslationEntry {
  key: string
  source: string
  translations: Record<string, string>
  metadata?: {
    file?: string
    line?: number
    context?: string
  }
}

export interface TranslatorConfig {
  sourceLanguage: string
  targetLanguages: string[]
  provider: string
}


