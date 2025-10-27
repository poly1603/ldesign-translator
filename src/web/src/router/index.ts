import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/translations',
      name: 'Translations',
      component: () => import('../views/Translations.vue'),
    },
    {
      path: '/import-export',
      name: 'ImportExport',
      component: () => import('../views/ImportExport.vue'),
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: () => import('../views/Statistics.vue'),
    },
  ],
})

export default router


