<template>
  <div class="home">
    <n-layout>
      <n-layout-header bordered style="height: 64px; padding: 0 24px">
        <div class="header">
          <h1 class="title">🌐 LDesign Translator</h1>
          <div class="actions">
            <n-button quaternary @click="themeStore.toggleTheme">
              {{ themeStore.isDark ? '☀️' : '🌙' }}
            </n-button>
          </div>
        </div>
      </n-layout-header>

      <n-layout has-sider style="height: calc(100vh - 64px)">
        <n-layout-sider
          bordered
          show-trigger
          collapse-mode="width"
          :collapsed-width="64"
          :width="240"
          :native-scrollbar="false"
        >
          <n-menu
            :options="menuOptions"
            :value="activeMenu"
            @update:value="handleMenuSelect"
          />
        </n-layout-sider>

        <n-layout-content
          content-style="padding: 24px;"
          :native-scrollbar="false"
        >
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NButton,
} from 'naive-ui'
import { useThemeStore } from '../store/theme'
import { useTranslatorStore } from '../store/translator'

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const translatorStore = useTranslatorStore()

const activeMenu = ref('translations')

const menuOptions = [
  {
    label: '翻译管理',
    key: 'translations',
    icon: () => h('span', '📝'),
  },
  {
    label: '导入导出',
    key: 'import-export',
    icon: () => h('span', '📊'),
  },
  {
    label: '统计信息',
    key: 'statistics',
    icon: () => h('span', '📈'),
  },
]

function handleMenuSelect(key: string) {
  activeMenu.value = key
  router.push(`/${key}`)
}

onMounted(() => {
  translatorStore.loadConfig()
  
  // 根据当前路由设置活动菜单
  const path = route.path.slice(1)
  if (path) {
    activeMenu.value = path
  }
})
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
}

.header {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 12px;
}
</style>


