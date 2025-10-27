<template>
  <div class="import-export">
    <n-grid :cols="2" :x-gap="24">
      <!-- 导出 -->
      <n-gi>
        <n-card title="📤 导出到 Excel" :bordered="false">
          <n-space vertical :size="16">
            <n-form>
              <n-form-item label="选择语言">
                <n-select
                  v-model:value="exportLangs"
                  :options="languageOptions"
                  multiple
                />
              </n-form-item>

              <n-form-item label="包含元数据">
                <n-switch v-model:value="includeMetadata" />
              </n-form-item>
            </n-form>

            <n-button
              type="primary"
              block
              :loading="exporting"
              @click="handleExport"
            >
              导出 Excel
            </n-button>
          </n-space>
        </n-card>
      </n-gi>

      <!-- 导入 -->
      <n-gi>
        <n-card title="📥 从 Excel 导入" :bordered="false">
          <n-space vertical :size="16">
            <n-upload
              :custom-request="handleImport"
              :show-file-list="true"
              accept=".xlsx,.xls"
              :max="1"
            >
              <n-button>点击选择 Excel 文件</n-button>
            </n-upload>

            <n-alert type="info" title="提示">
              <ul style="margin: 8px 0; padding-left: 20px">
                <li>文件必须包含 'key' 和 'source' 列</li>
                <li>语言列使用语言代码命名 (en, ja, ko 等)</li>
                <li>导入将覆盖已存在的翻译</li>
              </ul>
            </n-alert>
          </n-space>
        </n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NGrid,
  NGi,
  NCard,
  NSpace,
  NForm,
  NFormItem,
  NSelect,
  NSwitch,
  NButton,
  NUpload,
  NAlert,
  useMessage,
  type UploadCustomRequestOptions,
} from 'naive-ui'
import { useTranslatorStore } from '../store/translator'
import { api } from '../api'

const translatorStore = useTranslatorStore()
const message = useMessage()

const exportLangs = ref<string[]>([])
const includeMetadata = ref(false)
const exporting = ref(false)

const languageOptions = computed(() => {
  if (!translatorStore.config) return []
  return [
    { label: translatorStore.config.sourceLanguage.toUpperCase(), value: translatorStore.config.sourceLanguage },
    ...translatorStore.config.targetLanguages.map((lang: string) => ({
      label: lang.toUpperCase(),
      value: lang,
    })),
  ]
})

async function handleExport() {
  try {
    exporting.value = true
    await api.exportToExcel(exportLangs.value)
    message.success('导出成功!')
  } catch (error) {
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}

async function handleImport(options: UploadCustomRequestOptions) {
  try {
    const file = options.file.file as File
    message.loading('正在导入...', { duration: 0 })
    
    await api.importFromExcel(file)
    
    message.destroyAll()
    message.success('导入成功!')
    
    // 刷新翻译列表
    await translatorStore.loadTranslations()
  } catch (error) {
    message.destroyAll()
    message.error('导入失败')
  }
}
</script>

<style scoped>
.import-export {
  width: 100%;
}
</style>


