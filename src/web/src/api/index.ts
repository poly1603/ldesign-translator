import axios from 'axios'
import type { TranslationEntry } from '../types'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export const api = {
  async getConfig() {
    const { data } = await client.get('/config')
    return data
  },

  async getTranslations(): Promise<TranslationEntry[]> {
    const { data } = await client.get('/translations')
    return data.translations
  },

  async translate(texts: string[], targetLang: string) {
    const { data } = await client.post('/translate', { texts, targetLang })
    return data.results
  },

  async updateTranslation(key: string, lang: string, value: string) {
    const { data } = await client.put(`/translations/${key}`, { lang, value })
    return data
  },

  async exportToExcel(languages: string[]) {
    const { data } = await client.post('/export', { languages })
    return data
  },

  async importFromExcel(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await client.post('/import', formData)
    return data
  },
}


