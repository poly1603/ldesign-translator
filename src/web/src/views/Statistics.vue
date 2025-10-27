<template>
  <div class="statistics">
    <n-card title="📈 翻译统计" :bordered="false">
      <n-space vertical :size="24">
        <!-- 总体统计 -->
        <n-grid :cols="4" :x-gap="16">
          <n-gi v-for="stat in overallStats" :key="stat.label">
            <n-statistic :label="stat.label" :value="stat.value">
              <template #prefix>
                <span style="font-size: 24px">{{ stat.icon }}</span>
              </template>
            </n-statistic>
          </n-gi>
        </n-grid>

        <n-divider />

        <!-- 按语言统计 -->
        <div>
          <h3 style="margin-bottom: 16px">语言统计</h3>
          <n-grid :cols="2" :x-gap="16" :y-gap="16">
            <n-gi v-for="lang in languageStats" :key="lang.language">
              <n-card :title="lang.language" size="small">
                <n-space vertical :size="12">
                  <div class="stat-row">
                    <span>已翻译:</span>
                    <span class="value">{{ lang.translated }}</span>
                  </div>
                  <div class="stat-row">
                    <span>未翻译:</span>
                    <span class="value">{{ lang.untranslated }}</span>
                  </div>
                  <n-progress
                    type="line"
                    :percentage="lang.percentage"
                    :indicator-placement="'inside'"
                  />
                </n-space>
              </n-card>
            </n-gi>
          </n-grid>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NCard,
  NSpace,
  NGrid,
  NGi,
  NStatistic,
  NDivider,
  NProgress,
} from 'naive-ui'
import { useTranslatorStore } from '../store/translator'

const translatorStore = useTranslatorStore()

const overallStats = computed(() => [
  {
    label: '总文本数',
    value: translatorStore.translations.length,
    icon: '📝',
  },
  {
    label: '目标语言',
    value: translatorStore.config?.targetLanguages.length || 0,
    icon: '🌐',
  },
  {
    label: '翻译提供商',
    value: translatorStore.config?.provider || '-',
    icon: '🔧',
  },
  {
    label: '源语言',
    value: translatorStore.config?.sourceLanguage || '-',
    icon: '🔤',
  },
])

const languageStats = computed(() => {
  const config = translatorStore.config
  if (!config) return []

  return config.targetLanguages.map((lang: string) => {
    const total = translatorStore.translations.length
    const translated = translatorStore.translations.filter(
      (t) => t.translations[lang]
    ).length
    const untranslated = total - translated
    const percentage = total > 0 ? (translated / total) * 100 : 0

    return {
      language: lang.toUpperCase(),
      translated,
      untranslated,
      percentage: Math.round(percentage),
    }
  })
})

onMounted(() => {
  translatorStore.loadTranslations()
})
</script>

<style scoped>
.statistics {
  width: 100%;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row .value {
  font-weight: 600;
  font-size: 16px;
}
</style>


