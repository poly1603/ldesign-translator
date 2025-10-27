import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TranslationEntry } from '../types'
import { api } from '../api'

export const useTranslatorStore = defineStore('translator', () => {
  const translations = ref<TranslationEntry[]>([])
  const loading = ref(false)
  const config = ref<any>(null)

  async function loadConfig() {
    loading.value = true
    try {
      config.value = await api.getConfig()
    } finally {
      loading.value = false
    }
  }

  async function loadTranslations() {
    loading.value = true
    try {
      translations.value = await api.getTranslations()
    } finally {
      loading.value = false
    }
  }

  async function translate(texts: string[], targetLang: string) {
    loading.value = true
    try {
      const results = await api.translate(texts, targetLang)
      return results
    } finally {
      loading.value = false
    }
  }

  async function updateTranslation(
    key: string,
    lang: string,
    value: string
  ) {
    await api.updateTranslation(key, lang, value)
    await loadTranslations()
  }

  return {
    translations,
    loading,
    config,
    loadConfig,
    loadTranslations,
    translate,
    updateTranslation,
  }
})


