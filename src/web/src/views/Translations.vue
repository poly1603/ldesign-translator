<template>
  <div class="translations">
    <n-card title="翻译管理" :bordered="false">
      <template #header-extra>
        <n-space>
          <n-button type="primary" @click="handleRefresh">
            🔄 刷新
          </n-button>
          <n-button @click="handleTranslate">
            🌐 批量翻译
          </n-button>
        </n-space>
      </template>

      <n-space vertical :size="16">
        <n-input
          v-model:value="searchText"
          placeholder="搜索翻译键或文本..."
          clearable
        >
          <template #prefix>
            <span>🔍</span>
          </template>
        </n-input>

        <n-data-table
          :columns="columns"
          :data="filteredTranslations"
          :loading="translatorStore.loading"
          :pagination="pagination"
          :bordered="false"
          striped
        />
      </n-space>
    </n-card>

    <!-- 翻译对话框 -->
    <n-modal
      v-model:show="showTranslateDialog"
      preset="dialog"
      title="批量翻译"
      positive-text="开始翻译"
      negative-text="取消"
      @positive-click="handleStartTranslate"
    >
      <n-form>
        <n-form-item label="目标语言">
          <n-select
            v-model:value="selectedLangs"
            :options="languageOptions"
            multiple
          />
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NInput,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NSelect,
  useMessage,
} from 'naive-ui'
import { useTranslatorStore } from '../store/translator'

const translatorStore = useTranslatorStore()
const message = useMessage()

const searchText = ref('')
const showTranslateDialog = ref(false)
const selectedLangs = ref<string[]>([])

const columns = [
  {
    title: '键',
    key: 'key',
    width: 200,
  },
  {
    title: '源文本',
    key: 'source',
    width: 300,
  },
  {
    title: '英文',
    key: 'translations.en',
    render: (row: any) => row.translations?.en || '-',
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row: any) => {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => handleEdit(row),
        },
        { default: () => '编辑' }
      )
    },
  },
]

const pagination = {
  pageSize: 20,
}

const languageOptions = computed(() => {
  if (!translatorStore.config) return []
  return translatorStore.config.targetLanguages.map((lang: string) => ({
    label: lang.toUpperCase(),
    value: lang,
  }))
})

const filteredTranslations = computed(() => {
  if (!searchText.value) {
    return translatorStore.translations
  }

  const search = searchText.value.toLowerCase()
  return translatorStore.translations.filter(
    (t) =>
      t.key.toLowerCase().includes(search) ||
      t.source.toLowerCase().includes(search)
  )
})

function handleRefresh() {
  translatorStore.loadTranslations()
}

function handleTranslate() {
  showTranslateDialog.value = true
  selectedLangs.value = translatorStore.config?.targetLanguages || []
}

async function handleStartTranslate() {
  try {
    message.loading('正在翻译...', { duration: 0 })
    
    for (const lang of selectedLangs.value) {
      const texts = translatorStore.translations.map((t) => t.source)
      await translatorStore.translate(texts, lang)
    }

    message.destroyAll()
    message.success('翻译完成!')
    await handleRefresh()
  } catch (error) {
    message.error('翻译失败')
  }
}

function handleEdit(row: any) {
  // 实现编辑功能
  message.info(`编辑: ${row.key}`)
}
</script>

<style scoped>
.translations {
  width: 100%;
}
</style>


